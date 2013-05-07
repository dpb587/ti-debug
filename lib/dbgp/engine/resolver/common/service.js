var Client = require('../../client/service');
var InspectorApi = require('../../client/api/inspector');
var agents = {
    Console : require('../../../inspector/console'),
    CSS : require('../../../inspector/css'),
    Database : require('../../../inspector/database'),
    Debugger : require('../../../inspector/debugger'),
    DOM : require('../../../inspector/dom'),
    DOMStorage : require('../../../inspector/domstorage'),
    HeapProfiler : require('../../../inspector/heap_profiler'),
    Inspector : require('../../../inspector/inspector'),
    Network : require('../../../inspector/network'),
    Page : require('../../../inspector/page'),
    Profiler : require('../../../inspector/profiler'),
    Runtime : require('../../../inspector/runtime'),
    Timeline : require('../../../inspector/timeline'),
    Worker : require('../../../inspector/worker')
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
                    client = new InspectorApi(
                        data.idekey,
                        ('1' == data.m ? true : false),
                        that,
                        socket
                    );

                    that.registerClient(client);

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

    // Provide a simple status
    app.get('/status.json', function (req, res) {
        var status = {
            clients : []
        };

        var clients = that.getClients();

        for (var i in clients) {
            var client = clients[i];

            status.clients.push(
                {
                    mode : client.getMode(),
                    name : client.getName(),
                    idekey : client.idekey,
                    multiple : client.multiple
                }
            );
        }

        res.send(status);

        res.end();
    });

    // Some simple, reusable functions for browser-based debugging.
    app.get('/connect.js', function (req, res) {
        res.sendfile('connect.js', { root : __dirname + '/docroot' });
    });
};

/* ************************************************************************** */

//
// Retrieve DBGp-supported Inspector agents
//
CommonResolver.prototype.getInspectorAgents = function () {
    return agents;
};

//
// Handle a new browser-based session.
//
CommonResolver.prototype.sessionAttached = function (session, callback) {
    // @todo double-calling callback!

    // We want to include more children (array keys, object properties, ...)
    // than the typical defaults.
    session.engine.sendMessage(
        'feature_set',
        {
            n : 'max_children',
            v : '2048'
        },
        callback
    );

    // We can support multiple sessions concurrently...
    session.engine.sendMessage(
        'feature_set',
        {
            n : 'multiple_sessions',
            v : '1'
        },
        callback
    );
};

//
// Handle a session being terminated.
//
CommonResolver.prototype.sessionDetached = function (session) {
    session.engine.end();
};

/* ************************************************************************** */

module.exports = CommonResolver;
