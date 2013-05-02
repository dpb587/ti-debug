var express = require('express');
var io = require('socket.io');
var http = require('http');
var SessionInstance = require('./engine/session/instance');
var SessionMap = require('./engine/session/map');

var view = require('./view.js');

/* ************************************************************************** */

function Service(options, logger) {
    var that = this;

    options = options || {};
    that.options = {};
    that.options.host = options.host || null;
    that.options.port = options.port || 9000;

    that.logger = logger;

    that.protocols = {};

    that.sessions = new SessionMap();

    that.app = express();

    that.http = http.createServer(that.app);
    that.http.setTimeout(5000);

    that.http.on(
        'listening',
        function () {
            for (var name in that.protocols) {
                //that.protocols[name].start();
            }
        }
    );

    that.http.io = io.listen(that.http, { 'log level' : 1 });

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

    that.app.get('/', function (req, res) {
        var html = '';
        var first = true;

        for (var name in that.protocols) {
            html +=
                (first ? '' : '<hr />') +
                '<div class="row">' +
                    '<div class="span3" style="text-align:right;"><h1>' + name + '</h2></div>' +
                    '<div id="' + name + '" class="span9" data-url="/' + name + '/index.html"></div>' +
                '</div>'
            ;

            first = false;
        }

        res.set('content-type', 'text/html');
        res.send(view.standard(html));

        res.end();
    });

    that.app.get('/ti-debug/status.json', function (req, res) {
        var protocols = [];

        for (var i in that.protocols) {
            protocols.push(that.protocols[i].getName());
        }

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

        res.send(
            {
                protocols : protocols,
                sessions : sessions
            }
        );

        res.end();
    });

    that.app.get('/ti-debug/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/docroot' });
    });
}

Service.prototype.__proto__ = require('events').EventEmitter.prototype;

Service.prototype.createSession = function (protocol, engine, engineName) {
    var session = new SessionInstance(
        this.sessions,
        this,
        this.protocols[protocol],
        engine,
        engineName
    );

    this.sessions.register(session);

    return session;
};

Service.prototype.register = function (protocol) {
    var that = this;

    var name = protocol.getName();

    if ('undefined' != typeof this.protocols[name]) {
        throw new Error('Protocol "' + name + '" is already defined.');
    }

    var http = express();
    http.base = name;
    http.io = this.http.io.of('/' + name + '.io');
    protocol.register(that, http);

    this.app.use('/' + name, http);

    that.protocols[name] = protocol;

    return protocol;
};

Service.prototype.start = function () {
    this.http.listen(this.options.port, this.options.host);

    return this;
};

Service.prototype.stop = function () {
    var that = this;

    for (var i in that.sessions.map) {
        that.sessions.map[i].detach('ti-debug server is stopping');
    }

    process.nextTick(
        function () {
            that.http.close();
        }
    );

    return that;
};

/* ************************************************************************** */

module.exports = Service;
