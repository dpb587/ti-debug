var SessionInstance = require('./session/instance');
var SessionManager = require('./session/manager');

var manifest = require('./manifest');
var view = require('./view');

var BackendInspectorSchema = require('fs').readFileSync(__dirname + '/schema.json', 'utf8');

/* ************************************************************************** */

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

    app.io.on(
        'connection',
        function (socket) {
            var session;
            var callbacks = {};
            var sendCount = 0;

            socket.on(
                'attach',
                function (data, cb) {
                    session = that.sessions.lookup(data.sid);

                    if (!session) {
                        if (that.logger) {
                            that.logger.warn('[inspector#' + socket.id + '] session ' + data.sid + ' does not exist.');
                        }
                
                        return;
                    } else if (session.attached) {
                        if (that.logger) {
                            that.logger.warn('[inspector#' + socket.id + '] session ' + data.sid + ' is already attached.');
                        }
                
                        return;
                    }
                
                    if (that.logger) {
                        that.logger.info('[inspector#' + socket.id + '] connected to session ' + data.sid);
                    }
                
                    session.attached = true;
                    session.attach(socket, this.handshake.address.address + ':' + this.handshake.address.port + '#' + this.id);

                    cb(BackendInspectorSchema);
                }
            );

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
                
                    var raw = this.raw;
                
                    function callback(result) {
                        socket.emit('event', {
                            id : messageObject.id,
                            result : result
                        });
                    }
                
                    dispatcher[functionName].call(dispatcher, messageObject.params, callback)
                }
            );
            
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

    app.get('/index.html', function (req, res) {
        res.set('content-type', 'text/html');
        res.send(
            '<p>' +
                'The browser client is powered by <a href="http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/inspector/front-end/?p=' + manifest.VERSION +'">r' + manifest.VERSION + '</a> of the ' +
                '<a href="http://www.webkit.org/">WebKit</a> Inspector using the Remote Debugging Protocol.' +
            '</p>'
        );

        res.end();
    });

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

    app.get('/patch/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/docroot/inspector-patch' });
    });

    app.get('/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/docroot/inspector' });
    });
};

Service.prototype.start = function () {
};

Service.prototype.stop = function () {
    for (var i in that.sessions.map) {
        that.sessions.map[i].detach('ti-debug server is stopping');
    }
};

/* ************************************************************************** */

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
