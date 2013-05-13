function Network() {
}

/* ************************************************************************** */

Network.prototype.enable = function (params, callback) {
    callback();
};

Network.prototype.canClearBrowserCache = function (params, callback) {
    callback({
        result : false
    });
};

Network.prototype.canClearBrowserCookies = function (params, callback) {
    callback({
        result : false
    });
};

/* ************************************************************************** */

module.exports = Network;