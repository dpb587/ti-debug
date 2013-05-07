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

    // Create our home page which includes segments from all debug engines.
    that.http.app.get('/', function (req, res) {
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
    });

    var context = that.http.createContext('ti-debug');

    // Serve static files from our docroot folder...
    context.get(
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
// Automatically requires the passed `name` and invokes the `create` call with
// the passed `options`. This takes care of creating the web server context for
// the debugging engine.
//
Service.prototype.createBackend = function (backend, options) {
    return this.backends[backend.getName()] = backend.createBackend(
        this,
        this.http.createContext(backend.getName()),
        options,
        this.logger
    );
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
// Automatically requires the passed `name` and invokes the `create` call with
// the passed `options`. This takes care of creating the web server context for
// the debugging engine.
//
Service.prototype.createFrontend = function (frontend, options) {
    return this.frontends[frontend.getName()] = frontend.createFrontend(
        this,
        this.http.createContext(frontend.getName()),
        options,
        this.logger
    );
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

Service.prototype.createSession = function (backend, backendSocket) {
    var id = uuid.v4();
    var session = new Session(
        id,
        this,
        backend,
        backendSocket
    );

    return this.sessions[id] = session;
};

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
