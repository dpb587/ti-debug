var assert = require('assert');

var DbgpBackendClientSocketTools = require('../../../lib/dbgp/socket_tools');

function createSocketSendMessageTest(args, expected) {
    return function (done) {
        var socket = {};

        socket.tidebugCallbacks = {};
        socket.tidebugSendCount = 2;
        socket.write = function (actual) {
            assert.equal(actual, expected);
            done();
        };

        DbgpBackendClientSocketTools.socketSendMessage.apply(socket, args);
    }
};

describe('unit/dbgp/backend/client/socket_tool', function () {
    describe('#socketSendMessage', function () {
        it(
            'includes transaction IDs',
            createSocketSendMessageTest(
                [ 'step_over' ],
                'step_over -i 3\0'
            )
        );

        it(
            'includes arbitrary arguments',
            createSocketSendMessageTest(
                [ 'context_names', { d : 0 } ],
                'context_names -i 3 -d 0\0'
            )
        );

        it(
            'encodes data when present',
            createSocketSendMessageTest(
                [ 'property_set', { d : 0, n : '$testme', t : 'string' }, 'special value' ],
                'property_set -i 3 -d 0 -n "$testme" -t "string" -- c3BlY2lhbCB2YWx1ZQ==\0'
            )
        );
    });
});
