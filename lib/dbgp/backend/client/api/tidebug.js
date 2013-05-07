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
function Client(backend, idekey, multiple, socket) {
    var that = this;

    that.state = 'registered';

    that.backend = backend;
    that.idekey = idekey;
    that.multiple = 1 == (multiple || 0);
    that.socket = socket;
}

//
// Handle a connection from the DBGp engine.
//
Client.prototype.initiate = function (socket) {
    // Ask ti-debug to create an inspector session...
    var session = this.backend.tidebug.createSession(
        this.backend,
        socket
    );

    // Let the session know if we get disconnected.
    socket.on(
        'close',
        function () {
            session.detach('Backend connection was closed.');
        }
    );

    // When the session wants us to detach, make sure we close our connection.
    session.on(
        'backend.detach',
        function () {
            console.log('hearddd');
            socket.end();
        }
    );

    // Let the browser know there's a session available for it to connect to.
    this.socket.emit(
        'init',
        {
            sid : session.id,
            remote : socket.remoteAddress + ':' + socket.remotePort,
            header : socket.header
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
    return 'tidebug';
};

//
// Retrieve a user-friendly name for this client connection.
//
Client.prototype.getName = function () {
    return this.socket.handshake.address.address + ':' + this.socket.handshake.address.port + '#' + this.socket.id;
};

/* ************************************************************************** */

module.exports = Client;
