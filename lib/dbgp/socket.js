var xml2json = require('xml2json');

var BackendInspectorSchema = require('fs').readFileSync(__dirname + '/inspector/schema.json', 'utf8');

/* ************************************************************************** */

function Socket(socket, logger) {
    var that = this;

    that.name = socket.remoteAddress + ':' + socket.remotePort;
    that.state = 'UP';

    that.startdate = new Date();
    that.sendCount = 0;
    that.sendCallback = {};
    that.recvData_ = '';

    that.raw = socket;
    that.raw.setEncoding('utf8');
    that.raw.on('data', that.recvData.bind(that));
    that.raw.on(
        'close',
        function () {
            that.state = 'DOWN';
    
            that.emit.bind(that, 'close')
        }
    );
    that.once('payload', function (payload) {
        that.header = payload;
        that.emit('handshake', payload);
    });

    that.logger = logger;
}

Socket.prototype.__proto__ = require('events').EventEmitter.prototype;

// @todo lazy
Socket.prototype.getInspectorSchema = function () {
    return BackendInspectorSchema;
};

Socket.prototype.recvMessage = function (str) {
    // doesn't like the xml header - @todo this should be dynamic
    str = str.slice(45, str.length);
    obj = xml2json.toJson(str, { object : true });

    this.logger.debug('[dbgp#' + this.name + '] recv ' + str);

    if (obj.response && obj.response.transaction_id && this.sendCallback[obj.response.transaction_id]) {
        this.sendCallback[obj.response.transaction_id](obj.response);
        delete this.sendCallback[obj.response.transaction_id];
    } else {
        this.emit('payload', obj);
    }
};

Socket.prototype.recvData = function (data) {
    if (data) {
        this.recvData_ += data;
    }

    var nil = false;

    for (var i = 0; i < 16; i ++) {
        if (this.recvData_.charCodeAt(i) == 0) {
            nil = i;
            break;
        }
    }

    if (nil === false) {
        // waiting for more data
        return;
    }

    size = parseInt(this.recvData_.slice(0, nil));

    if (this.recvData_.length >= (size + nil)) {
        var message = this.recvData_.slice(nil, nil + 1 + size);
        this.recvData_ = this.recvData_.slice(nil + 1 + size + 1);

        this.recvMessage(message);

        if (this.recvData_.length) {
            this.recvData();
        }
    }
};

Socket.prototype.send = function () {
    if (this.state != 'UP') {
        return;
    }

    var vargs = [].slice.apply(arguments);
    var command = vargs.shift();
    var opts = typeof vargs[0] == 'object' ? vargs.shift() : {};
    var data = typeof vargs[0] == 'string' ? vargs.shift() : null;
    var callback = vargs.shift();

    this.sendCount += 1;

    var write = command + ' -i ' + this.sendCount;

    for (var k in opts) {
        write += ' -' + k + ' ' + JSON.stringify(opts[k]);
    }

    if (data) {
        write += ' -- ' + new Buffer(data).toString('base64');
    }

    this.logger.debug('[dbgp#' + this.name + '] send ' + write);

    write += '\0';

    this.raw.write(write);

    this.sendCallback[this.sendCount] = callback;
};

Socket.prototype.close = function () {
    this.raw.destroy();
}

/* ************************************************************************** */

module.exports = Socket;
