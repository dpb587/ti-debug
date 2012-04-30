var express = require('express'),
    io = require('socket.io'),
    uuid = require('node-uuid'),
    Session = require('./session'),
    InspectorSession = require('../inspector/session'),
    InspectorFrontendSocket = require('../inspector/frontend-socket');

function Manager() {
    var that = this;

    this.sessions = {};

    this.web = express.createServer();
    this.io = io.listen(this.web, { 'log level' : 1 });
    this.ioIndex = this.io.of('/index.io');
    this.ioInspector = this.io.of('/inspector.io');

    this.web.get('/', function (req, res) {
        res.redirect('/index.html');
    });

    this.web.get('/index.html', function (req, res) {
        res.sendfile(__dirname + '/web/index.html');
    });

    this.web.get('/index.json', function (req, res) {
        res.json(that.exportSessions());
    });

    this.web.get('/inspector/', function (req, res) {
        that.attachRequest(res, req.query.sid);
    });

    this.web.get('/inspector/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/web/inspector' });
    });

    this.web.get('/socket.io/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/web/socket.io' });
    });

    this.ioInspector.on('connection', function (socket) {
        socket.on('attach', that.attachSocket.bind(that, socket));
    });
}

Manager.prototype.exportSessions = function () {
    var result = [];

    for (var k in this.sessions) {
        result.push(this.getSessionMetadata(this.sessions[k]));
    }

    return result;
};

Manager.prototype.getSessionMetadata = function (session) {
    var data = session.backend.getMetadata();
    data.attached = session.frontend ? session.frontend.getMetadata() : false;
    data.id = session.id;
    data.status = this.frontend ? 'attached' : 'detached';
    data.frontendUrl = '/inspector/?sid=' + session.id;

    return data;
}

Manager.prototype.create = function (backend) {
    var that = this;

    var session = new Session(uuid.v4(), backend, null);

    that.sessions[session.id] = session;

    that.ioIndex.emit('event', { method : 'Session.created', params : { session : that.getSessionMetadata(session) } });

    function pushupdate () {
        that.ioIndex.emit('event', { method : 'Session.updated', params : { session : that.getSessionMetadata(session) } });
    }

    session.on('close', pushupdate);
    session.on('update', pushupdate);
};

Manager.prototype.attachRequest = function (res, id) {
    if (!this.sessions[id]) {
        return res.send('Session is not available.', 404);
    } else if (this.sessions[id].frontend) {
        return res.send('Cannot attach to session (already has a frontend).', 403);
    }

    res.sendfile(__dirname + '/web/inspector.html');
};

Manager.prototype.attachSocket = function (socket, id, callback) {
    if (!this.sessions[id]) {
        return callback(false);
    } else if (this.sessions[id].frontend) {
        return callback(false);
    }

    this.sessions[id].frontend = new InspectorFrontendSocket(socket);
    InspectorSession.prototype.install.call(this.sessions[id], callback);

    this.sessions[id].emit('update');
}

Manager.prototype.register = function (scope, server) {
    var that = this;
    var server = ('function' == typeof server) ? server(scope) : server;

    server.on('handshake', function (backend) {
        that.create(backend);
    });
};

Manager.prototype.listen = function () {
    return this.web.listen.apply(this.web, arguments);
};

module.exports = Manager;
