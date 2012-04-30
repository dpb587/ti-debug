function Session(id, backend, frontend) {
    var that = this;

    that.id = id;
    that.backend = backend;
    that.frontend = frontend;

    if (that.backend) {
        that.backend.on('close', function () {
            if (that.frontend) {
                that.frontend.close();
            }

            that.emit('close');
        });
    }

    if (that.frontend) {
        that.frontend.on('close', function () {
            if (that.backend) {
                that.backend.close();
            }

            that.emit('close');
        });
    }
}

Session.prototype.__proto__ = require('events').EventEmitter.prototype;

module.exports = Session;
