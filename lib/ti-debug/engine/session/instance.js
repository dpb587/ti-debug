var uuid = require('node-uuid');

function Instance(tidebug, protocol, engine) {
    this.id = uuid.v4();
    this.tidebug = tidebug;
    this.protocol = protocol;
    this.engine = engine;
    this.inspector = null;
    this.agents = null;
}

Instance.prototype.initialize = function (inspector, callback) {
    this.inspector = inspector;

    var agents = this.protocol.getInspectorAgents();
    this.agents = {
        Console : new agents.Console(this),
        CSS : new agents.CSS(this),
        Database : new agents.Database(this),
        Debugger : new agents.Debugger(this),
        DOM : new agents.DOM(this),
        DOMStorage : new agents.DOMStorage(this),
        HeapProfiler : new agents.HeapProfiler(this),
        Inspector : new agents.Inspector(this),
        Network : new agents.Network(this),
        Page : new agents.Page(this),
        Profiler : new agents.Profiler(this),
        Runtime : new agents.Runtime(this),
        Timeline : new agents.Timeline(this),
        Worker : new agents.Worker(this)
    };

    this.protocol.initializeSession(this, callback);
};

module.exports = Instance;
