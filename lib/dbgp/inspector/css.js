function CSS()
{

}

CSS.prototype.enable = function (params, cb) {
    cb();
};

CSS.prototype.getSupportedCSSProperties = function (params, cb) {
    cb({
        cssProperties : []
    });
};

module.exports = CSS;