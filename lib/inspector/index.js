var Service = require('./frontend/service');

/* ************************************************************************** */

module.exports.MANIFEST = {
    revision : '149292',
    upstream : 'http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/inspector/'
};

module.exports.getName = function () {
    return 'inspector';
};

module.exports.createFrontend = function (tidebug, context, options, logger) {
    return new Service(tidebug, context, options, logger);
};
