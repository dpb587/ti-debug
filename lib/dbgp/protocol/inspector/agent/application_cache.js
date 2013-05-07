function ApplicationCache()
{

}

ApplicationCache.prototype.getFramesWithManifests = function (params, callback) {
    callback({
        frameIds: []
    });
};

module.exports = ApplicationCache;
