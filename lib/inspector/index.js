module.exports.MANIFEST = {
    name : 'inspector',
    enabled : true,
    description : 'Frontend implementation of the WebKit Inspector Developer Tools.',
    options_defaults : {},
    options_notes : {},
    version : '149292',
    upstream : 'http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/inspector/'
};

module.exports.createService = function (tidebug, context, options, logger) {
    var Service = require('./service');

    return new Service(tidebug, context, options, logger);
};
