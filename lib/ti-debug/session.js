var Instance_State = {
    AVAILABLE : 'available',
    ATTACHED : 'attached',
    DETACHED : 'detached',
    UNAVAILABLE : 'unavailable'
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
//  * the session manager
//  * the main tidebug instance
//  * the debug backend managing the session
//  * the debug backend connection/socket
//  * options hash
//     * `connect_timeout` - delay for disconnecting if an end-user has not
//       connected
//
function Instance(id, tidebug, backend, backendSocket, options) {
    var that = this;

    // Keep references of our passed arguments...
    that.id = id;
    that.tidebug = tidebug;// @todo i think this should be dropped now
    that.backend = backend;
    that.backendSocket = backendSocket;

    // No frontend yet...
    that.state = Instance_State.AVAILABLE;
    that.fronted = null;
    that.frontendSocket = null;

    // Update our options
    that.options = options || {};

    // Default `connect_timeout` option
    that.options.connect_timeout = that.options.connect_timeout || 15000;

    // Register our timeout callback
    that.timerConnectTimeout = setTimeout(
        function () {
            that.detach('Inspector did not connect within timeout.');
        },
        that.options.connect_timeout
    );
}

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
Instance.prototype.attach = function (frontend, frontendSocket, callback) {
    var that = this;

    // Somebody connected, so clear the auto-disconnect timer.
    clearTimeout(that.timerConnectTimeout);

    that.state = Instance_State.ATTACHED;

    // Keep references of our passed arguments...
    that.frontend = frontend;
    that.frontendSocket = frontendSocket;

    // Let the debug protocol know we're ready to continue with the debug
    // session. When ready, it should invoke the callback to proceed.
    that.frontend.sessionPaired(that);
    that.backend.sessionPaired(that);

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
    if (this.state == Instance_State.DETACHED) {
        return;
    }

    this.state = Instance_State.DETACHED;

    // Let the debug protocol know it's being disconnected.
    this.backend.sessionDetached(this, reason);

    // If the inspector is connected, let the user know it's been disconnected
    // and then try to disconnect the end user.
    if (this.inspector) {
        this.inspector.sendInspectorMessage(
            'Inspector.detached',
            {
                reason : reason
            }
        );
    
        this.inspector.disconnect();
    }

    // Finally let the manager know we should be dropped from memory.
    this.manager.unregister(this);
};

/* ************************************************************************** */

module.exports = Instance;
