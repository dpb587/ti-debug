function Profiler()
{

}

Profiler.prototype.enable = function (params, callback) {
    callback();
};

Profiler.prototype.causesRecompilation = function (params, callback) {
    callback({
        result : false
    });
};

Profiler.prototype.isSampling = function (params, callback) {
    callback({
        result : false
    });
};

Profiler.prototype.hasHeapProfiler = function (params, callback) {
    callback({
        result : true
    });
};

module.exports = Profiler;