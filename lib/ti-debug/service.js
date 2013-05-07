var uuid = require('node-uuid')

var Http = require('./http');
var Session = require('./session');
var view = require('./view');

/* ************************************************************************** */

//
// The main ti-debug manager.
//
// Its primary purpose is to act as liaison between various, arbitrary debugging
// backends and facilitate creating user-accessible debugging sessions.
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

    that.backends = {};
    that.frontends = {};
    that.sessions = {};

    that.http = new Http(that.options, that.logger);

    // Create our home page which includes sections from all debug engines.
    // Sections are typically used for jump-starting debugging.
    that.http.app.get(
        '/',
        function (req, res) {
            var html = '';
            var first = true;
    
            for (var name in that.backends) {
                html +=
                    (first ? '' : '<hr />') +
                    '<div class="row">' +
                        '<div class="span3" style="text-align:right;"><h1>' + name + '</h2></div>' +
                        '<div id="' + name + '" class="span9">' + that.backends[name].getAppIndex() + '</div>' +
                    '</div>'
                ;
    
                first = false;
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
                backends : {},
                frontends : {},
                sessions : []
            };

            for (var name in that.backends) {
                data.backends[name] = that.backends[name].getStatus();
            }

            for (var name in that.frontends) {
                data.frontends[name] = that.frontends[name].getStatus();
            }

            for (var id in that.sessions) {
                var session = that.sessions[id];

                data.sessions.push(
                    {
                        id : id,
                        state : session.state,
                        backend : session.backend.name,
                        frontend : session.frontend.name,
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
        '/*',
        function (req, res) {
            res.sendfile(req.params[0], { root : __dirname + '/docroot' });
        }
    );
}

////////////////////////////////////////////////////////////////////////////////
//
// Backends
// ---------
////////////////////////////////////////////////////////////////////////////////

//
// Create and register a debugging backend.
//
// It accepts a class with a `create` and `getName` function that will be used
// when creating the backend service.
//
Service.prototype.createBackend = function (backend, options) {
    var name = backend.getName();

    this.backends[name] = backend.createBackend(
        this,
        this.http.createContext(backend.getName()),
        options,
        this.logger
    );

    this.backends[name].name = name;

    return this.backends[name];
};

//
// Retrieve a backend by name.
//
Service.prototype.getBackend = function (name) {
    return this.backends[name];
};

////////////////////////////////////////////////////////////////////////////////
//
// Frontends
// ---------
////////////////////////////////////////////////////////////////////////////////

//
// Create and register a debugging frontend.
//
// It accepts a class with a `create` and `getName` function that will be used
// when creating the frontend service.
//
Service.prototype.createFrontend = function (frontend, options) {
    var name = frontend.getName();

    this.frontends[name] = frontend.createFrontend(
        this,
        this.http.createContext(frontend.getName()),
        options,
        this.logger
    );

    this.frontends[name].name = name;

    return this.frontends[name];
};

//
// Retrieve a frontend by name.
//
Service.prototype.getFrontend = function (name) {
    return this.frontends[name];
};

////////////////////////////////////////////////////////////////////////////////
//
// Sessions
// --------
////////////////////////////////////////////////////////////////////////////////

//
// Create a new debug session for a backend.
//
// Whenever a backend debugger has a session that can be debugged, it gets
// created here. Once created, the backend is responsible for notifying the
// client the session is available and how to connect.
//
Service.prototype.createSession = function (backend, backendSocket, options) {
    var that = this;

    var id = uuid.v4();
    var session = new Session(
        id,
        backend,
        backendSocket,
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

    for (var i in this.backends) {
        this.backends[i].start();
    }

    for (var i in this.frontends) {
        this.frontends[i].start();
    }

    return this;
};

//
// Stop the ti-debug server and all registered services.
//
Service.prototype.stop = function () {
    for (var i in this.frontends) {
        this.frontends[i].stop();
    }

    for (var i in this.backends) {
        this.backends[i].stop();
    }

    this.http.stop();

    return this;
};

/* ************************************************************************** */

module.exports = Service;
