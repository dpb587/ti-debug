var net = require('net');

function Client(backend, idekey, multiple, remoteAddress, remotePort) {
    this.backend = backend;
    this.idekey = idekey;
    this.multiple = 1 == (multiple || 0);
    this.remoteAddress = remoteAddress;
    this.remotePort = remotePort;
}

Client.prototype.initiate = function (socket, rawinit) {
    var that = this;

    // Ask ti-debug to create a session...
    var session = this.backend.tidebug.createSession(
        this.backend,
        socket,
        socket.remoteAddress + ':' + socket.remotePort
    );

    socket.pause();

    var frontend = new net.Socket();

    frontend.setEncoding('utf8');

    frontend.on(
        'connect',
        function () {
            var init = rawinit.replace(/(<init )(.*)/, '$1proxied="' + socket.localAddress + ':' + socket.localPort + '" $2');

            frontend.write(init.length + '\0' + init + '\0');

            socket.resume();
        }
    );

    frontend.on(
        'data',
        function (data) {
            socket.write(data);
        }
    );

    session.attach(
        this.backend,
        frontend,
        this.remoteAddress + ':' + this.remotePort,
        function () {
            socket.removeAllListeners('data');

            socket.on(
                'data',
                function (data) {
                    frontend.write(data);
                }
            );

            frontend.connect(that.remotePort, that.remoteAddress);
        }
    );
};

Client.prototype.unregister = function () {
};

Client.prototype.getMode = function () {
    return 'ide';
};

Client.prototype.getTargetName = function () {
    return this.remoteAddress + ':' + this.remotePort;
};

module.exports = Client;
