var view = require('../../ti-debug/view');
var uuid = require('node-uuid');
var inspector = require('../../inspector/view');
var InspectorConsoleAgent = require('../inspector/console.js'),
    InspectorCSSAgent = require('../inspector/css.js'),
    InspectorDatabaseAgent = require('../inspector/database.js'),
    InspectorDebuggerAgent = require('../inspector/debugger.js'),
    InspectorDOMAgent = require('../inspector/dom.js'),
    InspectorDOMStorageAgent = require('../inspector/domstorage.js'),
    InspectorInspectorAgent = require('../inspector/inspector.js'),
    InspectorNetworkAgent = require('../inspector/network.js'),
    InspectorPageAgent = require('../inspector/page.js'),
    InspectorProfilerAgent = require('../inspector/profiler.js'),
    InspectorRuntimeAgent = require('../inspector/runtime.js'),
    InspectorTimelineAgent = require('../inspector/timeline.js');
var FrontendSocket = require('../../inspector/frontend-socket.js');

/* ************************************************************************** */

function Browser(http, logger) {
    this.http = http;
    this.logger = logger;

    this.clients = {};
    this.sessions = {};

    this.registerWebService(http);
}

Browser.prototype.__proto__ = require('events').EventEmitter.prototype;

Browser.prototype.initiate = function (idekey, socket) {
    if (this.clients[idekey]) {
        var sid = '1234567890';uuid.v4();

        this.clients[idekey].emit(
            'init',
            {
                sid : sid,
                remote : socket.raw.remoteAddress + ':' + socket.raw.remotePort,
                header : socket.header
            }
        );

        this.sessions[sid] = socket;

        return true;
    }
};

Browser.prototype.registerWebService = function (http, io) {
    var that = this;

    http.get('/proxy.html', function (req, res) {
        if (!req.query.idekey) {
            throw new Error('The idekey parameter is missing.');
        }

        res.send(view.standard(
            '<script type="text/javascript" src="./proxy.js"></script>' +
            '<div class="row">' +
                '<div class="span2" style="text-align:right;"><h2>dbgp</h2></div>' +
                '<div id="dbgp-status" class="span10" data-idekey="' + req.query.idekey + '">' +
                    '<div class="alert">Connecting&hellip;</div>' +
                '</div>' +
            '</div>' +
            '<div class="row">' +
                '<div class="span2">&nbsp;</div>' +
                '<div id="dbgp-log" class="span10"><ul class="unstyled"></ul></div>' +
            '</div>'
        ));
    });

    http.get('/proxy.js', function (req, res) {
        res.sendfile('proxy.js', { root : __dirname + '/../http' });
    });

    http.get('/inspector/inspector.html', function (req, res) {
        res.send(
            inspector.standard(
                '    <link rel="stylesheet" type="text/css" href="./patch/inspector.css">' +
                '    <script type="text/javascript" src="/ti-debug/socket.io/socket.io.js"></script>' +
                '    <script type="text/javascript" src="./patch/inspector.js"></script>' +
                '    <script type="text/javascript" src="./patch/InspectorBackend.js"></script>' +
                '    <!--<script type="text/javascript" src="./patch/SourcePHPTokenizer.js"></script>-->' +
                '    <script type="text/javascript" src="./patch/InspectorFrontendHost.js"></script>' +
                '    <script type="text/javascript" src="./patch/Settings.js"></script>'
            )
        );
    });

    http.get('/inspector/patch/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/../http/inspector' });
    });

    http.get('/inspector/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/../../inspector/http/webkit' });
    });

    http.io.on(
        'connection',
        function (socket) {
            that.acceptConnection(socket);
        }
    );
};

Browser.prototype.acceptConnection = function (socket) {
    socket.on('proxyinit', this.recvProxyinit.bind(this, socket));
    socket.on('attach', this.recvAttach.bind(this, socket));
};

Browser.prototype.recvProxyinit = function (socket, data, cb) {
    if (this.clients[data.idekey]) {
        this.clients[data.idekey].disconnect();
    }

    this.clients[data.idekey] = socket;
    cb(data.idekey);
};

Browser.prototype.recvAttach = function (socket, data, cb) {
    var that = this;

    if (!that.sessions[data.sid]) {
        console.log('Session ' + data.sid + ' does not exist.');
        return;
    } else if (that.sessions[data.sid].inspector) {
        console.log('Session ' + data.sid + ' is already attached.');
        return;
    }

    socket = new FrontendSocket(socket);

    var inspector = socket.inspector = {
        Console : new InspectorConsoleAgent(that.sessions[data.sid], socket),
        CSS : new InspectorCSSAgent(that.sessions[data.sid], socket),
        Database : new InspectorDatabaseAgent(that.sessions[data.sid], socket),
        Debugger : new InspectorDebuggerAgent(that.sessions[data.sid], socket),
        DOM : new InspectorDOMAgent(that.sessions[data.sid], socket),
        DOMStorage : new InspectorDOMStorageAgent(that.sessions[data.sid], socket),
        Inspector : new InspectorInspectorAgent(that.sessions[data.sid], socket),
        Network : new InspectorNetworkAgent(that.sessions[data.sid], socket),
        Page : new InspectorPageAgent(that.sessions[data.sid], socket),
        Profiler : new InspectorProfilerAgent(that.sessions[data.sid], socket),
        Runtime : new InspectorRuntimeAgent(that.sessions[data.sid], socket),
        Timeline : new InspectorTimelineAgent(that.sessions[data.sid], socket)
    };

    socket.on('event', function (message) {
        var messageObject = JSON.parse(message);
    
        var method = messageObject.method.split(".");
        var domainName = method[0];
        var functionName = method[1];
    
        if (!(domainName in inspector)) {
            console.error("Protocol Error: the message is for non-existing domain '" + domainName + "'");
            return;
        }
        var dispatcher = inspector[domainName];
        if (!(functionName in dispatcher)) {
            console.error("Protocol Error: Attempted to dispatch an unimplemented method '" + messageObject.method + "'");
            return;
        }


        dispatcher[functionName].call(
            dispatcher,
            messageObject.params,
            function (result) {
                socket.emit('event', {
                    id : messageObject.id,
                    result : result
                });
            }
        );
    });

    cb(that.sessions[data.sid].getInspectorSchema());
};

Browser.prototype.start = function () {
};

/* ************************************************************************** */

module.exports = Browser;
