function Socket(socket, logger) {
    this.status = 'up';

    this.sendCount = 0;
    this.sendCallback = {};

    this.raw = socket;
    this.raw.on('event', this.recvEvent.bind(this));
    this.raw.on('disconnect', this.close.bind(this));

    this.logger = logger;
}

Socket.prototype.__proto__ = require('events').EventEmitter.prototype;

Socket.prototype.setInspector = function (inspector) {
    this.inspector = inspector;
};

Socket.prototype.recvEvent = function (message) {
    var messageObject = JSON.parse(message);

    this.logger.debug('inspector-socket > ' + message);

    var method = messageObject.method.split(".");
    var domainName = method[0];
    var functionName = method[1];

    if (!(domainName in this.inspector)) {
        this.logger.error("Protocol Error: the message is for non-existing domain '" + domainName + "'");

        return;
    }

    var dispatcher = this.inspector[domainName];

    if (!(functionName in dispatcher)) {
        this.logger.error("Protocol Error: Attempted to dispatch an unimplemented method '" + messageObject.method + "'");

        return;
    }

    var raw = this.raw;

    function callback(result) {
        raw.emit('event', {
            id : messageObject.id,
            result : result
        });
    }

    dispatcher[functionName].call(dispatcher, messageObject.params, callback)
};

// @todo not actually doing callbacks?
Socket.prototype.send = function () {
    var vargs = [].slice.apply(arguments);
    var method = vargs.shift();
    var params = 'object' == typeof vargs[0] ? vargs.shift() : {};
    var callback = vargs.shift();

    this.sendCount += 1;

    if (callback) {
        this.sendCallback[this.sendCount] = callback;
    }

    this.raw.emit('event', { method : method, params : params });
};

Socket.prototype.close = function () {
    if (this.status != 'up') {
        return;
    }

    this.status = 'down';

    if (!this.raw.disconnected) {
        this.send('Console.messageAdded', {
            message : {
                source : 'console-api',
                level : 'warning',
                text : 'Session has been closed.'
            }
        });
    }

    this.emit('close');
}

/* ************************************************************************** */

module.exports = Socket;
