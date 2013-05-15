module.exports.MANIFEST = {
    name : 'dbgp-proxy',
    enabled : false,
    description : 'Supports multiple DBGp connections via proxy server.',
    options_defaults : {
        host : '127.0.0.1',
        port : '9001'
    },
    options_notes : {
        host : 'host/ip to bind DBGp proxy server',
        port : 'port to bind DBGp proxy server'
    }
};

module.exports.createService = function (tidebug, app, options, logger) {
    var Service = require('./service');

    return new Service(tidebug, app, options, logger);
};
