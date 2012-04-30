var BaseSession = require('../ti-debug/session');

// @todo lazy
function Session(id, backend, frontend) {
    var that = this;

    BaseSession.apply(that, arguments);
}

Session.prototype.install = function (callback) {
    var that = this;

    that.backend.on('close', function () {
        that.frontend.close();
    });

    that.frontend.on('close', function () {
        that.backend.close();
    });

    that.frontend.setInspector(that.backend.getInspector(that));

    callback(that.backend.getInspectorSchema());
};

module.exports = Session;
