function Client(idekey, multiple, remoteAddress, remotePort) {
    this.idekey = idekey;
    this.multiple = 1 == (multiple || 0);
    this.remoteAddress = remoteAddress;
    this.remotePort = remotePort;
}

Client.prototype.unregister = function () {
};

module.exports = Client;