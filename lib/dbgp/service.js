var net = require('net');

var Socket = require('./socket');
var ProxyDelegator = require('./proxy/delegator');
var ProxyBrowser = require('./proxy/browser');

/* ************************************************************************** */

function Service(options, logger) {
    this.state = 'DOWN';

    options = options || {};
    this.options = {};
    this.options.host = options.host || null;
    this.options.port = options.port || 9000;

    this.logger = logger;

    this.proxy = new ProxyDelegator();

    this.sockets = [];

    // tcp/ip server

    this.server = net.createServer();

    this.server.on(
        'listening',
        function () {
            this.state = 'UP';
            this.emit('listening');
        }.bind(this)
    );

    this.server.on(
        'close',
        function () {
            this.state = 'DOWN';
            this.emit('close');
        }.bind(this)
    );

    this.server.on('error', this.emit.bind(this, 'error'));

    this.server.on('connection', this.acceptConnection.bind(this));

    // logger

    if (this.logger) {
        this.server.on(
            'listening',
            function () {
                this.logger.info(
                    '[dbgp] listening on '
                        + this.server.address().address + ':' + this.server.address().port
                );
            }.bind(this)
        );

        this.server.on(
            'connection',
            function (socket) {
                this.logger.info('[dbgp] connection from ' + socket.remoteAddress + ':' + socket.remotePort);
            }.bind(this)
        );
    }
}

Service.prototype.__proto__ = require('events').EventEmitter.prototype;

Service.prototype.acceptConnection =  function (socket) {
    var that = this;
    var socket = new Socket(socket, that.logger);

    socket.once(
        'handshake',
        function (data) {
            if (!that.proxy.initiate(this.header.init.idekey, this)) {
                that.logger.info('[dbgp] no handler for ' + this.raw.remoteAddress + ':' + socket.raw.remotePort);
                socket.close();
            } else {
                that.sockets.push(socket);
            }
        }
    );
};

Service.prototype.registerWebService = function (http) {
    var that = this;

    that.proxy.addDelegate('browser', new ProxyBrowser(http, that.logger));

    http.get('/index.html', function (req, res) {
        var help = '';

        help += 'Configure the remote debugging engine to connect with ';
        help += '<code>' + that.options.host + ':' + that.options.port + '</code>. ';

        if (that.proxy.delegates.ide) {
            help += 'Use an IDE debugger client with the proxy server at ';
            help += '<code>' + that.proxy.delegates.ide.options.host + ':' + that.proxy.delegates.ide.options.port + '</code>. ';
            help += 'Alternatively, start a browser debugger client above.';
        } else {
            help += 'Start a a browser debugger client above.';
        }

        res.set('content-type', 'text/html');
        res.send(
            '<form class="form-inline well" action="/dbgp/proxy.html" method="GET">' +
                '<label class="control-label" for="dbgp-proxy-idekey">IDE Key</label> ' +
                '<input id="dbgp-proxy-idekey" name="idekey" type="text" /> ' +
                '<button type="submit" class="btn btn-primary">Start Client &rarr;</button>' +
            '</form>' +
            '<p>' + help + 'The IDE Key must match between the debugger engine and debugger client. Here are some ' +
                'engine-specific hints:' +
            '</p>' +
            '<dl class="dl-horizontal">' +
                '<dt><a href="http://xdebug.org/">Xdebug</a></dt>' +
                '<dd>configure <code>xdebug.remote_host</code>, <code>xdebug.remote_port</code>, <code>xdebug.idekey</code></dd>' +
            '</dl>'
        );
    });
};

Service.prototype.start = function () {
    if (this.state == 'DOWN') {
        this.server.listen(this.options.port, this.options.host);
    }
};

Service.prototype.stop = function () {
    if (this.state == 'UP') {
        this.server.close();
    }
};

/* ************************************************************************** */

module.exports = Service;
