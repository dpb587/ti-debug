var view = require('./view');
var BackendInspectorSchema = require('fs').readFileSync(__dirname + '/docroot/schema.json', 'utf8');

/* ************************************************************************** */

//
// The main service for managing browser debugging.
//
function Service(tidebug, context, options, logger) {
    this.tidebug = tidebug;
    this.options = options;
    this.logger = logger;

    this.registerApp(context);
};

Service.prototype.registerApp = function (app) {
    var that = this;

    // Ensure we use socket.io for our communications channel...
    app.io.on(
        'connection',
        function (socket) {
            var session;
            var callbacks = {};
            var sendCount = 0;

            socket.on(
                'disconnect',
                function () {
                    if (session) {
                        session.confirmFrontendClosed();
                    }
                }
            );

            // The main `attach` event is what confirms the browser wants to
            // start debugging 
            socket.on(
                'attach',
                function (data, cb) {
                    // Find the session by its ID.
                    session = that.tidebug.getSession(data.id);

                    if (!session) {
                        // Ignore the command if the session doesn't actually
                        // exist.
                        if (that.logger) {
                            that.logger.warn('[inspector#' + socket.id + '] session ' + data.id + ' does not exist.');
                        }
                
                        return;
                    } else if ('available' != session.state) {
                        // Ignore the command if the session is already attached
                        // elsewhere.
                        if (that.logger) {
                            that.logger.warn('[inspector#' + socket.id + '] session ' + data.id + ' is not available.');
                        }
                
                        return;
                    }
                
                    if (that.logger) {
                        that.logger.info('[inspector#' + socket.id + '] connected to session ' + data.id);
                    }

                    // Let the session complete the attachment and finish the
                    // browser loading when it's ready.
                    session.attach(
                        that,
                        socket,
                        socket.handshake.address.address + ':' + socket.handshake.address.port,
                        function () {
                            cb(BackendInspectorSchema);
                        }
                    );
                }
            );

            // The main `event` event is received whenever the browser front-end
            // sends a command. These events are delegated to the protocol's
            // agents.
            socket.on(
                'event',
                function (message) {
                    var messageObject = JSON.parse(message);

                    if (that.logger) {
                        that.logger.debug('[inspector#' + socket.id + '] recv ' + message);
                    }
                
                    var method = messageObject.method.split(".");
                    var domainName = method[0];
                    var functionName = method[1];
                
                    if (!(domainName in session.protocol)) {
                        if (that.logger) {
                            that.logger.error('[inspector#' + socket.id + '] the message is for unimplemented domain=' + domainName);
                        }
                
                        return;
                    }
                
                    var dispatcher = session.protocol[domainName];
                
                    if (!(functionName in dispatcher)) {
                        if (that.logger) {
                            that.logger.error('[inspector#' + socket.id + '] the message is for unimplemented method=' + messageObject.method);
                        }
                
                        return;
                    }
                
                    dispatcher[functionName].call(
                        dispatcher,
                        messageObject.params,
                        function callback(result) {
                            socket.emit(
                                'event',
                                {
                                    id : messageObject.id,
                                    result : result
                                }
                            );
                        }
                    );
                }
            );

            // Create a function so we can initiate messages from our debug
            // session and send them to the inspector front-end.
            //
            // The first argument should be the namespaced method.
            // The second argument may be a hash of parameters.
            // The next argument may be a callback function if the front-end
            // will provide a response.
            socket.sendInspectorMessage = function () {
                var vargs = [].slice.apply(arguments);
                var method = vargs.shift();
                var params = 'object' == typeof vargs[0] ? vargs.shift() : {};
                var callback = vargs.shift();
            
                sendCount += 1;
            
                if (callback) {
                    callbacks[sendCount] = callback;
                }
            
                var data = { method : method, params : params };
            
                if (that.logger) {
                    that.logger.debug('[inspector#' + socket.id + '] send ' + JSON.stringify(data));
                }
            
                socket.emit('event', data);
            };

            // Add some logging, if available...
            if (that.logger) {
                that.logger.debug('[inspector#' + socket.id + '] connected');

                socket.on(
                    'disconnect',
                    function () {
                        that.logger.debug('[inspector#' + socket.id + '] disconnected');
                    }
                );
            }
        }
    );

    // Serve the `inspector.html` for a given session with our patched
    // references.
    app.get(
        '/inspector/',
        function (req, res) {
            var session = that.tidebug.getSession(req.query.id);
    
            if (!session) {
                res.set('content-type', 'text/plain');
                res.send(404, 'Session is not available.');
                res.end();
    
                return;
            }
    
            res.set('content-type', 'text/html');
            res.send(
                view.standard(
                    [
                        '<link rel="stylesheet" type="text/css" href="/inspector/patch/inspector.css">',
                        '<script type="text/javascript" src="/ti-debug/socket.io/socket.io.js"></script>',
                        '<script type="text/javascript" src="patch/inspector.js"></script>',
                        '<script type="text/javascript" src="patch/InspectorBackend.js"></script>',
                        '<script type="text/javascript" src="patch/InspectorFrontendHost.js"></script>',
                        '<script type="text/javascript" src="patch/Settings.js"></script>'
                    ].join("\n")
                )
            );
    
            res.end();
        }
    );

    app.get(
        '/inspector/patch/*',
        function (req, res) {
            res.sendfile(req.params[0], { root : __dirname + '/docroot/inspector-patch' });
        }
    );

    app.get(
        '/inspector/*',
        function (req, res) {
            res.sendfile(req.params[0], { root : __dirname + '/docroot/inspector' });
        }
    );
};

//
// Retrieve general status information
//
Service.prototype.getStatus = function () {
    return {};
};

Service.prototype.sessionPaired = function (session) {
    // Let the session know if the browser gets disconnected.
    session.frontendSocket.on(
        'disconnect',
        function () {
            session.detach('Frontend disconnected.');
        }
    );

    // When the session wants us to detach, make sure we let the frontend know
    // before disconnecting.
    session.on(
        'frontend.detach',
        function (reason) {
            if (session.logger) {
                session.logger.debug('inspector heard detach');
            }

            session.frontendSocket.sendInspectorMessage(
                'Inspector.detached',
                {
                    reason : reason
                }
            );
        
            session.frontendSocket.disconnect();
        }
    );
};

//
// Start the inspector (noop).
//
Service.prototype.start = function () {
    // nop
};

//
// Stop the inspector.
//
// Unregister all the connected sessions.
//
Service.prototype.stop = function () {
    // nop
};

/* ************************************************************************** */

module.exports = Service;
