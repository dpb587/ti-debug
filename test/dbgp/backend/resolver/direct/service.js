var assert = require('assert');

var DirectService = require('../../../../../lib/dbgp/backend/resolver/direct/service');
var TiDebugDBGpClient = require('../../../../../lib/dbgp/backend/client/api/tidebug');
var TiDebugUtility = require('../../../../ti-debug/_utility.js');

describe(
    'dbgp/backend/resolver/direct/service',
    function () {
        describe(
            '#getName',
            function () {
                it(
                    'returns dbgp',
                    function (done) {
                        assert.equal(TiDebugUtility.createMockService(DirectService).getName(), 'dbgp');

                        done();
                    }
                );
            }
        );

        describe(
            '#registerClient',
            function () {
                it(
                    'registers a new client',
                    function (done) {
                        var mock = TiDebugUtility.createMockService(DirectService);

                        var client1 = new TiDebugDBGpClient(mock, 'testme1', false, /* socket */ null);
                        mock.registerClient(client1);

                        assert.deepEqual(mock.lookupClient('testme1'), client1);

                        done();
                    }
                );

                it(
                    'unregisters an existing client',
                    function (done) {
                        var mock = TiDebugUtility.createMockService(DirectService);

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
                        var mock = TiDebugUtility.createMockService(DirectService);

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
                        var mock = TiDebugUtility.createMockService(DirectService);

                        var client1 = new TiDebugDBGpClient(mock, 'testme1', false, /* socket */ null);
                        mock.registerClient(client1);

                        assert.equal(mock.lookupClient('testme1').idekey, 'testme1');

                        done();
                    }
                );

                it(
                    'lookup a non-existant client',
                    function (done) {
                        var mock = TiDebugUtility.createMockService(DirectService);

                        client1 = new TiDebugDBGpClient(mock, 'testme1', false, /* socket */ null);

                        assert.equal(mock.lookupClient('testme1'), null);

                        done();
                    }
                );
            }
        );
    }
);
