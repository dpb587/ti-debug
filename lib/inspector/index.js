var Service = require('./engine/service');

module.exports = {
    create : function (tidebug, app, options, logger) {
        return new Service(tidebug, app, options, logger);
    }
};
