module.exports.standard = function (content) {
    // @todo why doesn't this work outside the function...
    var manifest = require('./index').MANIFEST;

    return '' +
        '<!DOCTYPE html>' +
        '<html>' +
            '<head>' +
                '<title>ti-debug</title>' +
                '<meta http-equiv="content-type" content="text/html; charset=utf-8">' +
                '<link href="http://twitter.github.com/bootstrap/assets/css/bootstrap.css" rel="stylesheet">' +
                '<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/mootools/1.4.5/mootools.js"></script>' +
                '<script type="text/javascript" src="/ti-debug/socket.io/socket.io.js"></script>' +
            '</head>' +
            '<body>' +
                '<div class="container">' +
                    '<header class="page-header">' +
                        '<div class="row">' +
                            '<div class="span3" style="color:#808080;text-align:right;">' +
                                '<h1 style="font-weight:normal;">ti-debug</h1>' +
                            '</div>' +
                            '<div class="span9" style="color:#999999;">' +
                                'v' + manifest.version + ' <strong>&middot;</strong> ' +
                                    'help improve by sending <a href="' + manifest.upstream + '/pulls">pull requests</a> ' +
                                    'or reporting <a href="' + manifest.upstream + '/issues">issues</a>' +
                                    '<br />' +
                                'created by <a href="http://dpb587.me">danny berger</a> ' +
                                    'and open-sourced at <a href="' + manifest.upstream + '">' + manifest.upstream.replace(/(https?:\/\/)(.*)(\/)$/, '$2') + '</a>' +
                            '</div>' +
                        '</div>' +
                    '</header>' +
                    '<section>' +
                        content +
                    '</section' +
                '</div>' +
            '</body>' +
        '</html>'
    ;
};
