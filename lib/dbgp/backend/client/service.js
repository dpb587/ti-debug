var net = require('net');
var xml2json = require('xml2json');

/* ************************************************************************** */

//
// The main DBGp client service.
//
// The DBGp engine initiates a debug session by connecting to a client, so this
// takes care of receiving those connections and turning them into something
// useful.
//
// Because the client can operate in two modes, either a `direct` or `proxy`
// resolver must be passed and is used for determining whether there's an actual
// client ready to debug.
//
// Arguments:
//
//  * instance of either `dbgp/engine/resolver/direct/service` or
//    `dbgp/engine/resolver/proxy/service`
//  * options hash
//     * `host` - IP address or hostname for binding the DBGp client
//     * `port` - port for binding the DBGp client
//  * an instance of `socket.io/Logger` or `null`
//
function Service(resolver, options, logger) {
    var that = this;

    that.state = 'DOWN';

    that.resolver = resolver;

    options = options || {};
    that.options = {};
    that.options.host = options.host || '127.0.0.1';
    that.options.port = options.port || 9000;

    that.logger = logger;

    that.server = net.createServer();

    // Make sure we're listening for connections...
    that.server.on('connection', that.acceptConnection.bind(that));

    // Add some logging, if available...
    if (that.logger) {
        that.server.on(
            'listening',
            function () {
                that.logger.info('[dbgp#' + that.options.host + ':' + that.options.port + '] listening');
            }
        );

        that.server.on(
            'close',
            function () {
                that.logger.info('[dbgp#' + that.options.host + ':' + that.options.port + '] closed');
            }
        );
    }
}

//
// Accept connections to the DBGp client.
//
// The DBGp protocol is documented at http://xdebug.org/docs-dbgp.php. Generally
// this block takes care of receiving the data and passing on the messages once
// they are fully available.
//
Service.prototype.acceptConnection =  function (socket) {
    var that = this;

    // Used for unique transaction IDs, keep track of how many commands we send.
    var sendCount = 0;

    // When we send messages to the backend, we retain callbacks for invoking
    // when we receive replies.
    var callbacks = {};

    // Use a buffer to hold partial messages as we receive them.
    var recvDataBuffer = '';

    // Create a function for converting a text-based message into a usable JSON
    // representation and then call the appropriate callback or event that can
    // receive the message.
    function recvMessage (str) {
        // doesn't like the xml header - @todo this should probably be dynamic
        str = str.slice(45, str.length);
        obj = xml2json.toJson(str, { object : true });
    
        if (that.logger) {
            that.logger.debug('[dbgp#' + socket.remoteAddress + ':' + socket.remotePort + '] recv ' + str);
        }
    
        if (obj.response && obj.response.transaction_id && callbacks[obj.response.transaction_id]) {
            callbacks[obj.response.transaction_id](obj.response);
            delete callbacks[obj.response.transaction_id];
        } else {
            socket.emit('payload', obj);
        }
    }

    // Create a function which handles additional message data that we can add
    // to our buffer. Always try to parse the extra data to see if we have a
    // full message that we can pass on to `recvMessage`.
    function recvData (data) {
        if (data) {
            recvDataBuffer += data;
        }
    
        var nil = false;
    
        for (var i = 0; i < 16; i ++) {
            if (recvDataBuffer.charCodeAt(i) == 0) {
                nil = i;
                break;
            }
        }
    
        if (nil === false) {
            // waiting for more data
            return;
        }
    
        size = parseInt(recvDataBuffer.slice(0, nil));
    
        // we received multiple messages...
        if (recvDataBuffer.length >= (size + nil)) {
            var message = recvDataBuffer.slice(nil, nil + 1 + size);
            recvDataBuffer = recvDataBuffer.slice(nil + 1 + size + 1);

            // handle the first message...
            recvMessage(message);
    
            if (recvDataBuffer.length) {
                // and continue parsing...
                recvData();
            }
        }
    }

    socket.setEncoding('utf8');

    socket.on(
        'data',
        recvData
    );

    // The first message we receive should always be the header and include
    // information about what debug client the session is intended for.
    socket.once(
        'payload',
        function (payload) {
            // Keep the header payload for later reference...
            socket.header = payload;

            // Find a client that will accept this debug session...
            var client = that.resolver.lookupClient(this.header.init.idekey);

            if (!client) {
                // Without a client, we should just immediately disconnect...
                if (that.logger) {
                    that.logger.info('[dbgp#' + socket.remoteAddress + ':' + socket.remotePort + '] no handler for idekey=' + this.header.init.idekey);
                }

                socket.end();
            } else {
                // Tell the client it should initiate a session...
                client.initiate(socket);
            }
        }
    );

    // Create a new function that our inspector agents can use to communicate
    // with the DBGp engine.
    //
    // The first argument should always be a string of the DBGp command.
    // The next argument can be a hash of command options to pass.
    // The next argument can be a string of data for the command (raw).
    // The final argument should always be a callback function for handling the
    // response.
    //
    socket.sendMessage = function () {
        var vargs = [].slice.apply(arguments);
        var command = vargs.shift();
        var opts = typeof vargs[0] == 'object' ? vargs.shift() : {};
        var data = typeof vargs[0] == 'string' ? vargs.shift() : null;
        var callback = vargs.shift();
    
        sendCount += 1;
    
        var write = command + ' -i ' + sendCount;
    
        for (var k in opts) {
            write += ' -' + k + ' ' + JSON.stringify(opts[k]);
        }
    
        if (data) {
            // base64 the data argument if we have it...
            write += ' -- ' + new Buffer(data).toString('base64');
        }
    
        if (that.logger) {
            that.logger.debug('[dbgp#' + socket.remoteAddress + ':' + socket.remotePort + '] send ' + write);
        }
    
        // Finish off our command with null...
        write += '\0';
    
        // Save our callback for later...
        callbacks[sendCount] = callback;

        // Finally send off the command...
        socket.write(write);
    }

    // Add some logging, if available...
    if (that.logger) {
        that.logger.info('[dbgp#' + socket.remoteAddress + ':' + socket.remotePort + '] connected');

        socket.on(
            'close',
            function () {
                that.logger.info('[dbgp#' + socket.remoteAddress + ':' + socket.remotePort + '] disconnected');
            }
        );
    }
};

//
// Start up the DBGp client.
//
Service.prototype.start = function () {
    this.server.listen(this.options.port, this.options.host);

    this.state = 'UP';

    return this;
};

//
// Stop the DBGp client.
//
Service.prototype.stop = function () {
    var that = this;

    if (that.state != 'UP') {
        return;
    }

    that.state = 'DOWN';

    process.nextTick(
        function () {
            that.server.close();
        }
    );

    return that;
};

/* ************************************************************************** */

module.exports = Service;
