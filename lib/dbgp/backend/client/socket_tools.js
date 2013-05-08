var xml2json = require('xml2json');

/* ************************************************************************** */

//
// Accept connections to the DBGp client.
//
// The DBGp protocol is documented at http://xdebug.org/docs-dbgp.php. Generally
// this block takes care of receiving the data and passing on the messages once
// they are fully available.
//
module.exports.upgrade = function (socket, logger) {
    socket.tidebugLogger = logger;

    // Used for unique transaction IDs, keep track of how many commands we send.
    socket.tidebugSendCount = 0;

    // When we send messages to the backend, we retain callbacks for invoking
    // when we receive replies.
    socket.tidebugCallbacks = {};

    // Use a buffer to hold partial messages as we receive them.
    socket.tidebugRecvDataBuffer = '';

    socket.setEncoding('utf8');

    socket.tidebugRecvMessage = module.exports.socketRecvMessage.bind(socket);
    socket.tidebugRecvData = module.exports.socketRecvData.bind(socket);
    socket.sendMessage = module.exports.socketSendMessage.bind(socket);

    socket.on('data', socket.tidebugRecvData);
};

// Create a function for converting a text-based message into a usable JSON
// representation and then call the appropriate callback or event that can
// receive the message.
module.exports.socketRecvMessage = function (str) {
    // doesn't like the xml header - @todo this should probably be dynamic
    str = str.slice(45, str.length);

    obj = xml2json.toJson(str, { object : true });

    if (this.tidebugLogger) {
        this.tidebugLogger.debug('[dbgp#' + this.remoteAddress + ':' + this.remotePort + '] recv ' + str);
    }

    if (obj.response && obj.response.transaction_id && this.tidebugCallbacks[obj.response.transaction_id]) {
        this.tidebugCallbacks[obj.response.transaction_id](obj.response);
        delete this.tidebugCallbacks[obj.response.transaction_id];
    } else {
        this.emit('payload', obj);
    }
}

// Create a function which handles additional message data that we can add
// to our buffer. Always try to parse the extra data to see if we have a
// full message that we can pass on to `recvMessage`.
module.exports.socketRecvData = function (data) {
    if (data) {
        this.tidebugRecvDataBuffer += data;
    }

    var nil = false;

    for (var i = 0; i < 16; i ++) {
        if (this.tidebugRecvDataBuffer.charCodeAt(i) == 0) {
            nil = i;
            break;
        }
    }

    if (nil === false) {
        // waiting for more data
        return;
    }

    size = parseInt(this.tidebugRecvDataBuffer.slice(0, nil));

    // we received multiple messages...
    if (this.tidebugRecvDataBuffer.length >= (size + nil)) {
        var message = this.tidebugRecvDataBuffer.slice(nil, nil + 1 + size);
        this.tidebugRecvDataBuffer = this.tidebugRecvDataBuffer.slice(nil + 1 + size + 1);

        // handle the first message...
        this.tidebugRecvMessage(message);

        if (this.tidebugRecvDataBuffer.length) {
            // and continue parsing...
            this.tidebugRecvData();
        }
    }
};

// Create a new function that our inspector agents can use to communicate
// with the DBGp engine.
//
// The first argument should always be a string of the DBGp command.
// The next argument can be a hash of command options to pass.
// The next argument can be a string of data for the command (raw).
// The final argument should always be a callback function for handling the
// response.
//
module.exports.socketSendMessage = function () {
    var vargs = [].slice.apply(arguments);
    var command = vargs.shift();
    var opts = typeof vargs[0] == 'object' ? vargs.shift() : {};
    var data = typeof vargs[0] == 'string' ? vargs.shift() : null;
    var callback = vargs.shift();

    this.tidebugSendCount += 1;

    var write = command + ' -i ' + this.tidebugSendCount;

    for (var k in opts) {
        write += ' -' + k + ' ' + JSON.stringify(opts[k]);
    }

    if (data !== null) {
        // base64 the data argument if we have it...
        write += ' -- ' + new Buffer(data).toString('base64');
    }

    if (this.tidebugLogger) {
        this.tidebugLogger.debug('[dbgp#' + this.remoteAddress + ':' + this.remotePort + '] send ' + write);
    }

    // Finish off our command with null...
    write += '\0';

    // Save our callback for later...
    this.tidebugCallbacks[this.tidebugSendCount] = callback;

    // Finally send off the command...
    this.write(write);
};
