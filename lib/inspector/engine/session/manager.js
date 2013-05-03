function Map() {
    this.map = {};
    this.mapCount = 0;
}

Map.prototype.register = function (session) {
    this.mapCount += 1;
    this.map[session.id] = session;
};

Map.prototype.unregister = function (session, message) {
    message = message || 'Internally detached by session manager.';

    for (var id in this.map) {
        if (session == this.map[id]) {
            this.map[id].detach(message);

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
