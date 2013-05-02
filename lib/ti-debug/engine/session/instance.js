var uuid = require('node-uuid');

function Instance(tidebug, protocol, engine) {
    var that = this;

    that.id = uuid.v4();
    that.tidebug = tidebug;
    that.protocol = protocol;
    that.engine = engine;
    that.inspector = null;
    that.agents = null;

    that.active = false;
}

Instance.prototype.attach = function (inspector, callback) {
    var that = this;

    that.active = true;
    that.inspector = inspector;

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
    if (!this.active) {
        return;
    }

    this.active = false;

    this.protocol.sessionDetached(this, reason);

    this.inspector.sendInspectorMessage(
        'Inspector.detached',
        {
            reason : reason
        }
    );

    this.inspector.disconnect();
};

module.exports = Instance;
