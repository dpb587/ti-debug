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

function CommonResolver(tidebug, app, options, logger) {
    this.clients = {};

    this.tidebug = tidebug;
    this.logger = logger;
    this.options = options;

    this.client = new Client(this, this.getClientOptions(), logger);

    this.registerApp(app);
}

CommonResolver.prototype.getName = function () {
    return 'dbgp';
};

CommonResolver.prototype.getClientOptions = function () {
    return this.options;
};

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

CommonResolver.prototype.lookupClient = function (idekey) {
    return idekey in this.clients ? this.clients[idekey] : null;
};

CommonResolver.prototype.getClients = function () {
    return this.clients;
};

CommonResolver.prototype.start = function () {
    this.client.start();

    return this;
}

CommonResolver.prototype.stop = function () {
    this.client.stop();

    for (var i in this.clients) {
        this.unregisterClient(this.clients[i]);
    }

    return this;
};


CommonResolver.prototype.registerApp = function (app) {
    var that = this;

    app.io.on(
        'connection',
        function (socket) {
            var client;

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

            socket.on(
                'close',
                function () {
                    that.engine.clients.unregister(client);
                }
            );

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

    app.get('/connect.js', function (req, res) {
        res.sendfile('connect.js', { root : __dirname + '/docroot' });
    });
};

/* ************************************************************************** */

CommonResolver.prototype.getInspectorAgents = function () {
    return agents;
};

CommonResolver.prototype.sessionAttached = function (session, callback) {
    session.engine.sendMessage(
        'feature_set',
        {
            n : 'max_children',
            v : '2048'
        },
        callback
    );

    session.engine.sendMessage(
        'feature_set',
        {
            n : 'multiple_sessions',
            v : '1'
        },
        callback
    );
};

CommonResolver.prototype.sessionDetached = function (session) {
    session.engine.end();
};

/* ************************************************************************** */

module.exports = CommonResolver;
