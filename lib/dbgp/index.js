var ProxyResolver = require('./backend/resolver/proxy/service');
var DirectResolver = require('./backend/resolver/direct/service');

module.exports = {
    getName : function () {
        return 'dbgp';
    },

    createBackend : function (tidebug, app, options, logger) {
        if (options.proxy) {
            var rewrite = options.proxy;
            rewrite.dbgp = options;
            delete rewrite.dbgp.proxy;

            return new ProxyResolver(tidebug, app, rewrite, logger);
        } else {
            return new DirectResolver(tidebug, app, options, logger);
        }
    }
};
