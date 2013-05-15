var assert = require('assert');

var TiDebugDBGpClient = require('../../../lib/dbgp/client-api/tidebug');
var TiDebug = require('../../../lib/ti-debug');

function createStub() {
    return TiDebug.create(
        {
            dbgp : require('../../../lib/dbgp')
        },
        {
            dbgp : true
        }
    ).getService('dbgp')
}

function createProxyStub() {
    return TiDebug.create(
        {
            dbgp : require('../../../lib/dbgp'),
            'dbgp-proxy' : require('../../../lib/dbgp-proxy')
        },
        {
            dbgp : true,
            'dbgp-proxy' : true
        }
    ).getService('dbgp')
}

describe(
    'unit/dbgp/service',
    function () {
        describe(
            '#registerClient',
            function () {
                it(
                    'registers a new client',
                    function (done) {
                        var mock = createStub();

                        var client1 = new TiDebugDBGpClient(mock, 'testme1', false, /* socket */ null);
                        mock.registerClient(client1);

                        assert.deepEqual(mock.lookupClient('testme1'), client1);

                        done();
                    }
                );

                it(
                    'unregisters an existing client',
                    function (done) {
                        var mock = createStub();

                        var client1 = new TiDebugDBGpClient(mock, 'testme1', false, /* socket */ null);
                        mock.registerClient(client1);

                        var client2 = new TiDebugDBGpClient(mock, 'testme2', false, /* socket */ null);
                        mock.registerClient(client2);

                        // old client gone
                        assert.equal(null, mock.getClients().testme1);

                        // new client gone
                        assert.deepEqual('testme2', mock.lookupClient('testme2').idekey);

                        done();
                    }
                );
            }
        );

        describe(
            '#unregisterClient',
            function () {
                it(
                    'unregisters an existing client',
                    function (done) {
                        var mock = createStub();

                        var client1 = new TiDebugDBGpClient(mock, 'testme1', false, /* socket */ null);
                        mock.registerClient(client1);
                        mock.unregisterClient(client1);

                        assert.deepEqual(mock.lookupClient('testme1'), null);

                        done();
                    }
                );
            }
        );

        describe(
            '#lookupClient',
            function () {
                it(
                    'lookup existing client',
                    function (done) {
                        var mock = createStub();

                        var client1 = new TiDebugDBGpClient(mock, 'testme1', false, /* socket */ null);
                        mock.registerClient(client1);

                        assert.equal(mock.lookupClient('testme1').idekey, 'testme1');

                        done();
                    }
                );

                it(
                    'lookup a non-existant client',
                    function (done) {
                        var mock = createStub();

                        client1 = new TiDebugDBGpClient(mock, 'testme1', false, /* socket */ null);

                        assert.equal(mock.lookupClient('testme1'), null);

                        done();
                    }
                );
            }
        );

        describe(
            'with-proxy',
            function () {
                describe(
                    '#registerClient',
                    function () {
                        it(
                            'registers a new client',
                            function (done) {
                                var mock = createProxyStub();
        
                                var client1 = new TiDebugDBGpClient(mock, 'testme1', false, /* socket */ null);
                                mock.registerClient(client1);
        
                                assert.deepEqual(mock.lookupClient('testme1'), client1);
        
                                done();
                            }
                        );
        
                        it(
                            'registers multiple clients',
                            function (done) {
                                var mock = createProxyStub();
        
                                var client1 = new TiDebugDBGpClient(mock, 'testme1', false, /* socket */ null);
                                mock.registerClient(client1);
        
                                var client2 = new TiDebugDBGpClient(mock, 'testme2', false, /* socket */ null);
                                mock.registerClient(client2);
        
                                assert.deepEqual('testme1', mock.lookupClient('testme1').idekey);
                                assert.deepEqual('testme2', mock.lookupClient('testme2').idekey);
        
                                done();
                            }
                        );
                    }
                );
        
                describe(
                    '#unregisterClient',
                    function () {
                        it(
                            'unregisters an existing client',
                            function (done) {
                                var mock = createProxyStub();
        
                                var client1 = new TiDebugDBGpClient(mock, 'testme1', false, /* socket */ null);
                                mock.registerClient(client1);
        
                                var client2 = new TiDebugDBGpClient(mock, 'testme2', false, /* socket */ null);
                                mock.registerClient(client2);
        
                                mock.unregisterClient(client1);
        
                                assert.deepEqual(mock.lookupClient('testme1'), null);
                                assert.equal(mock.lookupClient('testme2').idekey, 'testme2');
        
                                done();
                            }
                        );
                    }
                );
        
                describe(
                    '#lookupClient',
                    function () {
                        it(
                            'lookup existing client',
                            function (done) {
                                var mock = createProxyStub();
        
                                var client1 = new TiDebugDBGpClient(mock, 'testme1', false, /* socket */ null);
                                mock.registerClient(client1);
        
                                var client2 = new TiDebugDBGpClient(mock, 'testme2', false, /* socket */ null);
                                mock.registerClient(client2);
        
                                assert.equal(mock.lookupClient('testme1').idekey, 'testme1');
        
                                done();
                            }
                        );
        
                        it(
                            'lookup a non-existant client',
                            function (done) {
                                var mock = createProxyStub();
        
                                client1 = new TiDebugDBGpClient(mock, 'testme1', false, /* socket */ null);
        
                                assert.equal(mock.lookupClient('testme1'), null);
        
                                done();
                            }
                        );
                    }
                );
            }
        );
    }
);
