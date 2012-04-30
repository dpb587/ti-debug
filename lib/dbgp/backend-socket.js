var xml2json = require('node-xml2json');
var InspectorConsoleAgent = require('./inspector/console.js'),
    InspectorCSSAgent = require('./inspector/css.js'),
    InspectorDatabaseAgent = require('./inspector/database.js'),
    InspectorDebuggerAgent = require('./inspector/debugger.js'),
    InspectorDOMAgent = require('./inspector/dom.js'),
    InspectorDOMStorageAgent = require('./inspector/domstorage.js'),
    InspectorInspectorAgent = require('./inspector/inspector.js'),
    InspectorNetworkAgent = require('./inspector/network.js'),
    InspectorPageAgent = require('./inspector/page.js'),
    InspectorProfilerAgent = require('./inspector/profiler.js'),
    InspectorRuntimeAgent = require('./inspector/runtime.js'),
    InspectorTimelineAgent = require('./inspector/timeline.js');
var BackendInspectorSchema = require('fs').readFileSync(__dirname + '/inspector/schema.json', 'utf8');

function BackendSocket(socket) {
    var that = this;

    that.status = 'up';

    that.startdate = new Date();
    that.sendCount = 0;
    that.sendCallback = {};
    that.recvData_ = '';

    that.raw = socket;
    that.raw.setEncoding('utf8');
    that.raw.on('data', that.recvData.bind(that));
    that.raw.on('close', that.close.bind(that));
    that.once('payload', function (payload) {
        that.header = payload;
    });

    that.remoteEndpoint = that.raw.remoteAddress + ':' + that.raw.remotePort;
}

BackendSocket.prototype.__proto__ = require('events').EventEmitter.prototype;

BackendSocket.prototype.getMetadata = function () {
    return {
        backend : {
            status : this.status,
            protocol : {
                name : 'dbgp',
                version : this.header.init.protocol_version
            },
            language : {
                name : this.header.init.language,
                version : null
            },
            engine : {
                name : this.header.init.engine['$t'],
                version: this.header.init.engine.version
            }
        },
        startdate : this.startdate.getFullYear()
            + '-' + (this.startdate.getMonth() < 9 ? '0' : '') + (this.startdate.getMonth() + 1)
            + '-' + (this.startdate.getDate() < 10 ? '0' : '') + this.startdate.getDate()
            + ' ' + (this.startdate.getHours() < 10 ? '0' : '') + this.startdate.getHours()
            + ':' + (this.startdate.getMinutes() < 10 ? '0' : '') + this.startdate.getMinutes()
            + ':' + (this.startdate.getSeconds() < 10 ? '0' : '') + this.startdate.getSeconds(),
        title : this.header.init.idekey + ' (' + this.remoteEndpoint + ')',
        url : this.header.init.fileuri
    };
};

BackendSocket.prototype.getInspector = function (session) {
    return {
        Console : new InspectorConsoleAgent(session),
        CSS : new InspectorCSSAgent(session),
        Database : new InspectorDatabaseAgent(session),
        Debugger : new InspectorDebuggerAgent(session),
        DOM : new InspectorDOMAgent(session),
        DOMStorage : new InspectorDOMStorageAgent(session),
        Inspector : new InspectorInspectorAgent(session),
        Network : new InspectorNetworkAgent(session),
        Page : new InspectorPageAgent(session),
        Profiler : new InspectorProfilerAgent(session),
        Runtime : new InspectorRuntimeAgent(session),
        Timeline : new InspectorTimelineAgent(session)
    }
};

// @todo lazy
BackendSocket.prototype.getInspectorSchema = function () {
    return BackendInspectorSchema;
};

BackendSocket.prototype.recvMessage = function (str) {
    // doesn't like the xml header
    str = str.slice(45, str.length);
    obj = xml2json.toJson(str, { object : true });
//console.log('>' + str);
    if (obj.response && obj.response.transaction_id && this.sendCallback[obj.response.transaction_id]) {
        this.sendCallback[obj.response.transaction_id](obj.response);
        delete this.sendCallback[obj.response.transaction_id];
    } else {
        this.emit('payload', obj);
    }
};

BackendSocket.prototype.recvData = function (data) {
    if (data) {
        this.recvData_ += data;
    }

    var nil = false;

    for (var i = 0; i < 16; i ++) {
        if (this.recvData_.charCodeAt(i) == 0) {
            nil = i;
            break;
        }
    }

    if (nil === false) {
        // waiting for more data
        return;
    }

    size = parseInt(this.recvData_.slice(0, nil));


    if (this.recvData_.length >= (size + nil)) {
        var message = this.recvData_.slice(nil, nil + 1 + size);
        this.recvData_ = this.recvData_.slice(nil + 1 + size + 1);

        this.recvMessage(message);

        if (this.recvData_.length) {
            this.recvData();
        }
    }
};

BackendSocket.prototype.send = function () {
    if (this.status != 'up') {
        return;
    }

    var vargs = [].slice.apply(arguments);
    var command = vargs.shift();
    var opts = typeof vargs[0] == 'object' ? vargs.shift() : {};
    var data = typeof vargs[0] == 'string' ? vargs.shift() : null;
    var callback = vargs.shift();

    this.sendCount += 1;

    var write = command + ' -i ' + this.sendCount;

    for (var k in opts) {
        write += ' -' + k + ' ' + JSON.stringify(opts[k]);
    }

    if (data) {
        write += ' -- ' + new Buffer(data).toString('base64');
    }
//console.log('<' + write);
    write += '\0';

    this.raw.write(write);

    this.sendCallback[this.sendCount] = callback;
};

BackendSocket.prototype.close = function () {
    if (this.status != 'up') {
        return;
    }

    this.status = 'down';

    this.raw.end();

    this.emit('close');
}

module.exports = BackendSocket;
