//
// A Browser, Inspector-based Client.
//
// Created via the `proxyinit` command through the socket.io connection.
//
// Arguments:
//
//  * IDE key
//  * boolean for whether multiple connections are supported
//  * reference to the DBGp engine
//  * the socket.io socket
//
function Client(idekey, multiple, protocol, socket) {
    var that = this;

    that.state = 'registered';

    that.idekey = idekey;
    that.multiple = 1 == (multiple || 0);
    that.protocol = protocol;
    that.socket = socket;

    // Be sure to add a hook to unregister the client when it disconnects...
    that.socket.on(
        'disconnect',
        function () {
            that.protocol.unregisterClient(that);
        }
    );
}

//
// Handle a connection from the DBGp engine.
//
Client.prototype.initiate = function (engine) {
    // Ask ti-debug to create an inspector session...
    var session = this.protocol.tidebug.get('inspector').createSession(
        this.protocol,
        engine,
        engine.remoteAddress + ':' + engine.remotePort
    );

    // Ensure we detach the session if we lose our debugger connection.
    engine.on(
        'close',
        function () {
            session.detach('Debugger connection was closed.');
        }
    );

    // Let the browser know there's a session available for it to connect to.
    this.socket.emit(
        'init',
        {
            sid : session.id,
            remote : engine.remoteAddress + ':' + engine.remotePort,
            header : engine.header
        }
    );
};

//
// Unregister the client.
//
Client.prototype.unregister = function () {
    if (this.state == 'unregistered') {
        return;
    }

    this.state = 'unregistered';

    this.socket.disconnect();
};

//
// Retrieve a user-friendly name for this client API.
//
Client.prototype.getMode = function () {
    return 'inspector';
};

//
// Retrieve a user-friendly name for this client connection.
//
Client.prototype.getName = function () {
    return this.socket.handshake.address.address + ':' + this.socket.handshake.address.port + '#' + this.socket.id;
};

/* ************************************************************************** */

module.exports = Client;
