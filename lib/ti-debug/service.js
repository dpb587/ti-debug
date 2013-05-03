var express = require('express');
var io = require('socket.io');
var http = require('http');

var view = require('./view.js');

/* ************************************************************************** */

function Service(options, logger) {
    var that = this;

    options = options || {};
    that.options = {};
    that.options.host = options.host || '127.0.0.1';
    that.options.port = options.port || 9000;

    that.logger = logger;

    that.protocols = {};

    that.app = express();

    that.http = http.createServer(that.app);
    that.http.setTimeout(5000);

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
                    '<div id="' + name + '" class="span9">' + that.protocols[name].getAppIndex() + '</div>' +
                '</div>'
            ;

            first = false;
        }

        res.set('content-type', 'text/html');
        res.send(view.standard(html));

        res.end();
    });

    that.app.get('/ti-debug/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/docroot' });
    });

    that.create('inspector');
}

Service.prototype.create = function (name, options) {
    var app = express();
    app.base = name;
    app.io = this.http.io.of('/' + name + '.io');
    this.app.use('/' + name, app);

    return this.protocols[name] = require('../' + name).create(this, app, options, this.logger);
};

Service.prototype.get = function (name) {
    return this.protocols[name];
};

Service.prototype.start = function () {
    this.http.listen(this.options.port, this.options.host);

    for (var i in this.protocols) {
        this.protocols[i].start();
    }

    return this;
};

Service.prototype.stop = function () {
    var that = this;

    for (var i in this.protocols) {
        this.protocols[i].stop();
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
