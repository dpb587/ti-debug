var net = require('net');

var SocketTools = require('./socket_tools');

/* ************************************************************************** */

//
// The main DBGp client service.
//
// The DBGp engine initiates a debug session by connecting to a client, so this
// takes care of receiving those connections and turning them into something
// useful.
//
// Because the client can operate in two modes, either a `direct` or `proxy`
// resolver must be passed and is used for determining whether there's an actual
// client ready to debug.
//
// Arguments:
//
//  * instance of either `dbgp/engine/resolver/direct/service` or
//    `dbgp/engine/resolver/proxy/service`
//  * options hash
//     * `host` - IP address or hostname for binding the DBGp client
//     * `port` - port for binding the DBGp client
//  * an instance of `socket.io/Logger` or `null`
//
function Service(resolver, options, logger) {
    var that = this;

    that.state = 'DOWN';

    that.resolver = resolver;

    options = options || {};
    that.options = {};
    that.options.host = options.host || '127.0.0.1';
    that.options.port = options.port || 9000;

    that.logger = logger;

    that.server = net.createServer();

    // Make sure we're listening for connections...
    that.server.on(
        'connection',
        function (socket) {
            var name = socket.remoteAddress + ':' + socket.remotePort;

            SocketTools.upgrade(socket);

            // The first message we receive should always be the header and include
            // information about what debug client the session is intended for.
            socket.once(
                'payload',
                function (payload) {
                    // Keep the header payload for later reference...
                    socket.header = payload;
        
                    // Find a client that will accept this debug session...
                    var client = that.resolver.lookupClient(this.header.init.idekey);
        
                    if (!client) {
                        // Without a client, we should just immediately disconnect...
                        if (that.logger) {
                            that.logger.info('[dbgp#' + socket.remoteAddress + ':' + socket.remotePort + '] no handler for idekey=' + this.header.init.idekey);
                        }
        
                        socket.end();
                    } else {
                        // Tell the client it should initiate a session...
                        client.initiate(socket);
                    }
                }
            );

            // Add some logging, if available...
            if (that.logger) {
                that.logger.info('[dbgp#' + name + '] connected');
        
                socket.on(
                    'close',
                    function () {
                        that.logger.info('[dbgp#' + name + '] disconnected');
                    }
                );
            }
        }
    );

    // Add some logging, if available...
    if (that.logger) {
        that.server.on(
            'listening',
            function () {
                that.logger.info('[dbgp#' + that.options.host + ':' + that.options.port + '] listening');
            }
        );

        that.server.on(
            'close',
            function () {
                that.logger.info('[dbgp#' + that.options.host + ':' + that.options.port + '] closed');
            }
        );
    }
}

//
// Start up the DBGp client.
//
Service.prototype.start = function () {
    this.server.listen(this.options.port, this.options.host);

    this.state = 'UP';

    return this;
};

//
// Stop the DBGp client.
//
Service.prototype.stop = function () {
    var that = this;

    if (that.state != 'UP') {
        return;
    }

    that.state = 'DOWN';

    process.nextTick(
        function () {
            that.server.close();
        }
    );

    return that;
};

/* ************************************************************************** */

module.exports = Service;
