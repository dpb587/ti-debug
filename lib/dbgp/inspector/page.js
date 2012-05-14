function Page(engine, browser)
{
    this.engine = engine;
    this.browser = browser;;
}

Page.prototype.enable = function (params, callback) {
    callback();
};

Page.prototype.getResourceTree = function (params, callback) {
    callback({
        frameTree : {
            frame : {
                id : "1",
                loaderId : "_internal",
                url : this.engine.header.init.fileuri,
                mimeType : "text/html"
            },
            resources : []
        }
    });
};

Page.prototype.canOverrideDeviceMetrics = function (params, callback) {
    callback({
        result : false
    });
};

module.exports = Page;