var fs = require('fs');
var packagejson = JSON.parse(fs.readFileSync(__dirname + '/../../package.json'));

module.exports.standard = function (content) {
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
                '<header style="background-color:#F5F5F5;border-bottom:#E5E5E5 solid 1px;color:#777777;padding:9px 10px 10px;">' +
                    '<div class="container">' +
                        '<div class="row">' +
                            '<div class="span12">' +
                                '<strong>ti-debug</strong> ' +
                                    (packagejson.version.match(/^([^\-]+)-(.*)?$/) ? packagejson.version.replace(/^([^\-]+-)(.*)?$/, '$1<strong>$2</strong>') : packagejson.version) +
                                    ' <strong>&middot;</strong> ' +
                                    'help improve by reporting <a href="' + packagejson.bugs.url + '/issues">issues</a>' +
                                    '<br />' +
                                'created by <a href="' + packagejson.author.url + '">' + packagejson.author.name.toLowerCase() + '</a> ' +
                                    'and open-sourced at <a href="' + packagejson.homepage + '">' + packagejson.homepage.replace(/^(https?:\/\/)(.*)(\/?)$/, '$2') + '</a>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</header>' +
                '<div class="container" style="margin-top:12px;">' +
                    '<section>' +
                        content +
                    '</section>' +
                '</div>' +
            '</body>' +
        '</html>'
    ;
};
