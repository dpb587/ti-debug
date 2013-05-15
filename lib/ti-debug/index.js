module.exports.MANIFEST = {
    name : 'ti-debug',
    enabled : true,
    description : 'Internal service manager.',
    options_defaults : {
        host : '127.0.0.1',
        port : '9222'
    },
    options_notes : {
        host : 'host/ip to bind ti-debug server',
        port : 'port to bind ti-debug server'
    },
    version : '0.1.0-dev',
    upstream : 'https://github.com/dpb587/ti-debug'
};

module.exports.create = function (options, logger) {
    var Service = require('./service');

    return new Service(options, logger);
};
