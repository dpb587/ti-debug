var Service = require('./service');

module.exports.MANIFEST = {
    name : 'dbgp',
    enabled : true,
    description : 'Backend implementation of the DBGp Protocol <http://xdebug.org/docs-dbgp.php>',
    options_defaults : {
        host : '127.0.0.1',
        port : '9000'
    },
    options_notes : {
        host : 'host/ip to bind DBGp client',
        port : 'port to bind DBGp client'
    }
};

module.exports.createService = function (tidebug, app, options, logger) {
    return new Service(tidebug, app, options, logger);
};
