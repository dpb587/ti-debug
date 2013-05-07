var Client = require('../../client/service');
var TiDebugClient = require('../../client/api/tidebug');
var agents = {
    Console : require('../../../protocol/inspector/agent/console'),
    CSS : require('../../../protocol/inspector/agent/css'),
    Database : require('../../../protocol/inspector/agent/database'),
    Debugger : require('../../../protocol/inspector/agent/debugger'),
    DOM : require('../../../protocol/inspector/agent/dom'),
    DOMStorage : require('../../../protocol/inspector/agent/domstorage'),
    HeapProfiler : require('../../../protocol/inspector/agent/heap_profiler'),
    Inspector : require('../../../protocol/inspector/agent/inspector'),
    Network : require('../../../protocol/inspector/agent/network'),
    Page : require('../../../protocol/inspector/agent/page'),
    Profiler : require('../../../protocol/inspector/agent/profiler'),
    Runtime : require('../../../protocol/inspector/agent/runtime'),
    Timeline : require('../../../protocol/inspector/agent/timeline'),
    Worker : require('../../../protocol/inspector/agent/worker')
};

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
function CommonResolver(tidebug, app, options, logger) {
    this.clients = {};

    this.tidebug = tidebug;
    this.logger = logger;
    this.options = options;

    this.client = new Client(this, this.getClientOptions(), logger);

    this.registerApp(app);
}

//
// Retrieve the common name of the debugging engine.
//
CommonResolver.prototype.getName = function () {
    return 'dbgp';
};

//
// Take care of registering a DBGp client.
//
// Whenever a client (whether direct or proxy) connects it needs to be
// registered so it can re-establish a debug session connection.
//
CommonResolver.prototype.registerClient = function (client) {
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
CommonResolver.prototype.unregisterClient = function (client) {
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

//
// Retrieve the list of active client registrations.
//
CommonResolver.prototype.getClients = function () {
    return this.clients;
};

//
// Start the DBGp client.
//
CommonResolver.prototype.start = function () {
    this.client.start();

    return this;
}

//
// Stop the DBGp client and unregister all clients.
//
CommonResolver.prototype.stop = function () {
    this.client.stop();

    for (var i in this.clients) {
        this.unregisterClient(this.clients[i]);
    }

    return this;
};

//
// Register routes for the web server.
//
// This includes logic for accepting web-based sessions.
//
CommonResolver.prototype.registerApp = function (app) {
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
CommonResolver.prototype.getStatus = function () {
    var status = {
        resolver : {},
        client : {
            host : this.client.options.host,
            port : this.client.options.port
        }
    };

    for (var i in this.clients) {
        var client = this.clients[i];

        status.resolver[client.idekey] = {
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
CommonResolver.prototype.getProtocol = function (frontend, session) {
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
        throw new Error();
    }
};

//
// Handle a new browser-based session.
//
CommonResolver.prototype.sessionPaired = function (session) {
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

/* ************************************************************************** */

module.exports = CommonResolver;
