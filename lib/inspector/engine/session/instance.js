var uuid = require('node-uuid');

/* ************************************************************************** */

var Instance_State = {
    WAITING : 'waiting',
    ATTACHED : 'attached',
    DETACHED : 'detached'
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
//  * the debug protocol managing the session
//  * the debug connection/socket used
//  * a semi-friendly name for the debug connection (e.g. remote host/port)
//  * options hash
//     * `connect_timeout` - delay for disconnecting if an end-user has not
//       connected
//
function Instance(manager, tidebug, protocol, engine, engineName, options) {
    var that = this;

    // Each session gets a unique identifier
    that.id = uuid.v4();

    // Keep references of our passed arguments...
    that.manager = manager;
    that.tidebug = tidebug;// @todo i think this should be dropped now
    that.protocol = protocol;
    that.engine = engine;
    that.engineName = engineName;

    // Update our options
    that.options = options || {};

    // Default `connect_timeout` option
    that.options.connect_timeout = that.options.connect_timeout || 15000;

    // At instantiation, we're waiting for an end-user inspector connection.
    that.state = Instance_State.WAITING;
    that.inspector = null;
    that.inspectorName = null;
    that.agents = null;

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
Instance.prototype.attach = function (inspector, inspectorName, callback) {
    var that = this;

    // Somebody connected, so clear the auto-disconnect timer.
    clearTimeout(that.timerConnectTimeout);

    that.state = Instance_State.ATTACHED;

    // Keep references of our passed arguments...
    that.inspector = inspector;
    that.inspectorName = inspectorName;

    // Ask for and create agents that the debug protocol supports...
    var agents = that.protocol.getInspectorAgents();
    that.agents = {
        Console : new agents.Console(that),
        CSS : new agents.CSS(that),
        Database : new agents.Database(that),
        Debugger : new agents.Debugger(that),
        DOM : new agents.DOM(that),
        DOMStorage : new agents.DOMStorage(that),
        HeapProfiler : new agents.HeapProfiler(that),
        Inspector : new agents.Inspector(that),
        Network : new agents.Network(that),
        Page : new agents.Page(that),
        Profiler : new agents.Profiler(that),
        Runtime : new agents.Runtime(that),
        Timeline : new agents.Timeline(that),
        Worker : new agents.Worker(that)
    };

    // Hook the inspector connection so we know if it gets disconnected.
    that.inspector.on(
        'disconnect',
        function () {
            that.detach();
        }
    );

    // Let the debug protocol know we're ready to continue with the debug
    // session. When ready, it should invoke the callback to proceed.
    that.protocol.sessionAttached(that, callback);
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
    this.protocol.sessionDetached(this, reason);

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
