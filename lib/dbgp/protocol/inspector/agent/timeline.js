function Timeline() {
}

/* ************************************************************************** */

Timeline.prototype.supportsFrameInstrumentation = function (params, callback) {
    callback({ result: false });
};

Timeline.prototype.canMonitorMainThread = function (params, callback) {
    callback({ result: false });
};

/* ************************************************************************** */

module.exports = Timeline;
