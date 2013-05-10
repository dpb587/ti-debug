//
// These convert DBGp XML responses to the various structured object types that
// the inspector schema.json defines.
//

/* ************************************************************************** */

module.exports.getBasicType = function (data) {
    switch (data.type) {
        case 'array':
            return {
                type : 'object',
                subtype : 'array'
            };
        case 'bool':
            return {
                type : 'boolean',
                value : data['$t'] == '1' ? true : false
            };
        case 'float':
            return {
                type : 'number',
                value : data['$t']
            };
        case 'hash':
            return {
                type : 'object'
            }
        case 'int':
            return {
                type : 'number',
                value : data['$t']
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
            return {
                type : 'string',
                value : ('base64' == data.encoding && 0 < data.size) ? new Buffer(data['$t'], 'base64').toString('utf8') : data['$t']
            };
        case 'uninitialized':
        case 'undefined': // xdebug 2.2.2 seems to call it "undefined"
            return {
                type : 'undefined'
            };
        default:
            throw new Error('Unknown type "' + data.type + '".');
    }
}

module.exports.getPropertyPreview = function (data) {
    var result = module.exports.getBasicType(data);

    result.name = data.name;

    switch (data.type) {
        case 'array':
            result.value = 'Array(' + (data.numchildren || 0) + ')';

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
    }

    return result;
}

module.exports.getRemoteObject = function (data, prefix) {
    var result = module.exports.getBasicType(data);

    switch (data.type) {
        case 'array':
            result.objectId = prefix + data.fullname;
            result.description = 'Array(' + (data.numchildren || 0) + ')';
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
                result.preview.properties.push(module.exports.getPropertyPreview(property));
            }
        );
    }

    return result;
}

module.exports.getPropertyDescriptor = function (data, prefix) {
    var value = module.exports.getRemoteObject(data, prefix);

    return {
        name : 'string' == typeof data.name ? data.name.replace(/\*[^*]+\*/, '') : data.name.toString(),
        value : value,
        writable : true
    };
}
