function Timeline() {
}

/* ************************************************************************** */

Timeline.prototype.setIncludeMemoryDetails = function (params, callback) {
    callback();
};

Timeline.prototype.supportsFrameInstrumentation = function (params, callback) {
    callback();
};

Timeline.prototype.canMonitorMainThread = function (params, callback) {
    callback();
};

/* ************************************************************************** */

module.exports = Timeline;
