var net = require('net');

/* ************************************************************************** */

function buildErrorResponse(cmd, errorId, errorMessage) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n'
        + '<' + cmd + ' success="0"><error id="' + errorId + '"><message>' + errorMessage + '</message></' + cmd + '>';
}

/* ************************************************************************** */

function Proxy(dbgp, options, logger) {
    var that = this;

    that.dbgp = dbgp;

    options = options || {};
    that.options = {};
    that.options.host = options.host || '127.0.0.1';
    that.options.port = options.port || 9001;

    that.clients = {};

    that.logger = logger;

    that.server = net.createServer();
    that.server.on('connection', that.acceptConnection.bind(that));

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

Proxy.prototype.__proto__ = require('events').EventEmitter.prototype;

Proxy.prototype.acceptConnection = function (socket) {
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

            var client = that.dbgp.clients.register(
                new ClientTCP(
                    parts['-k'],
                    (parts['-m'] || 0),
                    socket.remoteAddress,
                    parts['-p']
                )
            );

            return socket.end(
                '<?xml version="1.0" encoding="UTF-8"?>\n'
                    + '<proxyinit success="1" idekey="' + clients.idekey + '" address="' + that.dbgp.options.host + '" port="' + that.dbgp.options.port + '" />'
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

Proxy.prototype.registerWebService = function (web) {
    var that = this;

    web.get('/status.json', function (req, res) {
        res.send({
            status : 'up',
            listen : {
                address : that.server.address().address,
                port : that.server.address().port
            },
            clients : that.map
        });
    });

    web.get('/index.html', function (req, res) {
        res.sendfile('index.html', { root : __dirname + '/frontend-web' });
    });
};

Proxy.prototype.start = function () {
    this.server.listen(this.options.port, this.options.host);

    return this;
};

Proxy.prototype.stop = function () {
    this.server.close();

    return this;
};

/* ************************************************************************** */

module.exports = Proxy;
