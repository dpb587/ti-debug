var view = require('./view');
var SocketTools = require('./socket_tools');

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
            SocketTools.upgrade(that, socket, that.logger);
            
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
