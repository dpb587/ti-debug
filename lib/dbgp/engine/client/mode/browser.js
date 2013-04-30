function Client(idekey, multiple, tidebug, protocol, socket) {
    var that = this;

    that.idekey = idekey;
    that.multiple = 1 == (multiple || 0);
    that.tidebug = tidebug;
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
    var session = this.tidebug.createSession('dbgp', engine);

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
};

module.exports = Client;
