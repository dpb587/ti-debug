function CSS() {
}

/* ************************************************************************** */

CSS.prototype.enable = function (params, callback) {
    callback(null);
};

CSS.prototype.getSupportedCSSProperties = function (params, callback) {
    callback({
        cssProperties : []
    });
};

/* ************************************************************************** */

module.exports = CSS;
