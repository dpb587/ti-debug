function Map(logger) {
    this.map = null;

    this.logger = logger;
}

Map.prototype.register = function (client) {
    this.unregister(client);

    if (this.logger) {
        this.logger.info('[dbgp:client:map] registered');
    }

    return this.map = client;
};

Map.prototype.unregister = function (client) {
    if (client == this.map) {
        this.map.unregister();

        if (this.logger) {
            this.logger.info('[dbgp:client:map] unregistered client');
        }
    
        this.map = null;
    }
}

Map.prototype.lookup = function (idekey) {
    return this.map;
};

Map.prototype.getMap = function () {
    return this.map ? [ this.map ] : [];
};

/* ************************************************************************** */

module.exports = Map;
