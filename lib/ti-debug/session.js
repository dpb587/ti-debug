var Instance_State = {
    AVAILABLE : 'available',
    ATTACHED : 'attached',
    DETACHED : 'detached',
    UNAVAILABLE : 'unavailable',
    CLOSED : 'closed'
};

/* ************************************************************************** */

//
// Create a specific session instance for debugging.
//
// A debug component is responsible for creating these sessions, whether it's
// engine-initiated or user-initiated. Once a session has been created, the
// end-user can then attach to the session by using it's ID.
//
// Arguments:
//
//  * the session id
//  * the debug backend managing the session
//  * the debug backend connection/socket
//  * options hash
//     * `connect_timeout` - delay for disconnecting if an end-user has not
//       connected
//
// Events:
//
//  * `close` - once backend and frontend connections have been closed
//  * `backend.detach` - when the session wants the backend to disconnect
//  * `frontend.detach` - when the session wants the frontend to disconnect
//
function Instance(id, backend, backendSocket, backendSocketName, options, logger) {
    var that = this;

    // Keep references of our passed arguments...
    that.id = id;
    that.backend = backend;
    that.backendSocket = backendSocket;
    that.backendSocketName = backendSocketName;
    that.backendSocketClosed = false;
    that.logger = logger;

    // No frontend yet...
    that.state = Instance_State.AVAILABLE;
    that.protocol = null;
    that.fronted = null;
    that.frontendSocket = null;
    that.frontendSocketName = null;
    that.frontendSocketClosed = null;

    // Update our options
    that.options = options || {};

    // Default `connect_timeout` option
    that.options.connect_timeout = that.options.connect_timeout || 30000;

    // Register our timeout callback
    that.timerConnectTimeout = setTimeout(
        function () {
            console.log('timedddd');
            that.detach('Frontend did not connect within ' + that.options.connect_timeout + ' ms.');
        },
        that.options.connect_timeout
    );
}

Instance.prototype.__proto__ = require('events').EventEmitter.prototype;

//
// Used to attach an inspector connection/socket to this debug session.
//
// This is called by the main inspector protocol.
//
// Arguments:
//
//  * the inspector connection/socket used
//  * a semi-friendly name for the inspector connection (e.g. remote port/name)
//  * a callback once final connections have been established
//
Instance.prototype.attach = function (frontend, frontendSocket, frontendSocketName, callback) {
    var that = this;

    // Somebody connected, so clear the auto-disconnect timer.
    clearTimeout(this.timerConnectTimeout);

    this.state = Instance_State.ATTACHED;

    // Keep references of our passed arguments...
    this.frontend = frontend;
    this.frontendSocket = frontendSocket;
    this.frontendSocketName = frontendSocketName;
    this.frontendSocketClosed = false;

    this.protocol = this.backend.getProtocol(this.frontend, this);

    // Let the debug protocol know we're ready to continue with the debug
    // session. When ready, it should invoke the callback to proceed.
    this.frontend.sessionPaired(this);
    this.backend.sessionPaired(this);

    callback();
};

//
// Disconnect everything related to this debug session.
//
// Typically called by the debug protocol when a session ends, or by inspector
// if the end-user disconnects. Optionally a reason may be provided for passing
// to the end-user if they're still connected.
//
Instance.prototype.detach = function (reason) {
    if (Instance_State.ATTACHED != this.state && Instance_State.AVAILABLE != this.state) {
        return;
    }

    this.state = Instance_State.DETACHED;

    this.emit('frontend.detach', reason);
    this.emit('backend.detach', reason);

    if (this.logger) {
        this.logger.debug('[session#' + this.id + '] detaching');
    }
};

Instance.prototype.confirmBackendClosed = function () {
    this.backendSocketClosed = true;

    this.attemptClose();
};

Instance.prototype.confirmFrontendClosed = function () {
    this.frontendSocketClosed = true;

    this.attemptClose();
};

//
// Attempt to finish closing the session.
//
// Once both frontend and backend have been disconnected, this takes care of
// firing the `close` event.
//
Instance.prototype.attemptClose = function () {
    if (this.state == Instance_State.CLOSED) {
        return;
    } else if (!this.backendSocketClosed || !this.frontendSocketClosed) {
        return;
    }

    if (this.logger) {
        this.logger.debug('[session#' + this.id + '] closing');
    }

    this.emit('close');
};

/* ************************************************************************** */

module.exports = Instance;
