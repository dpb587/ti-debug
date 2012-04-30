function Page(session)
{
    this.session = session;
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
                url : this.session.backend.header.init.fileuri,
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