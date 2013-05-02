var EngineService = require('./engine/service');
var Client = require('./engine/client/mode/browser');
var agents = {
    Console : require('./agent/console'),
    CSS : require('./agent/css'),
    Database : require('./agent/database'),
    Debugger : require('./agent/debugger'),
    DOM : require('./agent/dom'),
    DOMStorage : require('./agent/domstorage'),
    HeapProfiler : require('./agent/heap_profiler'),
    Inspector : require('./agent/inspector'),
    Network : require('./agent/network'),
    Page : require('./agent/page'),
    Profiler : require('./agent/profiler'),
    Runtime : require('./agent/runtime'),
    Timeline : require('./agent/timeline'),
    Worker : require('./agent/worker')
};
var view = require('../ti-debug/view');

/* ************************************************************************** */

function Service(options, logger) {
    this.tidebug = null;

    this.options = options;
    this.logger = logger;

    this.engine = null;
};

Service.prototype.getName = function () {
    return 'dbgp';
};

Service.prototype.getInspectorAgents = function () {
    return agents;
};

Service.prototype.register = function (tidebug, http) {
    var that = this;

    that.tidebug = tidebug;

    http.io.on(
        'connection',
        function (socket) {
            var client;

            socket.on(
                'proxyinit',
                function (data, cb) {
                    client = new Client(
                        data.idekey,
                        ('1' == data.m ? true : false),
                        that.tidebug,
                        that.engine,
                        socket
                    );

                    that.engine.clients.register(client);

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

    http.get('/index.html', function (req, res) {
        res.set('content-type', 'text/html');

        res.send(
            '<form class="form-inline well" action="/dbgp/proxy.html" method="GET">' +
                '<label class="control-label" for="dbgp-proxy-idekey">IDE Key</label> ' +
                '<input id="dbgp-proxy-idekey" name="idekey" type="text" /> ' +
                '<label class="checkbox"><input checked="checked" name="m" type="checkbox" value="1" /> Multiple Sessions</label> ' +
                '<button type="submit" class="btn btn-primary">Start Client &rarr;</button>' +
            '</form>' +
            '<p>The <a href="http://xdebug.org/docs-dbgp.php#connection-initialization">IDE Key</a> must match between ' +
                'the debugger engine and debugger client. Here are some hints:</p>' +
            '<dl class="dl-horizontal">' +
                '<dt><a href="http://php.net/">PHP</a> (<a href="http://xdebug.org/">Xdebug</a>)</dt>' +
                '<dd><pre><code>' +
                    'xdebug.remote_enable = 1\n' +
                    'xdebug.remote_autostart = 1\n' +
                    'xdebug.remote_host = ' + that.options.host + '\n' +
                    'xdebug.remote_port = ' + that.options.port + '\n' +
                    '; xdebug.idekey <a href="http://xdebug.org/docs/all_settings#idekey">default</a>\n' +
                '</code></pre></dd>' +
            '</dl>'
        );

        res.end();
    });

    http.get('/proxy.html', function (req, res) {
        if (!req.query.idekey) {
            res.send(404, 'The required idekey parameter is missing.');
            res.end();

            return;
        }

        res.send(view.standard(
            '<script type="text/javascript" src="./proxy.js"></script>' +
            '<div class="row">' +
                '<div class="span3" style="text-align:right;"><h2>dbgp</h2></div>' +
                '<div id="dbgp-status" class="span9" data-idekey="' + req.query.idekey + '" data-m="' + (req.query.m || '0') + '">' +
                    '<div class="alert">Connecting&hellip;</div>' +
                '</div>' +
            '</div>' +
            '<div class="row">' +
                '<div class="span3">&nbsp;</div>' +
                '<div id="dbgp-log" class="span9"><table class="table"><thead><tr><th colspan="2">Event Log</th></tr></thead><tbody></tbody></table></div>' +
            '</div>'
        ));

        res.end();
    });

    http.get('/proxy.js', function (req, res) {
        res.sendfile('proxy.js', { root : __dirname + '/docroot' });
    });

    http.get('/status.json', function (req, res) {
        var clients = [];

        for (var i in that.engine.clients.map) {
            var client = that.engine.clients.map[i];

            clients.push(
                {
                    mode : client.getMode(),
                    name : client.getName(),
                    idekey : client.idekey,
                    multiple : client.multiple
                }
            );
        }

        res.send(
            {
                clients : clients
            }
        );

        res.end();
    });

    http.get('/inspector/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/docroot/inspector' });
    });
};

Service.prototype.sessionAttached = function (session, callback) {
    session.engine.sendMessage(
        'feature_set',
        {
            n : 'max_children',
            v : '2048'
        },
        callback
    );
};

Service.prototype.sessionDetached = function (session) {
    session.engine.end();
};

Service.prototype.start = function () {
    if (!this.engine) {
        this.engine = new EngineService(this.options, this.logger);
    }

    this.engine.start();
};

Service.prototype.stop = function () {
    if (!this.engine) {
        return;
    }

    this.engine.stop();
};

/* ************************************************************************** */

module.exports = Service;
