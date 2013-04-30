function Map(logger) {
    this.map = {};
    this.mapSize = 0;

    this.logger = logger;
}

Map.prototype.register = function (client) {
    var existing = this.lookup(client.idekey);

    if (existing) {
        this.unregister(existing);
    }

    if (this.logger) {
        this.logger.info('[dbgp:client:map] registered idekey=' + client.idekey);
    }

    this.mapSize += 1;
    return this.map[client.idekey] = client;
};

Map.prototype.unregister = function (client) {
    for (var i in this.map) {
        if (client == this.map[i]) {
            this.map[i].unregister();

            if (this.logger) {
                this.logger.info('[dbgp:client:map] unregistered client idekey=' + client.idekey);
            }

            delete this.map[i];
            this.mapSize -= 1;

            return;
        }
    }
}

Map.prototype.lookup = function (idekey) {
    return idekey in this.map ? this.map[idekey] : null;
};

/* ************************************************************************** */

module.exports = Map;
