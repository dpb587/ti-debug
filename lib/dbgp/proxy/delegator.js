function Delegator() {
    this.delegates = {};
}

Delegator.prototype.addDelegate = function (name, delegate) {
    if (this.delegates[name]) {
        this.delegates[name].stop();
        delete this.delegates[name];
    }

    this.delegates[name] = delegate;
};

Delegator.prototype.initiate = function (idekey, socket) {
    var stat;

    for (var name in this.delegates) {
        stat = this.delegates[name].initiate(idekey, socket);

        if (stat) {
            return stat;
        }
    }
};

Delegator.prototype.stop = function () {
    for (var name in this.delegates) {
        this.delegates[name].stop();
    }
};

Delegator.prototype.start = function () {
    for (var name in this.delegates) {
        this.delegates[name].start();
    }
};

module.exports = Delegator;
            