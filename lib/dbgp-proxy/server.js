var net = require('net');

function buildErrorResponse(cmd, errorId, errorMessage) {
    return '<?xml version="1.0" encoding="UTF-8"?>\n'
        + '<' + cmd + ' success="0"><error id="' + errorId + '"><message>' + errorMessage + '</message></' + cmd + '>';
}

function Server() {
    var that = this;

    that.dbgp = null;
    that.map = {};

    that.server = net.createServer();
    that.server.on('listening', function () {
        that.emit('listening', this.address());
    });
    that.server.on('connection', function (socket) {
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
            } else if (parts[0] == 'proxystatus') {
                socket.write('Proxying for ' + that.dbgp.server.address().address + ':' + that.dbgp.server.address().port + '\n');

                for (var k in that.map) {
                    socket.write(k + ' --> ' + that.map[k].address + ':' + that.map[k].port + (that.map[k].multi ? '*' : '') + '\n');
                }

                return socket.end();
            }

            socket.end(buildErrorResponse('proxy', '004', 'Unimplemented'));
        });
    });
    that.server.on('close', that.emit.bind(that, 'close'));
    that.server.on('error', that.emit.bind(that, 'error'));
}

Server.prototype.__proto__ = require('events').EventEmitter.prototype;

Server.prototype.registerWebService = function (web) {
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
};

// @todo support multiple
Server.prototype.addUpstream = function (dbgp) {
    this.dbgp = dbgp;
};

Server.prototype.listen = function (port, host) {
    this.server.listen.apply(this.server, arguments);
};

module.exports = Server;
