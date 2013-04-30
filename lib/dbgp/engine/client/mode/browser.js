function Client(idekey, multiple, tidebug, socket) {
    this.idekey = idekey;
    this.multiple = 1 == (multiple || 0);
    this.tidebug = tidebug;
    this.socket = socket;
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
