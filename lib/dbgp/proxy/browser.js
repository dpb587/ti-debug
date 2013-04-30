var uuid = require('node-uuid');

var view = require('../../ti-debug/view');
var Inspector = require('../inspector');
var inspectorView = require('../../inspector/view');
var Socket = require('../../inspector/socket.js');

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
        var sid = uuid.v4();

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
                '<div class="span3" style="text-align:right;"><h2>dbgp</h2></div>' +
                '<div id="dbgp-status" class="span9" data-idekey="' + req.query.idekey + '">' +
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
        res.sendfile('proxy.js', { root : __dirname + '/../docroot' });
    });

    http.get('/inspector/inspector.html', function (req, res) {
        res.send(
            inspectorView.standard(
                '    <link rel="stylesheet" type="text/css" href="./patch/inspector.css">' +
                '    <script type="text/javascript" src="/ti-debug/socket.io/socket.io.js"></script>' +
                '    <script type="text/javascript" src="./patch/inspector.js"></script>' +
                '    <script type="text/javascript" src="./patch/InspectorBackend.js"></script>' +
                '    <script type="text/javascript" src="./patch/InspectorFrontendHost.js"></script>' +
                '    <script type="text/javascript" src="./patch/Settings.js"></script>'
            )
        );
    });

    http.get('/inspector/patch/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/../docroot/inspector/patch' });
    });

    http.get('/inspector/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/../../inspector/docroot/webkit' });
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
    if (!this.sessions[data.sid]) {
        this.logger.warn('Session ' + data.sid + ' does not exist.');

        return;
    } else if (this.sessions[data.sid].attached) {
        this.logger.warn('Session ' + data.sid + ' is already attached.');

        return;
    }

    this.sessions[data.sid].attached = true;

    socket = new Socket(socket, this.logger);
    socket.setInspector(Inspector.create(this.sessions[data.sid], socket));
    
    this.sessions[data.sid].on(
        'close',
        function () {
            socket.send(
                'Console.messageAdded',
                {
                    message : {
                        source : 'console-api',
                        level : 'warning',
                        text : 'Session has been closed.'
                    }
                }
            );
        }
    );

    cb(this.sessions[data.sid].getInspectorSchema());
};

Browser.prototype.start = function () {
};

/* ************************************************************************** */

module.exports = Browser;
