function HeapProfiler() {
}

/* ************************************************************************** */

HeapProfiler.prototype.hasHeapProfiler = function (params, callback) {
    callback({
        result : false
    });
};

/* ************************************************************************** */

module.exports = HeapProfiler;
