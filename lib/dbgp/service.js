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
var Client = require('./engine/client/mode/browser');

/* ************************************************************************** */

function Service(dbgp, options, logger) {
    this.tidebug = null;
    this.dbgp = dbgp;
    this.options = options;
    this.logger = logger;
};

Service.prototype.getInspectorAgents = function () {
    return agents;
};

Service.prototype.getInspectorPatches = function () {
    return [];
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
                        that.dbgp,
                        socket
                    );

                    that.dbgp.clients.register(client);

                    cb(data.idekey);
                }
            );

            socket.on(
                'close',
                function () {
                    that.dbgp.clients.unregister(client);
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
        var help = '';

        help += 'Configure the remote debugging engine to connect with ';
        help += '<code>' + that.dbgp.options.host + ':' + that.dbgp.options.port + '</code>. ';

        /*if (that.proxy.delegates.ide) {
            help += 'Use an IDE debugger client with the proxy server at ';
            help += '<code>' + that.proxy.delegates.ide.options.host + ':' + that.proxy.delegates.ide.options.port + '</code>. ';
            help += 'Alternatively, start a browser debugger client above.';
        } else {
            help += 'Start a a browser debugger client above.';
        }*/

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
                    //'xdebug.remote_mode = jit\n' +
                    'xdebug.remote_host = ' + that.dbgp.options.host + '\n' +
                    'xdebug.remote_port = ' + that.dbgp.options.port + '\n' +
                    '; xdebug.idekey <a href="http://xdebug.org/docs/all_settings#idekey">default</a>\n' +
                '</code></pre></dd>' +
            '</dl>'
        );
    });

    http.get('/proxy.html', function (req, res) {
        if (!req.query.idekey) {
            res.send(404, 'The required idekey parameter is missing.');
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
    });

    http.get('/proxy.js', function (req, res) {
        res.sendfile('proxy.js', { root : __dirname + '/docroot' });
    });

    http.get('/inspector/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/docroot/inspector' });
    });
};

Service.prototype.initializeSession = function (session, callback) {
    session.engine.sendMessage(
        'feature_set',
        {
            n : 'max_children',
            v : '2048'
        },
        callback
    );
};

/* ************************************************************************** */

module.exports = Service;
