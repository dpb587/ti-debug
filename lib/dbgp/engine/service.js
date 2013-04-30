var net = require('net');
var xml2json = require('xml2json');

/* ************************************************************************** */

function Service(options, logger) {
    this.state = 'DOWN';

    options = options || {};
    this.options = {};
    this.options.host = options.host || null;
    this.options.port = options.port || 9000;
    this.options.multiple = options.multiple || true;

    var tmp = require('./client/map/' + (this.options.multiple ? 'multiple' : 'single'));
    this.clients = new tmp(logger);

    this.logger = logger;

    this.sockets = [];

    this.server = net.createServer();

    this.server.on(
        'listening',
        function () {
            this.state = 'UP';
            this.emit('listening');
        }.bind(this)
    );

    this.server.on(
        'close',
        function () {
            this.state = 'DOWN';
            this.emit('close');
        }.bind(this)
    );

    this.server.on('error', this.emit.bind(this, 'error'));

    this.server.on('connection', this.acceptConnection.bind(this));

    if (this.logger) {
        this.server.on(
            'listening',
            function () {
                this.logger.info('[dbgp#' + this.options.host + ':' + this.options.port + '] listening');
            }.bind(this)
        );

        this.server.on(
            'close',
            function () {
                this.logger.info('[dbgp#' + this.options.host + ':' + this.options.port + '] closed');
            }.bind(this)
        );
    }
}

Service.prototype.__proto__ = require('events').EventEmitter.prototype;

Service.prototype.acceptConnection =  function (socket) {
    var that = this;
    var callbacks = {};
    var recvDataBuffer = '';
    var sendCount = 0;

    function recvMessage (str) {
        // doesn't like the xml header - @todo this should be dynamic
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
    
        if (recvDataBuffer.length >= (size + nil)) {
            var message = recvDataBuffer.slice(nil, nil + 1 + size);
            recvDataBuffer = recvDataBuffer.slice(nil + 1 + size + 1);
    
            recvMessage(message);
    
            if (recvDataBuffer.length) {
                recvData();
            }
        }
    }

    socket.setEncoding('utf8');

    socket.on(
        'data',
        recvData
    );

    socket.once(
        'payload',
        function (payload) {
            socket.header = payload;

            var client = that.clients.lookup(this.header.init.idekey);

            if (!client) {
                if (that.logger) {
                    that.logger.info('[dbgp#' + socket.remoteAddress + ':' + socket.remotePort + '] no handler for idekey=' + this.header.init.idekey);
                }

                socket.end();
            } else {
                client.initiate(socket);
            }
        }
    );

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
            write += ' -- ' + new Buffer(data).toString('base64');
        }
    
        if (that.logger) {
            that.logger.debug('[dbgp#' + socket.remoteAddress + ':' + socket.remotePort + '] send ' + write);
        }
    
        write += '\0';
    
        callbacks[sendCount] = callback;

        socket.write(write);
    }

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

Service.prototype.start = function () {
    if (this.state == 'DOWN') {
        this.server.listen(this.options.port, this.options.host);
    }

    return this;
};

Service.prototype.stop = function () {
    if (this.state == 'UP') {
        this.server.close();
    }

    return this;
};

/* ************************************************************************** */

module.exports = Service;
