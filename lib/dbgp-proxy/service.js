var EngineService = require('./engine/service');

/* ************************************************************************** */

function Service(options, logger) {
    this.tidebug = null;

    this.engine = null;
    this.options = options;
    this.logger = logger;
};

Service.prototype.getName = function () {
    return 'dbgp-proxy';
};

Service.prototype.register = function (tidebug, http) {
    var that = this;

    that.tidebug = tidebug;

    http.get(
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
