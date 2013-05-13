function Worker() {
}

/* ************************************************************************** */

Worker.prototype.canInspectWorkers = function (params, callback) {
    callback({
        result : false
    });
};

/* ************************************************************************** */

module.exports = Worker;
