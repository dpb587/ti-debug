var net = require('net');

var CommonResolver = require('../common/service');
var view = require('../../../../ti-debug/view');

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
function ProxyResolver(tidebug, app, options, logger) {
    var that = this;

    CommonResolver.apply(that, arguments);

    options = options || {};
    that.options = {};
    that.options.dbgp = options.dbgp || {};
    that.options.host = options.host || '127.0.0.1';
    that.options.port = options.port || 9001;

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
}

ProxyResolver.prototype.__proto__ = CommonResolver.prototype;

//
// Specify options for the DBGp Client.
//
// In proxy mode, we use the `dbgp` key.
//
ProxyResolver.prototype.getClientOptions = function () {
    return this.options.dbgp;
};

//
// Lookup a client by IDE key.
//
// In proxy mode, it's a simple key lookup.
//
ProxyResolver.prototype.lookupClient = function (idekey) {
    return idekey in this.clients ? this.clients[idekey] : null;
};

ProxyResolver.prototype.acceptConnection = function (socket) {
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

            var client = that.client.clients.register(
                new Client(
                    parts['-k'],
                    (parts['-m'] || 0),
                    socket.remoteAddress,
                    parts['-p']
                )
            );

            return socket.end(
                '<?xml version="1.0" encoding="UTF-8"?>\n'
                    + '<proxyinit success="1" idekey="' + client.idekey + '" address="' + that.client.options.host + '" port="' + that.client.options.port + '" />'
            );
        } else if (parts[0] == 'proxystop') {
            if (!parts['-k']) {
                return socket.end(buildErrorResponse('proxystop', '003', 'Missing IDE key (-k)'));
            }

            delete that.map[parts['-k']];

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
ProxyResolver.prototype.registerApp = function (app) {
    var that = this;

    // Make sure to include the common routes...
    CommonResolver.prototype.registerApp.apply(that, arguments);

    // Add the proxy landing page.
    app.get('/proxy.html', function (req, res) {
        // Landing page always needs the `idekey` query parameter.
        if (!req.query.idekey) {
            res.send(404, 'The required idekey parameter is missing.');
            res.end();

            return;
        }

        // Show a basic page to show the connection status and event log...
        res.send(view.standard(
            '<script type="text/javascript" src="./connect.js"></script>' +
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
                            'xdebug.remote_host = ' + that.client.options.host + '\n' +
                            'xdebug.remote_port = ' + that.client.options.port + '\n' +
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
ProxyResolver.prototype.getAppIndex = function () {
    return '<form class="form-inline well" action="/dbgp/proxy.html" method="GET">' +
            '<label class="control-label" for="dbgp-proxy-idekey">IDE Key</label> ' +
            '<input id="dbgp-proxy-idekey" name="idekey" type="text" /> ' +
            '<button type="submit" class="btn btn-primary">Start Client &rarr;</button>' +
        '</form>'
    ;
}

//
// Retrieve general status information
//
ProxyResolver.prototype.getStatus = function () {
    // Make sure to start with the default info
    var status = CommonResolver.prototype.getStatus.apply(this, arguments);

    status.proxy = {
        host : this.options.host,
        port : this.options.port
    };
};

//
// Start the DBGp proxy and client.
//
ProxyResolver.prototype.start = function () {
    // Make sure to start the standard DBGp client...
    CommonResolver.prototype.start.apply(this, arguments);

    // And also our own proxy server...
    this.server.listen(this.options.port, this.options.host);

    return this;
};

//
// Stop the DBGp proxy and client.
//
ProxyResolver.prototype.stop = function () {
    this.server.close();

    CommonResolver.prototype.stop.apply(this, arguments);

    return this;
};

/* ************************************************************************** */

module.exports = ProxyResolver;
