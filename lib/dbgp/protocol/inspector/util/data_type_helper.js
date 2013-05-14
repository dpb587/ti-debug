//
// These convert DBGp XML responses to the various structured object types that
// the inspector schema.json defines.
//

/* ************************************************************************** */

module.exports.getBasicType = function (data) {
    switch (data.type) {
        case 'array':
        case 'list': // komodo debugging
            return {
                type : 'object',
                subtype : 'array'
            };
        case 'bool':
            var truthy = (data.value || data['$t']);

            return {
                type : 'boolean',
                value : ('1' == truthy || 'True' == truthy) ? true : false
            };
        case 'float':
            return {
                type : 'number',
                value : data.value || data['$t']
            };
        case 'hash':
        case 'dict': // komodo debugging
            return {
                type : 'object'
            }
        case 'int':
            return {
                type : 'number',
                value : data.value || data['$t']
            };
        case 'null':
            return {
                type : 'object',
                subtype : 'null',
            };
        case 'object':
            return {
                type : 'object'
            }
        case 'resource':
            return {
                type : 'object'
            };
        case 'string':
        case 'str': // komodo debugging
            return {
                type : 'string',
                value : data.value || data['$t']
            };
        case 'uninitialized':
        case 'undefined': // xdebug 2.2.2 seems to call it "undefined"
            return {
                type : 'undefined'
            };
        case 'function': // komodo python
        case 'builtin_function_or_method': // komodo python
        case 'instancemethod': // komod python
            return {
                type : 'function'
            };
        default:
            // komodo debugging seems to include code types...
            return {
                type : 'object'
            };

            //throw new Error('Unknown type "' + data.type + '".');
    }
}

module.exports.getPropertyPreview = function (data) {
    var result = module.exports.getBasicType(data);

    result.name = data.name;

    switch (data.type) {
        case 'array':
        case 'list': // komodo debugging
            result.value = data.type + '(' + (data.numchildren || 0) + ')';

            break;
        case 'hash':
        case 'dict': // komodo debugging
            result.value = data.type + '(' + (data.numchildren || 0) + ')';

            break;
        case 'null':
            result.value = 'null';

            break;
        case 'object':
            result.value = data.classname;

            break;
        case 'resource':
            result.value = '<Resource#' + result.address + '>';

            break;
        case 'array':
        case 'bool':
        case 'float':
        case 'int':
        case 'null':
        case 'object':
        case 'resource':
        case 'string':
        case 'str':
        case 'uninitialized':
        case 'undefined': // xdebug 2.2.2 seems to call it "undefined"
            break;
        case 'function': // komodo python
        case 'builtin_function_or_method': // komodo python
        case 'instancemethod': // komodo python
            result.value = data.value;

            break;
        default: // unrecognized
            result.value = data.type;

            break;
    }

    return result;
}

module.exports.getRemoteObject = function (data, prefix) {
    var result = module.exports.getBasicType(data);

    switch (data.type) {
        case 'array':
        case 'list':
            result.objectId = prefix + data.fullname;
            result.description = data.type + '(' + (data.numchildren || 0) + ')';
            result.value = null;

            break;
        case 'hash':
        case 'dict':
            result.objectId = prefix + data.fullname;
            result.description = data.type + '(' + (data.numchildren || 0) + ')';
            result.value = null;

            break;
        case 'null':
            result.value = null;

            break;
        case 'object':
            result.className = data.classname;
            result.objectId = prefix + data.fullname;
            result.description = data.classname;
            result.value = null;

            break;
        case 'resource':
            result.objectId = prefix + data.fullname;
            result.description = '<Resource#' + result.address + '>';
            result.value = null;

            break;
        case 'array':
        case 'bool':
        case 'float':
        case 'hash':
        case 'int':
        case 'null':
        case 'object':
        case 'resource':
        case 'string':
        case 'str':
        case 'uninitialized':
        case 'undefined': // xdebug 2.2.2 seems to call it "undefined"
            break;
        case 'function': // komodo python
        case 'builtin_function_or_method': // komodo python
        case 'instancemethod': // komodo python
            result.value = data.value;

            break;
        default:
            result.className = data.type;
            result.objectId = prefix + data.fullname;
            result.description = data.type;
            result.value = null;

            break;
    }

    if ('array' == data.type || 'object' == data.type) {
        result.objectId = (result.objectId || '') + '@' + data.address;
    }

    if (data.property) {
        result.preview = {
            lossless : (result.objectId ? false : data.numchildren < data.pagesize),
            overflow : data.numchildren > data.pagesize,
            properties : []
        };

        (data.property[0] ? data.property : [ data.property ]).forEach(
            function (property) {
                result.preview.properties.push(module.exports.getPropertyPreview(module.exports.convertComplexObject(property)));
            }
        );
    }

    return result;
};

module.exports.getPropertyDescriptor = function (data, prefix) {
    var value = module.exports.getRemoteObject(data, prefix);

    return {
        name : ('string' == typeof data.name ? data.name.replace(/\*[^*]+\*/, '') : data.name.toString())
            .replace('&apos;', "'") // komodo seems to occasionally do: &apos;MAX_CONTENT_LENGTH'
            ,
        value : value,
        writable : value.type != 'function' && value.type != 'builtin_function_or_method' && value.type != 'instancemethod'
    };
};

module.exports.convertComplexObject = function (data) {
    if (data.encoding && data['$t'] && 'base64' == data.encoding) {
        delete data.encoding;

        data['$t'] = new Buffer(data['$t'], 'base64').toString('utf8');
    } else {
        // in case the came through as sub-nodes
        for (var i in data) {
            if ('object' == typeof data[i]) {
                if (data[i].encoding) {
                    if ('base64' == data[i].encoding) {
                        data[i] = new Buffer(data[i]['$t'], 'base64').toString('utf8');
                    } else if ('None' == data[i].encoding) {
                        // komodo python
                        data[i] = data[i]['$t'];
                    }
                }
            }
        }
    }

    return data;
};
