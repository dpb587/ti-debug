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
        socket,
        socket.remoteAddress + ':' + socket.remotePort
    );

    // Let the session know if we get disconnected.
    socket.on(
        'close',
        function () {
            session.detach('Backend connection was closed.');
            session.confirmBackendClosed();
        }
    );

    // When the session wants us to detach, make sure we close our connection.
    session.on(
        'backend.detach',
        function () {
            socket.end();
        }
    );

    // Let the browser know there's a session available for it to connect to.
    this.socket.emit(
        'init',
        {
            id : session.id,
            backend : {
                remote : socket.remoteAddress + ':' + socket.remotePort,
                header : socket.header
            },
            frontend : {
                url : '/inspector/inspector/?id=' + session.id,
                size : {
                    x : 960,
                    y : 594
                }
            }
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

    try {
        this.socket.disconnect();
    } catch (e) {
        if (this.backend.logger) {
            this.backend.logger.warn('[dbgp:tidebug#' + this.getTargetName() + '] failed to cleanly disconnect client: ' + e.getMessage());
        }
    }
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
Client.prototype.getTargetName = function () {
    return this.socket.handshake.address.address + ':' + this.socket.handshake.address.port;
};

/* ************************************************************************** */

module.exports = Client;
