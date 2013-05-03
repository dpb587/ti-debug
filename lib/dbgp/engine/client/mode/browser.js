function Client(idekey, multiple, protocol, socket) {
    var that = this;

    that.state = 'registered';

    that.idekey = idekey;
    that.multiple = 1 == (multiple || 0);
    that.protocol = protocol;
    that.socket = socket;

    that.socket.on(
        'disconnect',
        function () {
            that.protocol.clients.unregister(that);
        }
    );
}

Client.prototype.initiate = function (engine) {
    var session = this.protocol.tidebug.get('inspector').createSession(
        this.protocol,
        engine,
        engine.remoteAddress + ':' + engine.remotePort
    );

    engine.on(
        'close',
        function () {
            session.detach('Debugger connection was closed.');
        }
    );

    this.socket.emit(
        'init',
        {
            sid : session.id,
            remote : engine.remoteAddress + ':' + engine.remotePort,
            header : engine.header
        }
    );
};

Client.prototype.unregister = function () {
    if (this.state == 'unregistered') {
        return;
    }

    this.state = 'unregistered';

    this.socket.disconnect();
};

Client.prototype.getMode = function () {
    return 'browser';
};

Client.prototype.getName = function () {
    return this.socket.handshake.address.address + ':' + this.socket.handshake.address.port + '#' + this.socket.id;
};

module.exports = Client;
