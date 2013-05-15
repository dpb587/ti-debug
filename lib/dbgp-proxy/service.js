var net = require('net');

var ClientIDE = require('./client-api/ide');
var view = require('../ti-debug/view');

/* ************************************************************************** */

function buildErrorResponse(cmd, errorId, errorMessage) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n'
        + '<' + cmd + ' success="0"><error id="' + errorId + '"><message>' + errorMessage + '</message></' + cmd + '>';
}

/* ************************************************************************** */

//
// For proxied, multipled developer debugging.
//
// All debugger-initiated sessions will be dependent on the IDE key.
//
function Service(tidebug, app, options, logger) {
    var that = this;

    options = options || {};
    that.options = {};
    that.options.dbgp = options.dbgp || {};
    that.options.host = options.host || '127.0.0.1';
    that.options.port = options.port || 9001;
    that.options.autoregister = options.autoregister || {};

    that.tidebug = tidebug;
    that.logger = logger;

    // As a proxy, we also have our own server that remote IDEs can register
    // with.
    that.server = net.createServer();
    that.server.on('connection', that.acceptConnection.bind(that));

    // Add some logging, if available...
    if (that.logger) {
        that.server.on(
            'listening',
            function () {
                that.logger.info('[dbgp-proxy#' + that.options.host + ':' + that.options.port + '] listening');
            }
        );

        that.server.on(
            'close',
            function () {
                that.logger.info('[dbgp-proxy#' + that.options.host + ':' + that.options.port + '] closed');
            }
        );
    }

    that.registerApp(app);
}

/* ************************************************************************** */

Service.prototype.acceptConnection = function (socket) {
    var that = this;

    socket.setEncoding('ascii');

    socket.on('data', function (data) {
        var parts = data.replace('\r\n', '').split(' ');
        var last = null;

        for (var i = 1; i < parts.length; i ++) {
            if (last) {
                parts[last] = parts[i];
                last = null;
            } else {
                last = parts[i];
            }
        }

        if (parts[0] == 'proxyinit') {
            if (!parts['-p']) {
                return socket.end(buildErrorResponse('proxyinit', '003', 'Missing IDE port (-p)'));
            } else if (!parts['-k']) {
                return socket.end(buildErrorResponse('proxyinit', '003', 'Missing IDE key (-k)'));
            }

            var client = new ClientIDE(
                that,
                parts['-k'],
                (parts['-m'] || 0),
                socket.remoteAddress,
                parts['-p']
            );

            that.tidebug.getService('dbgp').registerClient(client);

            return socket.end(
                '<?xml version="1.0" encoding="UTF-8"?>\n'
                    + '<proxyinit success="1" idekey="' + client.idekey + '" address="' + that.tidebug.getService('dbgp').options.host + '" port="' + that.tidebug.getService('dbgp').options.port + '" />'
            );
        } else if (parts[0] == 'proxystop') {
            if (!parts['-k']) {
                return socket.end(buildErrorResponse('proxystop', '003', 'Missing IDE key (-k)'));
            }

            var client = that.tidebug.getService('dbgp').lookupClient(parts['-k']);

            if (client) {
                that.tidebug.getService('dbgp').unregisterClient(client);
            }

            return socket.end('<?xml version="1.0" encoding="UTF-8"?>\n'
                + '<proxyinit success="1" idekey="' + parts['-k'] + '" />');
        }

        socket.end(buildErrorResponse('proxy', '004', 'Unimplemented'));
    });
};

//
// Register routes for the web server.
//
// In addition to the standard routes, we need a specific landing page where
// clients have specified their IDE key.
//
Service.prototype.registerApp = function (app) {
    var that = this;

    // Add the proxy landing page.
    app.get('/client.html', function (req, res) {
        // Landing page always needs the `idekey` query parameter.
        if (!req.query.idekey) {
            res.send(404, 'The required idekey parameter is missing.');
            res.end();

            return;
        }

        // Show a basic page to show the connection status and event log...
        res.send(view.standard(
            '<script type="text/javascript" src="/dbgp/connect.js"></script>' +
            '<script type="text/javascript" src="./proxy.js"></script>' +
            '<div class="row">' +
                '<div class="span3" style="text-align:right;"><h2>dbgp</h2></div>' +
                '<div id="dbgp-status" class="span9" data-idekey="' + req.query.idekey + '" data-multiple="' + (req.query.multiple || '0') + '">' +
                    '<div class="alert">Connecting&hellip;</div>' +
                '</div>' +
            '</div>' +
            '<div class="row">' +
                '<div class="span3">&nbsp;</div>' +
                '<div class="span9">' +
                    '<p>The <a href="http://xdebug.org/docs-dbgp.php#connection-initialization">IDE Key</a> must match between ' +
                        'the debugger engine and debugger client. Here are some hints:</p>' +
                    '<dl class="dl-horizontal">' +
                        '<dt><a href="http://php.net/">PHP</a> (<a href="http://xdebug.org/">Xdebug</a>)</dt>' +
                        '<dd><pre><code>' +
                            'xdebug.remote_enable = 1\n' +
                            'xdebug.remote_autostart = 1\n' +
                            'xdebug.remote_host = ' + that.tidebug.getService('dbgp').options.host + '\n' +
                            'xdebug.remote_port = ' + that.tidebug.getService('dbgp').options.port + '\n' +
                            'xdebug.idekey = ' + req.query.idekey + '\n' +
                        '</code></pre></dd>' +
                    '</dl>' +
                '</div>' +
            '</div>' +
            '<div class="row">' +
                '<div class="span3">&nbsp;</div>' +
                '<div id="dbgp-log" class="span9"><table class="table"><thead><tr><th colspan="2">Event Log</th></tr></thead><tbody></tbody></table></div>' +
            '</div>'
        ));

        res.end();
    });

    // Add a route for some useful javascript functions...
    app.get('/proxy.js', function (req, res) {
        res.sendfile('proxy.js', { root : __dirname + '/docroot' });
    });
};

//
// Retrieve content for the home page segment.
//
Service.prototype.getAppIndex = function () {
    return '<form class="form-inline well" action="/dbgp-proxy/client.html" method="GET">' +
            '<label class="control-label" for="dbgp-proxy-idekey">IDE Key</label> ' +
            '<input id="dbgp-proxy-idekey" name="idekey" type="text" /> ' +
            '<button type="submit" class="btn btn-primary">Start Client &rarr;</button>' +
        '</form>'
    ;
}

//
// Retrieve general status information
//
Service.prototype.getStatus = function () {
    return {
        listener : {
            host : this.options.host,
            port : this.options.port
        }
    };
};

//
// Retrieve DBGp-supported Inspector agents
//
Service.prototype.getProtocol = function (frontend, session) {
    if ('dbgp-proxy' == frontend.name) {
        return {};
    } else {
        throw new Error('Unknown frontend: ' + frontend.name);
    }
};

//
// Handle a new browser-based session.
//
Service.prototype.sessionPaired = function (session) {
    // nop
};

//
// Start the DBGp proxy.
//
Service.prototype.start = function () {
    // And also our own proxy server...
    this.server.listen(this.options.port, this.options.host);

    if (this.options.autoregister) {
        for (var idekey in this.options.autoregister) {
            var addr = this.options.autoregister[idekey].split(':');

            this.tidebug.getService('dbgp').registerClient(
                new ClientIDE(
                    this,
                    idekey,
                    addr[2] ? parseInt(addr[2], 10) : 0,
                    addr[0],
                    addr[1]
                )
            );
        }
    }

    return this;
};

//
// Stop the DBGp proxy.
//
Service.prototype.stop = function () {
    this.server.close();

    return this;
};

/* ************************************************************************** */

module.exports = Service;
