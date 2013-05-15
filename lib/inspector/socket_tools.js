var BackendInspectorSchema = require('fs').readFileSync(__dirname + '/docroot/schema.json', 'utf8');

module.exports.upgrade = function (tidebugFrontend, socket, logger) {
    socket.tidebugFrontend = tidebugFrontend;
    socket.tidebugLogger = logger;

    socket.tidebugSession = null;
    socket.tidebugCallbacks = {};
    socket.tidebugSendCount = 0;

    socket.on(
        'disconnect',
        function () {
            if (this.tidebugSession) {
                this.tidebugSession.confirmFrontendClosed();
            }
        }
    );

    socket.on('attach', module.exports.socketHandleAttach.bind(socket));
    socket.on('event', module.exports.socketHandleEvent.bind(socket));

    socket.sendInspectorMessage = module.exports.socketSendInspectorMessage.bind(socket);
};

//
// The main `event` event is received whenever the browser front-end sends a
// command. These events are delegated to the protocol's agents.
//
module.exports.socketHandleEvent = function (message) {
    var that = this;

    var messageObject = JSON.parse(message);

    if (this.tidebugLogger) {
        this.tidebugLogger.debug('[inspector#' + this.id + '] recv ' + message);
    }

    var method = messageObject.method.split(".");
    var domainName = method[0];
    var functionName = method[1];

    if (!(domainName in this.tidebugSession.protocol)) {
        if (this.tidebugLogger) {
            this.tidebugLogger.error('[inspector#' + this.id + '] the message is for unimplemented domain=' + domainName);
        }

        return;
    }

    var dispatcher = this.tidebugSession.protocol[domainName];

    if (!(functionName in dispatcher)) {
        if (this.tidebugLogger) {
            this.tidebugLogger.error('[inspector#' + this.id + '] the message is for unimplemented method=' + messageObject.method);
        }

        return;
    }

    dispatcher[functionName].call(
        dispatcher,
        messageObject.params,
        function callback(result) {
            that.emit(
                'event',
                {
                    id : messageObject.id,
                    result : result
                }
            );
        }
    );
};

//
// The main `attach` event is what confirms the browser wants to start debugging 
//
module.exports.socketHandleAttach = function (data, cb) {
    // Find the this.tidebugSession by its ID.
    this.tidebugSession = this.tidebugFrontend.tidebug.getSession(data.id);

    if (!this.tidebugSession) {
        // Ignore the command if the this.tidebugSession doesn't actually
        // exist.
        if (this.tidebugLogger) {
            this.tidebugLogger.warn('[inspector#' + this.id + '] this.tidebugSession ' + data.id + ' does not exist.');
        }

        return;
    } else if ('available' != this.tidebugSession.state) {
        // Ignore the command if the this.tidebugSession is already attached
        // elsewhere.
        if (this.tidebugLogger) {
            this.tidebugLogger.warn('[inspector#' + this.id + '] this.tidebugSession ' + data.id + ' is not available.');
        }

        return;
    }

    if (this.tidebugLogger) {
        this.tidebugLogger.info('[inspector#' + this.id + '] connected to this.tidebugSession ' + data.id);
    }

    // Let the this.tidebugSession complete the attachment and finish the
    // browser loading when it's ready.
    this.tidebugSession.attach(
        this.tidebugFrontend,
        this,
        this.handshake.address.address + ':' + this.handshake.address.port,
        function () {
            cb(BackendInspectorSchema);
        }
    );
};

// Create a function so we can initiate messages from our debug
// this.tidebugSession and send them to the inspector front-end.
//
// The first argument should be the namespaced method.
// The second argument may be a hash of parameters.
// The next argument may be a callback function if the front-end
// will provide a response.
module.exports.socketSendInspectorMessage = function () {
    var vargs = [].slice.apply(arguments);
    var method = vargs.shift();
    var params = 'object' == typeof vargs[0] ? vargs.shift() : {};
    var callback = vargs.shift();

    this.tidebugSendCount += 1;

    if (callback) {
        this.tidebugCallbacks[this.tidebugSendCount] = callback;
    }

    var data = { method : method, params : params };

    if (this.tidebugLogger) {
        this.tidebugLogger.debug('[inspector#' + this.id + '] send ' + JSON.stringify(data));
    }

    this.emit('event', data);
};
