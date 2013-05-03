var CommonResolver = require('../common/service');

function DirectResolver() {
    CommonResolver.apply(this, arguments);
}

DirectResolver.prototype.__proto__ = CommonResolver.prototype;

DirectResolver.prototype.lookupClient = function (idekey) {
    for (var i in this.clients) {
        return this.clients[i];
    }

    return null;
};

DirectResolver.prototype.getAppIndex = function () {
    return '<div id="dbgp-connect" class="alert">Connecting&hellip;</div>' +
        '<script src="/dbgp/connect.js"></script>' +
        '<script>dbgpConnect("default", "1", function (message, style) {$("dbgp-connect").set("class", "alert" + (style ? (" alert-" + style) : "")).set("html", message);});</script>' +
        '<dl class="dl-horizontal">' +
            '<dt><a href="http://php.net/">PHP</a> (<a href="http://xdebug.org/">Xdebug</a>)</dt>' +
            '<dd><pre><code>' +
                'xdebug.remote_enable = 1\n' +
                'xdebug.remote_autostart = 1\n' +
                'xdebug.remote_host = ' + this.client.options.host + '\n' +
                'xdebug.remote_port = ' + this.client.options.port + '\n' +
            '</code></pre></dd>' +
        '</dl>'
    ;
};

/* ************************************************************************** */

module.exports = DirectResolver;
