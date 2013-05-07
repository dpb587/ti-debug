//
// A simple session manager to track sessions.
//

function Map() {
    this.map = {};
}

//
// Register an `inspector/engine/session/instance` object.
//
Map.prototype.register = function (session) {
    this.map[session.id] = session;
};

//
// Unregister an `inspector/engine/session/instance` with an optional reason.
//
Map.prototype.unregister = function (session, reason) {
    reason = reason || 'Internally detached by session manager.';

    for (var id in this.map) {
        if (session == this.map[id]) {
            this.map[id].detach(reason);

            delete this.map[id];

            return;
        }
    }
};

//
// Find a session based on its identifier.
//
Map.prototype.lookup = function (id) {
    return (id in this.map) ? this.map[id] : null;
}

/* ************************************************************************** */

module.exports = Map;
