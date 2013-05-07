var Service = require('./service');

module.exports = {
    MANIFEST : {
        version : '0.1.0-dev',
        upstream : 'https://github.com/dpb587/ti-debug/'
    },

    create : function (options, logger) {
        return new Service(options, logger);
    }
};
