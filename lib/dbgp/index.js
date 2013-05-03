var ProxyResolver = require('./engine/resolver/proxy/service');
var DirectResolver = require('./engine/resolver/direct/service');

module.exports = {
    create : function (tidebug, app, options, logger) {
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
