var SessionInstance = require('./session/instance');
var SessionManager = require('./session/manager');

var manifest = require('../manifest');
var view = require('./view');

var BackendInspectorSchema = require('fs').readFileSync(__dirname + '/../schema.json', 'utf8');

/* ************************************************************************** */

//
// The main service for managing browser debugging.
//
function Service(tidebug, app, options, logger) {
    this.tidebug = tidebug;
    this.options = options;
    this.logger = logger;

    this.sessions = new SessionManager();

    this.registerApp(app);
};

Service.prototype.getName = function () {
    return 'inspector';
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

            // The main `attach` event is what confirms the browser wants to
            // start debugging 
            socket.on(
                'attach',
                function (data, cb) {
                    // Find the session by its ID.
                    session = that.sessions.lookup(data.sid);

                    if (!session) {
                        // Ignore the command if the session doesn't actually
                        // exist.
                        if (that.logger) {
                            that.logger.warn('[inspector#' + socket.id + '] session ' + data.sid + ' does not exist.');
                        }
                
                        return;
                    } else if ('waiting' != session.state) {
                        // Ignore the command if the session is already attached
                        // elsewhere.
                        if (that.logger) {
                            that.logger.warn('[inspector#' + socket.id + '] session ' + data.sid + ' is not waiting.');
                        }
                
                        return;
                    }
                
                    if (that.logger) {
                        that.logger.info('[inspector#' + socket.id + '] connected to session ' + data.sid);
                    }

                    // Let the session complete the attachment and finish the
                    // browser loading when it's ready.
                    session.attach(
                        socket,
                        this.handshake.address.address + ':' + this.handshake.address.port + '#' + this.id,
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
                
                    if (!(domainName in session.agents)) {
                        if (that.logger) {
                            that.logger.error('[inspector#' + socket.id + '] the message is for unimplemented domain=' + domainName);
                        }
                
                        return;
                    }
                
                    var dispatcher = session.agents[domainName];
                
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

    // Register a simple status page for information about active connections.
    app.get('/status.json', function (req, res) {
        var sessions = [];

        for (var i in that.sessions.map) {
            var session = that.sessions.map[i];

            sessions.push(
                {
                    protocol : session.protocol.getName(),
                    engine : session.engineName,
                    inspector : session.inspectorName,
                    state : session.state
                }
            );
        }

        res.send({ sessions : sessions });

        res.end();
    });

    // Serve the `inspector.html` for a given session with our patched
    // references.
    app.get('/inspector.html', function (req, res) {
        var session = that.sessions.lookup(req.query.sid);

        if (!session) {
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
                    '<script type="text/javascript" src="/inspector/patch/inspector.js"></script>',
                    '<script type="text/javascript" src="/inspector/patch/InspectorBackend.js"></script>',
                    '<script type="text/javascript" src="/inspector/patch/InspectorFrontendHost.js"></script>',
                    '<script type="text/javascript" src="/inspector/patch/Settings.js"></script>'
                ].join("\n")
            )
        );

        res.end();
    });

    // Serve our patched files from the `/patch/` subdirectory.
    app.get('/patch/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/../docroot/inspector-patch' });
    });

    // Serve everything else as the upstream inspector files.
    app.get('/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/../docroot/inspector' });
    });
};

//
// Retrieve content for the home page segment.
//
Service.prototype.getAppIndex = function () {
    return '<p>' +
            'The browser client is powered by <a href="http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/inspector/front-end/?p=' + manifest.VERSION +'">r' + manifest.VERSION + '</a> of the ' +
            '<a href="http://www.webkit.org/">WebKit</a> Inspector using the Remote Debugging Protocol.' +
        '</p>'
    ;
}

//
// Start the inspector (noop).
//
Service.prototype.start = function () {
    
};

//
// Stop the inspector.
//
// Unregister all the connected sessions.
//
Service.prototype.stop = function () {
    for (var i in this.sessions.map) {
        this.sessions.unregister(this.sessions.map[i]);
    }
};

/* ************************************************************************** */

//
// Prepare a new debug session.
//
// Used by individual debug engines to prepare a new browser-based session.
//
// Arguments:
//
//  * the main engine service
//  * the engine connection/socket
//  * a user-friendly name for the connection
//
Service.prototype.createSession = function (protocol, engine, engineName) {
    var session = new SessionInstance(
        this.sessions,
        this,
        protocol,
        engine,
        engineName
    );

    this.sessions.register(session);

    return session;
};


/* ************************************************************************** */

module.exports = Service;
