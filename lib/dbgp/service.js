var net = require('net');
var TiDebugClient = require('./client-api/tidebug');
var agents = {
    Console : require('./protocol/inspector/agent/console'),
    CSS : require('./protocol/inspector/agent/css'),
    Database : require('./protocol/inspector/agent/database'),
    Debugger : require('./protocol/inspector/agent/debugger'),
    DOM : require('./protocol/inspector/agent/dom'),
    DOMStorage : require('./protocol/inspector/agent/domstorage'),
    HeapProfiler : require('./protocol/inspector/agent/heap_profiler'),
    Inspector : require('./protocol/inspector/agent/inspector'),
    Network : require('./protocol/inspector/agent/network'),
    Page : require('./protocol/inspector/agent/page'),
    Profiler : require('./protocol/inspector/agent/profiler'),
    Runtime : require('./protocol/inspector/agent/runtime'),
    Timeline : require('./protocol/inspector/agent/timeline'),
    Worker : require('./protocol/inspector/agent/worker')
};
var SocketTools = require('./socket_tools');

/* ************************************************************************** */

//
// Shared functionality between proxy and direct protocols.
//
// This takes care of creating the actual DBGp client which listens on
// localhost:9000 for incoming connections. DBGp can operate in two practical
// modes:
//
//  * **Direct** - when a single developer is debugging and all remote debug
//    requests end up at their terminal.
//  * **Proxy** - when multiple developers may be debugging based on the
//    `idekey` configuration option. When connections are received, they are
//    forwarded to the appropriate developer and IDE.
//
function Service(tidebug, app, options, logger) {
    var that = this;

    this.clients = {};
    this.tidebug = tidebug;
    this.logger = logger;
    this.options = options;

    this.registerApp(app);

    that.state = 'DOWN';

    that.server = net.createServer();

    // Make sure we're listening for connections...
    that.server.on(
        'connection',
        function (socket) {
            var name = socket.remoteAddress + ':' + socket.remotePort;

            SocketTools.upgrade(socket, that.logger);

            // The first message we receive should always be the header and include
            // information about what debug client the session is intended for.
            socket.once(
                'payload',
                function (payload, raw) {
                    // Keep the header payload for later reference...
                    socket.header = payload;

                    // Find a client that will accept this debug session...
                    var client = that.lookupClient(payload.init.idekey);
        
                    if (!client) {
                        // Without a client, we should just immediately disconnect...
                        if (that.logger) {
                            that.logger.info('[dbgp#' + socket.remoteAddress + ':' + socket.remotePort + '] no handler for idekey=' + payload.init.idekey);
                        }
        
                        socket.end();
                    } else {
                        // Tell the client it should initiate a session...
                        client.initiate(socket, raw);
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
// Take care of registering a DBGp client.
//
// Whenever a client (whether direct or proxy) connects it needs to be
// registered so it can re-establish a debug session connection.
//
Service.prototype.registerClient = function (client) {
    var existing = this.lookupClient(client.idekey);

    if (existing) {
        this.unregisterClient(existing);
    }

    if (this.logger) {
        this.logger.info('[dbgp:resolver] registered idekey=' + client.idekey);
    }

    return this.clients[client.idekey] = client;
};

//
// Remove a DBGp client.
//
Service.prototype.unregisterClient = function (client) {
    for (var i in this.clients) {
        if (client == this.clients[i]) {
            delete this.clients[i];

            client.unregister();

            if (this.logger) {
                this.logger.info('[dbgp:resolver] unregistered client idekey=' + client.idekey);
            }

            return;
        }
    }
}

Service.prototype.lookupClient = function (idekey) {
    if (this.tidebug.getService('dbgp-proxy')) {
        return idekey in this.clients ? this.clients[idekey] : null;
    }

    for (var i in this.clients) {
        return this.clients[i];
    }

    return null;
};

//
// Retrieve the list of active client registrations.
//
Service.prototype.getClients = function () {
    return this.clients;
};

//
// Start the DBGp client.
//
Service.prototype.start = function () {
    this.server.listen(this.options.port, this.options.host);

    this.state = 'UP';

    return this;
}

//
// Stop the DBGp client and unregister all clients.
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

    for (var i in that.clients) {
        that.unregisterClient(that.clients[i]);
    }

    return that;
};

//
// Register routes for the web server.
//
// This includes logic for accepting web-based sessions.
//
Service.prototype.registerApp = function (app) {
    var that = this;

    // 
    app.io.on(
        'connection',
        function (socket) {
            var client;

            // We really only care about a couple events.

            // Emulate the DBGp protocol `proxyinit` command for establishing a
            // browser connection.
            socket.on(
                'proxyinit',
                function (data, cb) {
                    client = new TiDebugClient(
                        that,
                        data.idekey,
                        ('1' == data.m ? true : false),
                        socket
                    );

                    that.registerClient(client);

                    socket.on(
                        'disconnect',
                        function () {
                            that.unregisterClient(client);
                        }
                    );

                    cb(data.idekey);
                }
            );

            // Listen to the socket closing and unregister the client.
            socket.on(
                'close',
                function () {
                    if (client) {
                        that.engine.clients.unregister(client);
                    }
                }
            );

            // Add some logger calls, when available...
            if (that.logger) {
                that.logger.debug('[dbgp-proxy#browser-' + socket.id + '] connected');

                socket.on(
                    'disconnect',
                    function () {
                        that.logger.debug('[dbgp-proxy#browser-' + socket.id + '] disconnected');
                    }
                );
            }
        }
    );

    // Some simple, reusable functions for browser-based debugging.
    app.get(
        '/connect.js',
        function (req, res) {
            res.sendfile('connect.js', { root : __dirname + '/docroot' });
        }
    );
};

/* ************************************************************************** */

//
// Retrieve general status information
//
Service.prototype.getStatus = function () {
    var status = {
        registration : {},
        listener : {
            host : this.options.host,
            port : this.options.port
        }
    };

    for (var i in this.clients) {
        var client = this.clients[i];

        status.registration[client.idekey] = {
            mode : client.getMode(),
            target : client.getTargetName(),
            multiple : client.multiple
        };
    }

    return status;
}

//
// Retrieve DBGp-supported Inspector agents
//
Service.prototype.getProtocol = function (frontend, session) {
    if ('inspector' == frontend.name) {
        return {
            Console : new agents.Console(session),
            CSS : new agents.CSS(session),
            Database : new agents.Database(session),
            Debugger : new agents.Debugger(session),
            DOM : new agents.DOM(session),
            DOMStorage : new agents.DOMStorage(session),
            HeapProfiler : new agents.HeapProfiler(session),
            Inspector : new agents.Inspector(session),
            Network : new agents.Network(session),
            Page : new agents.Page(session),
            Profiler : new agents.Profiler(session),
            Runtime : new agents.Runtime(session),
            Timeline : new agents.Timeline(session),
            Worker : new agents.Worker(session)
        };
    } else {
        throw new Error('Unknown frontend: ' + frontend.name);
    }
};

//
// Handle a new browser-based session.
//
Service.prototype.sessionPaired = function (session) {
    // We want to include more children (array keys, object properties, ...)
    // than the typical defaults.
    session.backendSocket.sendMessage(
        'feature_set',
        {
            n : 'max_children',
            v : '2048'
        }
    );

    // We can support multiple sessions concurrently...
    session.backendSocket.sendMessage(
        'feature_set',
        {
            n : 'multiple_sessions',
            v : '1'
        }
    );
};

Service.prototype.getAppIndex = function () {
    // Provide auto-registration and hopefully-useful configuration options.
    return '<div id="dbgp-connect" class="alert">Connecting&hellip;</div>' +
        '<script src="/dbgp/connect.js"></script>' +
        '<script>dbgpConnect("default", window.location.search.match(/(\\?|&)dbgp-multiple=1/) ? true : false, function (message, style) {$("dbgp-connect").set("class", "alert" + (style ? (" alert-" + style) : "")).set("html", message);});</script>' +
        '<dl class="dl-horizontal">' +
            '<dt><a href="http://php.net/">PHP</a> (<a href="http://xdebug.org/">Xdebug</a>)</dt>' +
            '<dd><pre><code>' +
                'xdebug.remote_enable = 1\n' +
                'xdebug.remote_autostart = 1\n' +
                'xdebug.remote_host = ' + this.options.host + '\n' +
                'xdebug.remote_port = ' + this.options.port + '\n' +
            '</code></pre></dd>' +
        '</dl>'
    ;
};

/* ************************************************************************** */

module.exports = Service;
