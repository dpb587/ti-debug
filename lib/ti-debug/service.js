var uuid = require('node-uuid')

var Http = require('./http');
var Session = require('./session');
var view = require('./view');

/* ************************************************************************** */

//
// The main ti-debug manager.
//
// Its primary purpose is to act as liaison between various, arbitrary debugging
// services and facilitate creating user-accessible debugging sessions.
//
// Arguments:
//
//  * options hash
//     * `host` - IP address or hostname for binding the web server
//     * `port` - port for binding the web server
//  * an instance of `socket.io/Logger` or `null`
//
function Service(options, logger) {
    var that = this;

    options = options || {};
    that.options = {};
    that.options.host = options.host || '127.0.0.1';
    that.options.port = options.port || 9222;

    that.logger = logger;

    that.services = {};
    that.sessions = {};

    that.http = new Http(that.options, that.logger);

    // Create our home page which includes sections from all debug engines.
    // Sections are typically used for jump-starting debugging.
    that.http.app.get(
        '/',
        function (req, res) {
            var html = '';
            var first = true;
    
            for (var name in that.services) {
                if (!that.services[name].getAppIndex) {
                    continue;
                }

                var topic = that.services[name].getAppIndex();

                if (topic) {
                    html +=
                        (first ? '' : '<hr />') +
                        '<div class="row">' +
                            '<div class="span3" style="text-align:right;"><h1>' + name + '</h2></div>' +
                            '<div id="' + name + '" class="span9">' + that.services[name].getAppIndex() + '</div>' +
                        '</div>'
                    ;
        
                    first = false;
                }
            }
    
            res.set('content-type', 'text/html');
            res.send(view.standard(html));
    
            res.end();
        }
    );

    that.http.app.get(
        '/status.json',
        function (req, res) {
            var data = {
                services : {},
                sessions : []
            };

            for (var name in that.services) {
                data.services[name] = that.services[name].getStatus();
            }

            for (var id in that.sessions) {
                var session = that.sessions[id];

                data.sessions.push(
                    {
                        id : id,
                        state : session.state,
                        backend : session.backend.name,
                        backend_socket : session.backendSocketName,
                        frontend : session.frontend.name,
                        frontend_socket : session.frontendSocketName,
                    }
                );
            }

            res.set('content-type', 'application/json');
            res.send(data);
            res.end();
        }
    );

    // Serve static files from our docroot folder...
    that.http.createContext('ti-debug').get(
        '/socket.io/*',
        function (req, res) {
            res.sendfile(req.params[0], { root : __dirname + '/../../node_modules/socket.io/node_modules/socket.io-client/dist' });
        }
    );
}

////////////////////////////////////////////////////////////////////////////////
//
// Services
// ---------
////////////////////////////////////////////////////////////////////////////////

//
// Create and register a debugging service.
//
// It accepts a class with a `create` and `getName` function that will be used
// when creating the service.
//
Service.prototype.createService = function (service, options) {
    var name = service.MANIFEST.name;

    this.services[name] = service.createService(
        this,
        this.http.createContext(name),
        options,
        this.logger
    );

    this.services[name].name = name;

    return this.services[name];
};

//
// Retrieve a service by name.
//
Service.prototype.getService = function (name) {
    return this.services[name];
};

////////////////////////////////////////////////////////////////////////////////
//
// Sessions
// --------
////////////////////////////////////////////////////////////////////////////////

//
// Create a new debug session for a service.
//
// Whenever a backend debugger has a session that can be debugged, it gets
// created here. Once created, the backend is responsible for notifying the
// client the session is available and how to connect.
//
Service.prototype.createSession = function (backend, backendSocket, backendSocketName, options) {
    var that = this;

    var id = uuid.v4();
    var session = new Session(
        id,
        backend,
        backendSocket,
        backendSocketName,
        options,
        this.logger
    );

    session.on(
        'close',
        function () {
            delete that.sessions[id];
        }
    );

    return this.sessions[id] = session;
};

//
// Retrieve a session by ID.
//
Service.prototype.getSession = function (id) {
    return this.sessions[id];
};


////////////////////////////////////////////////////////////////////////////////
//
// Management Activities
// ---------------------
////////////////////////////////////////////////////////////////////////////////

//
// Start the ti-debug server and all registered services.
//
Service.prototype.start = function () {
    this.http.start();

    for (var i in this.services) {
        this.services[i].start();
    }

    return this;
};

//
// Stop the ti-debug server and all registered services.
//
Service.prototype.stop = function () {
    for (var i in this.services) {
        this.services[i].stop();
    }

    this.http.stop();

    return this;
};

/* ************************************************************************** */

module.exports = Service;
