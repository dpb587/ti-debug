var express = require('express');
var io = require('socket.io');
var uuid = require('node-uuid');

var view = require('./view.js');

/* ************************************************************************** */

function Server(options, logger) {
    this.state = 'DOWN';

    options = options || {};
    this.options = {};
    this.options.host = options.host || null;
    this.options.port = options.port || 9000;

    this.logger = logger;

    this.services = {};

    this.http = express.createServer();

    this.http.on(
        'listening',
        function () {
            this.state = 'UP';
            this.emit('listening');

            for (var name in this.services) {
                this.services[name].start();
            }
        }.bind(this)
    );

    this.http.on(
        'close',
        function () {
            this.state = 'DOWN';
            this.emit('close');
        }.bind(this)
    );

    this.http.io = io.listen(this.http, { 'log level' : 1 });

    if (this.logger) {
        this.http.on(
            'listening',
            function () {
                this.logger.info(
                    '[ti-debug] listening on '
                        + this.http.address().address + ':' + this.http.address().port
                );
            }.bind(this)
        );
    }

    this.registerWebService(this.http);
}

Server.prototype.__proto__ = require('events').EventEmitter.prototype;

Server.prototype.registerWebService = function (http) {
    var that = this;

    that.http.get('/', function (req, res) {
        var html = '';
        var first = true;

        for (var name in that.services) {
            html +=
                (first ? '' : '<hr />') +
                '<div class="row">' +
                    '<div class="span2" style="text-align:right;"><h1>' + name + '</h2></div>' +
                    '<div id="' + name + '" class="span10" data-url="/' + name + '/index.html"></div>' +
                '</div>'
            ;

            first = false;
        }

        res.send(view.standard(html), { 'content-type' : 'text/html' });
    });

    that.http.get('/ti-debug/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/http' });
    });
}

Server.prototype.addService = function (name, server) {
    var that = this;
    var server = ('function' == typeof server) ? server(name) : server;

    if ('undefined' != typeof this.services[name]) {
        throw new Error('Server name "' + name + '" is already defined.');
    }

    var http = express.createServer();
    http.base = name;
    http.io = this.http.io.of('/' + name + '.io');
    server.registerWebService(http);

    this.http.use('/' + name, http);

    that.services[name] = server;

    return server;
};

Server.prototype.start = function () {
    this.http.listen(this.options.port, this.options.host);
};

/* ************************************************************************** */

module.exports = Server;
module.exports.VERSION = 'v0.1.0-dev';
