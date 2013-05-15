var DataTypeHelper = require('../util/data_type_helper');

function Runtime(session) {
    this.session = session;
}

Runtime.prototype.enable = function (params, callback) {
    callback(null);
};

Runtime.prototype.releaseObjectGroup = function (params, callback) {
    callback(null);
};

Runtime.prototype.getProperties = function (params, callback) {
    var objectIdParts = params.objectId.split('@', 2);

    if (objectIdParts[0][0]== '|') {
        var oid = objectIdParts[0].split('|');

        if (oid[1].substr(0, 3) == 'lvl') {
            if (oid.length == 3) {
                this.session.backendSocket.sendMessage('context_get', { d : oid[1].substr(3), c : oid[2].substr(3) }, function (res) {
                    var compiled = [];

                    if (res.property) {
                        (res.property[0] ? res.property : [res.property]).forEach(function (data, i) {
                            compiled.push(DataTypeHelper.getPropertyDescriptor(DataTypeHelper.convertComplexObject(data), '|' + oid[1] + '|' + oid[2] + '|'));
                        });
                    }
            
                    callback({
                        result : compiled
                    });
                });
            } else {
                this.session.backendSocket.sendMessage('property_get', { d : oid[1].substr(3), c : oid[2].substr(3), n : oid[3] }, function (res) {
                    var compiled = [];

                    if (res.property.property) {
                        (res.property.property[0] ? res.property.property : [res.property.property]).forEach(function (data, i) {
                            compiled.push(DataTypeHelper.getPropertyDescriptor(DataTypeHelper.convertComplexObject(data), '|' + oid[1] + '|' + oid[2] + '|'));
                        });
                    } else {
                        callback({
                            result : {}
                        });
                    }

                    callback({
                        result : compiled
                    });
                });
            }
        }
    } else if (objectIdParts[1]) {
        this.session.backendSocket.sendMessage('property_value', { n : objectIdParts[0], a : objectIdParts[1] }, function (res) {
            var compiled = [];

            if (res.property.property) {
                (res.property.property[0] ? res.property.property : [res.property.property]).forEach(function (data, i) {
                    compiled.push(DataTypeHelper.getPropertyDescriptor(DataTypeHelper.convertComplexObject(data), '|' + oid[1] + '|' + oid[2] + '|'));
                });
            }

            callback({
                result : compiled
            });
        });
    }
};

Runtime.prototype.evaluate = function (params, callback) {
    var callback = callback;

    this.session.backendSocket.sendMessage(
        'eval',
        params.expression,
        function (data) {
            if (data.error) {
                callback({
                    result : {
                        type : 'string',
                        value : data.error.code + ': ' + data.error.message
                    },
                    wasThrown : true
                });
            } else {
                callback({
                    result : DataTypeHelper.getRemoteObject(DataTypeHelper.convertComplexObject(data.property))
                });
            }
        }
    );
};

module.exports = Runtime;