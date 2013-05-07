var inscom = require('./_common');

function Runtime(session) {
    this.session = session;
}

Runtime.prototype.enable = function (params, callback) {
    callback();
};

Runtime.prototype.releaseObjectGroup = function (params, callback) {
    callback();
};

Runtime.prototype.getProperties = function (params, callback) {
    if (params.objectId[0] == '|') {
        var oid = params.objectId.split('|');

        if (oid[1].substr(0, 3) == 'lvl') {
            if (oid.length == 3) {
                this.session.backendSocket.sendMessage('context_get', { d : oid[1].substr(3), c : oid[2].substr(3) }, function (res) {
                    var compiled = [];

                    if (res.property) {
                        (res.property[0] ? res.property : [res.property]).forEach(function (data, i) {
                            compiled.push(inscom.doConvertProperty2(data, '|' + oid[1] + '|' + oid[2] + '|'));
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
                            compiled.push(inscom.doConvertProperty2(data, '|' + oid[1] + '|' + oid[2] + '|'));
                        });
                    }

                    callback({
                        result : compiled
                    });
                });
            }
        }
    }
};

Runtime.prototype.evaluate = function (params, callback) {
    var callback = callback;

    if (params.objectGroup == 'params') {
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
                        result : inscom.doConvertProperty(data.property)
                    });
                }
            }
        );
    } else {
        callback({
            result : {
                type : 'object',
                subtype : 'null',
                value : null
            }
        });
    }
};

module.exports = Runtime;