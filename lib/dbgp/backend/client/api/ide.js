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

    frontend.on(
        'connect',
        function () {
            var init = rawinit;
            // dbgp spec
            //var init = rawinit.replace(/(<init )(.*)/, '$1proxied="' + socket.localAddress + ':' + socket.localPort + '" $2');
            // komodo is strange and doesn't like it
            frontend.write(init.length + init + '\0');
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
            frontend.removeAllListeners('data');
        
            socket.on(
                'data',
                function (data) {
                    frontend.write(data);
                }
            );

            frontend.connect(that.remotePort, that.remoteAddress);

            socket.resume();
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
