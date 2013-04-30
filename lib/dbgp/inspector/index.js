var inspector = {
    Console : require('./console'),
    CSS : require('./css'),
    Database : require('./database'),
    Debugger : require('./debugger'),
    DOM : require('./dom'),
    DOMStorage : require('./domstorage'),
    HeapProfiler : require('./heap_profiler'),
    Inspector : require('./inspector'),
    Network : require('./network'),
    Page : require('./page'),
    Profiler : require('./profiler'),
    Runtime : require('./runtime'),
    Timeline : require('./timeline'),
    Worker : require('./worker')
};

/* ************************************************************************** */

module.exports = inspector;
module.exports.create = function (engine, browser) {
    return {
        Console : new inspector.Console(engine, browser),
        CSS : new inspector.CSS(engine, browser),
        Database : new inspector.Database(engine, browser),
        Debugger : new inspector.Debugger(engine, browser),
        DOM : new inspector.DOM(engine, browser),
        DOMStorage : new inspector.DOMStorage(engine, browser),
        HeapProfiler : new inspector.HeapProfiler(engine, browser),
        Inspector : new inspector.Inspector(engine, browser),
        Network : new inspector.Network(engine, browser),
        Page : new inspector.Page(engine, browser),
        Profiler : new inspector.Profiler(engine, browser),
        Runtime : new inspector.Runtime(engine, browser),
        Timeline : new inspector.Timeline(engine, browser),
        Worker : new inspector.Worker(engine, browser)
    };
};
