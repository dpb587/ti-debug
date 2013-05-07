var express = require('express');
var io = require('socket.io');
var http = require('http');

var view = require('./view.js');

/* ************************************************************************** */

//
// The main ti-debug manager.
//
// Its primary purpose is to act as liaison between various, arbitrary debugging
// protocols and facilitate creating user-accessible debugging sessions.
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

    that.protocols = {};

    that.app = express();

    that.http = http.createServer(that.app);

    // Enable quicker exiting during shutdown...
    that.http.unref();
    that.http.setTimeout(5000);

    // Create our main `socket.io` listener...
    that.http.io = io.listen(that.http, { 'log level' : 1 });

    // Register some logging listeners...
    if (that.logger) {
        that.http.on(
            'listening',
            function () {
                that.logger.info('[ti-debug#' + that.options.host + ':' + that.options.port + '] listening');
            }
        );

        that.http.on(
            'close',
            function () {
                that.logger.info('[ti-debug#' + that.options.host + ':' + that.options.port + '] closed');
            }
        );
    }

    // Create our home page which includes segments from all debug engines.
    that.app.get('/', function (req, res) {
        var html = '';
        var first = true;

        for (var name in that.protocols) {
            html +=
                (first ? '' : '<hr />') +
                '<div class="row">' +
                    '<div class="span3" style="text-align:right;"><h1>' + name + '</h2></div>' +
                    '<div id="' + name + '" class="span9">' + that.protocols[name].getAppIndex() + '</div>' +
                '</div>'
            ;

            first = false;
        }

        res.set('content-type', 'text/html');
        res.send(view.standard(html));

        res.end();
    });

    // Serve static files from our docroot folder...
    that.app.get('/ti-debug/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/docroot' });
    });

    // The inspector is a required service, so register it now...
    that.create('inspector');
}

//
// Create and register a debugging protocol.
//
// Automatically requires the passed `name` and invokes the `create` call with
// the passed `options`. This takes care of creating the web server context for
// the debugging engine.
//
Service.prototype.create = function (name, options) {
    var app = express();
    app.base = name;
    app.io = this.http.io.of('/' + name + '.io');
    this.app.use('/' + name, app);

    return this.protocols[name] = require('../' + name).create(this, app, options, this.logger);
};

//
// Retrieve a protocol by name.
//
Service.prototype.get = function (name) {
    return this.protocols[name];
};

//
// Start the ti-debug server and all registered debug engines.
//
Service.prototype.start = function () {
    this.http.listen(this.options.port, this.options.host);

    for (var i in this.protocols) {
        this.protocols[i].start();
    }

    return this;
};

// Stop the ti-debug server and all registered debug engines.
//
Service.prototype.stop = function () {
    var that = this;

    that.http.close();

    for (var i in this.protocols) {
        this.protocols[i].stop();
    }

    return that;
};

/* ************************************************************************** */

module.exports = Service;
