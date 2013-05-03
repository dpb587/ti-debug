function InspectorBackend() {
    InspectorBackendClass.call(this, arguments);

    this.dumpInspectorProtocolMessages = true;
}

InspectorBackend.prototype = {
    registerWorkerDispatcher : function (dispatcher) {
        this._domainDispatchers.Worker = dispatcher;
    },

    registerConsoleDispatcher : function (dispatcher) {
        this._domainDispatchers.Console = dispatcher;
    },

    registerDebuggerDispatcher : function (dispatcher) {
        this._domainDispatchers.Debugger = dispatcher;
    },

    registerNetworkDispatcher : function (dispatcher) {
        this._domainDispatchers.Network = dispatcher;
    },

    registerPageDispatcher : function (dispatcher) {
        this._domainDispatchers.Page = dispatcher;
    },

    registerDOMDispatcher : function (dispatcher) {
        this._domainDispatchers.DOM = dispatcher;
    },

    registerInspectorDispatcher : function (dispatcher) {
        this._domainDispatchers.Inspector = dispatcher;
    },

    registerCSSDispatcher : function (dispatcher) {
        this._domainDispatchers.CSS = dispatcher;
    },

    registerTimelineDispatcher : function (dispatcher) {
        this._domainDispatchers.Timeline = dispatcher;
    },

    registerDatabaseDispatcher : function (dispatcher) {
        this._domainDispatchers.Database = dispatcher;
    },

    registerDOMStorageDispatcher : function (dispatcher) {
        this._domainDispatchers.DOMStorage = dispatcher;
    },

    registerProfilerDispatcher : function (dispatcher) {
        this._domainDispatchers.Profiler = dispatcher;
    }
};

InspectorBackend.prototype.__proto__ = InspectorBackendClass.prototype;

InspectorBackend = new InspectorBackend();
