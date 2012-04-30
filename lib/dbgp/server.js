var net = require('net'),
    BackendSocket = require('./backend-socket');

function Server() {
    var that = this;

    that.sockets = [];

    that.server = net.createServer();
    that.server.on('listening', that.emit.bind(that, 'listening'));
    that.server.on('connection', function (raw_socket) {
        var socket = new BackendSocket(raw_socket);

        socket.once('payload', function (data) {
            that.emit('handshake', socket);
        });

        that.sockets.push(socket);
    });
    that.server.on('close', that.emit.bind(that, 'close'));
    that.server.on('error', that.emit.bind(that, 'error'));
}

Server.prototype.__proto__ = require('events').EventEmitter.prototype;

Server.prototype.registerWebService = function (web) {
    var that = this;

    web.get('/status.json', function (req, res) {
        res.send({
            status : 'up',
            listen : {
                address : that.server.address().address,
                port : that.server.address().port
            }
        });
    });
};

Server.prototype.listen = function (port, host) {
    this.server.listen.apply(this.server, arguments);
};

module.exports = Server;
