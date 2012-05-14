var version = require('./version');

module.exports = {
    standard : function (content) {
        return '' +
            '<!DOCTYPE html>' +
            '<html>' +
                '<head>' +
                    '<title>ti-debug</title>' +
                    '<meta http-equiv="content-type" content="text/html; charset=utf-8">' +
                    '<link href="http://twitter.github.com/bootstrap/assets/css/bootstrap.css" rel="stylesheet">' +
                    '<script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/mootools/1.4.5/mootools.js"></script>' +
                    '<script type="text/javascript" src="/ti-debug/socket.io/socket.io.js"></script>' +
                    '<script type="text/javascript" src="/ti-debug/scripts.js"></script>' +
                '</head>' +
                '<body>' +
                    '<div class="container">' +
                        '<header class="page-header">' +
                            '<div class="row">' +
                                '<div class="span2" style="color:#747474;text-align:right;">' +
                                    '<h1>ti-debug</h1>' +
                                '</div>' +
                                '<div class="span10" style="color:#999999;">' +
                                    'v' + version + ' <strong>&middot;</strong> ' +
                                        'help improve by sending <a href="https://github.com/dpb587/ti-debug/pulls">pull requests</a> ' +
                                        'or reporting <a href="https://github.com/dpb587/ti-debug/issues">issues</a>' +
                                        '<br />' +
                                    'created by <a href="https://github.com/dpb587">danny berger</a> ' +
                                        'and open-sourced at <a href="https://github.com/dpb587/ti-debug">github.com/dpb587/ti-debug</a>' +
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
    }
};
