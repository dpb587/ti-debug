function CSS() {
}

/* ************************************************************************** */

CSS.prototype.enable = function (params, callback) {
    callback();
};

CSS.prototype.getSupportedCSSProperties = function (params, callback) {
    callback({
        cssProperties : []
    });
};

/* ************************************************************************** */

module.exports = CSS;
