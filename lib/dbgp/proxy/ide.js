var net = require('net');

/* ************************************************************************** */

function buildErrorResponse(cmd, errorId, errorMessage) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n'
        + '<' + cmd + ' success="0"><error id="' + errorId + '"><message>' + errorMessage + '</message></' + cmd + '>';
}

/* ************************************************************************** */

function IDE(options, logger) {
    options = options || {};
    this.options = {};
    this.options.host = options.host || null;
    this.options.port = options.port || 9001;

    this.logger = logger;

    this.origin = null;

    this.server = net.createServer();
    this.server.on('listening', this.emit.bind(this, 'listening'));
    this.server.on('connection', this.acceptConnection.bind(this));
    this.server.on('close', this.emit.bind(this, 'close'));
    this.server.on('error', this.emit.bind(this, 'error'));

    // logger

    if (this.logger) {
        this.server.on(
            'listening',
            function () {
                this.logger.info(
                    '[dbgp-proxy] listening on '
                        + this.server.address().address + ':' + this.server.address().port
                );
            }.bind(this)
        );
    }
}

IDE.prototype.__proto__ = require('events').EventEmitter.prototype;

IDE.prototype.acceptConnection = function (socket) {
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

            that.map[parts['-k']] = {
                address : socket.remoteAddress,
                port : parts['-p'],
                multi : (parts['-m'] || 0) == 1
            };

            return socket.end('<?xml version="1.0" encoding="UTF-8"?>\n'
                + '<proxyinit success="1" idekey="' + parts['-k'] + '" address="' + that.dbgp.server.address().address + '" port="' + that.dbgp.server.address().port + '" />');
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

IDE.prototype.initiate = function (idekey, socket) {
    
};

IDE.prototype.registerWebService = function (web) {
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

IDE.prototype.start = function () {
    this.server.listen(this.options.port, this.options.host);
};

/* ************************************************************************** */

module.exports = IDE;
