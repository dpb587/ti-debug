var CommonResolver = require('../common/service');

/* ************************************************************************** */

//
// For direct, single developer debugging.
//
// Basically, any client that registers will become the only one ever used.
//
function DirectResolver() {
    CommonResolver.apply(this, arguments);
}

DirectResolver.prototype.__proto__ = CommonResolver.prototype;

//
// Specify options for the DBGp Client.
//
// In direct mode, the options are simply passed through.
//
DirectResolver.prototype.getClientOptions = function () {
    return this.options;
};

//
// Lookup a client by IDE key.
//
// In direct mode, it's always the first (single) client registered.
//
DirectResolver.prototype.lookupClient = function (idekey) {
    for (var i in this.clients) {
        return this.clients[i];
    }

    return null;
};

//
// Retrieve content for the home page segment.
//
DirectResolver.prototype.getAppIndex = function () {
    // Provide auto-registration and hopefully-useful configuration options.
    return '<div id="dbgp-connect" class="alert">Connecting&hellip;</div>' +
        '<script src="/dbgp/connect.js"></script>' +
        '<script>dbgpConnect("default", window.location.search.match(/(\\?|&)dbgp-multiple=1/) ? true : false, function (message, style) {$("dbgp-connect").set("class", "alert" + (style ? (" alert-" + style) : "")).set("html", message);});</script>' +
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
