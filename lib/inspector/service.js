var version = require('./version');

/* ************************************************************************** */

function Service() {
}

Service.prototype.start = function () {
};

Service.prototype.registerWebService = function (http) {
    var that = this;

    http.get('/index.html', function (req, res) {
        res.send(
            '<p>' +
                'The browser debug client is powered by <a href="http://svn.webkit.org/repository/webkit/trunk/Source/WebCore/inspector/front-end/?p=' + version +'">r' + version + '</a> of the ' +
                '<a href="http://www.webkit.org/">WebKit</a> Inspector using the Remote Debugging Protocol.' +
            '</p>'
        );
    });

    http.get('/webkit/*', function (req, res) {
        res.sendfile(req.params[0], { root : __dirname + '/http/webkit' });
    });
};

/* ************************************************************************** */

module.exports = Service;
