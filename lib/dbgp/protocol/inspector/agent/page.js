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
                url : this.session.backendSocket.header.init.fileuri,
                mimeType : "text/plain"
            },
            resources : []
        }
    });
};

Page.prototype.getResourceContent = function (params, callback) {
    var callback = callback;

    this.session.backendSocket.sendMessage(
        'source',
        {
            f : params.url
        },
        function (res) {
            if (res['encoding'] == 'base64') {
                callback({
                    content : new Buffer(res['$t'], 'base64').toString('utf8'),
                    base64Encoded : true
                });
            } else {
                callback({
                    scriptSource : res['$1'],
                    base64Encoded : false
                });
            }
        }
    );
};

Page.prototype.canOverrideDeviceMetrics = function (params, callback) {
    callback({
        result : false
    });
};

Page.prototype.canShowDebugBorders = function (params, callback) {
    callback({
        result : false
    });
};

Page.prototype.canShowFPSCounter = function (params, callback) {
    callback({
        result : false
    });
};

Page.prototype.canContinuouslyPaint = function (params, callback) {
    callback({
        result : false
    });
};

Page.prototype.canOverrideGeolocation = function (params, callback) {
    callback({
        result : false
    });
};

Page.prototype.canOverrideDeviceOrientation = function (params, callback) {
    callback({
        result : false
    });
};

Page.prototype.setTouchEmulationEnabled = function (params, callback) {
    callback({
        result : false
    });
};

module.exports = Page;