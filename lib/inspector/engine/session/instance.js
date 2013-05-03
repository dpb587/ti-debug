var uuid = require('node-uuid');

var Instance_State = {
    WAITING : 'waiting',
    ATTACHED : 'attached',
    DETACHED : 'detached'
};

function Instance(manager, tidebug, protocol, engine, engineName, options) {
    var that = this;

    that.manager = manager;
    that.id = uuid.v4();
    that.tidebug = tidebug;
    that.protocol = protocol;
    that.options = options || {};
    that.options.connect_timeout = that.options.connect_timeout || 15000;

    that.state = Instance_State.WAITING;

    that.engine = engine;
    that.engineName = engineName;

    that.inspector = null;
    that.inspectorName = null;

    that.agents = null;

    that.timerConnectTimeout = setTimeout(
        function () {
            that.detach('Inspector did not connect within timeout.');
        },
        that.options.connect_timeout
    );
}

Instance.prototype.attach = function (inspector, inspectorName, callback) {
    var that = this;

    clearTimeout(that.timerConnectTimeout);

    that.state = Instance_State.ATTACHED;

    that.inspector = inspector;
    that.inspectorName = inspectorName;

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

    that.inspector.on(
        'disconnect',
        function () {
            that.detach();
        }
    );

    that.protocol.sessionAttached(that, callback);
};

Instance.prototype.detach = function (reason) {
    if (this.state == Instance_State.DETACHED) {
        return;
    }

    this.state = Instance_State.DETACHED;

    this.protocol.sessionDetached(this, reason);

    this.inspector.sendInspectorMessage(
        'Inspector.detached',
        {
            reason : reason
        }
    );

    this.inspector.disconnect();

    this.manager.unregister(this);
};

module.exports = Instance;
