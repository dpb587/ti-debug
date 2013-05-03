function Map() {
    this.map = {};
    this.mapCount = 0;
}

Map.prototype.register = function (session) {
    this.mapCount += 1;
    this.map[session.id] = session;
};

Map.prototype.unregister = function (session) {
    for (var id in this.map) {
        if (session == this.map[id]) {
            this.map[id].detach('Internally detached by session manager.');

            delete this.map[id];
            this.mapCount -= 1;

            return;
        }
    }
};

Map.prototype.lookup = function (id) {
    return (id in this.map) ? this.map[id] : null;
}

module.exports = Map;
