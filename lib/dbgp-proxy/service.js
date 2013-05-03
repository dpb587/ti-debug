var EngineService = require('./engine/service');

/* ************************************************************************** */

function Service(tidebug, app, options, logger) {
    this.tidebug = tidebug;
    this.options = options;
    this.logger = logger;

    this.engine = null;

    this.registerApp(app);
};

Service.prototype.getName = function () {
    return 'dbgp-proxy';
};

Service.prototype.registerApp = function (app) {
    var that = this;

    app.get(
        '/index.html',
        function (req, res) {
            res.set('content-type', 'text/html');
            res.send('<p>Configure an IDE supporting DBGp proxies to use <code>' + that.options.host + ':' + that.options.port + '</code>.</p>');

            res.end();
        }
    );
};

Service.prototype.start = function () {
    if (!this.engine) {
        this.engine = new EngineService(this.options.dbgp, this.options, this.logger);
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
