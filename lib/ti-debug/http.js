var express = require('express');
var io = require('socket.io');
var http = require('http');

function Http(options, logger) {
    var that = this;

    that.options = options;
    that.logger = logger;

    that.contexts = {};

    that.app = express();

    that.http = http.createServer(that.app);

    // Enable quicker exiting during shutdown...
    that.http.unref();
    that.http.setTimeout(5000);

    // Create our main `socket.io` listener...
    that.socketio = io.listen(that.http, { 'log level' : 1 });

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
}

Http.prototype.createContext = function (name) {
    if (!(name in this.contexts)) {
        var app = express();
        app.io = this.socketio.of('/' + name + '.io');
        this.app.use('/' + name, app);
        this.contexts[name] = app;
    }

    return this.contexts[name];
};

Http.prototype.start = function () {
    this.http.listen(this.options.port, this.options.host);
};

Http.prototype.stop = function () {
    this.http.close();
};

module.exports = Http;
