//
// These convert DBGp XML responses to the various structured object types that
// the inspector schema.json defines.
//

/* ************************************************************************** */

function getBasicType(data) {
    switch (data.type) {
        case 'bool':
            return {
                type : 'boolean',
                value : data['$t'] == '1' ? true : false
            };
        case 'int':
            return {
                type : 'number',
                value : data['$t']
            };
        case 'string':
            return {
                type : 'string',
                value : ('base64' == data.encoding && 0 < data.size) ? new Buffer(data['$t'], 'base64').toString('utf8') : data['$t']
            };
        case 'float':
            return {
                type : 'number',
                value : data['$t']
            };
        case 'uninitialized':
            return {
                type : 'undefined'
            };
        case 'null':
            return {
                type : 'object',
                subtype : 'null',
            };
        case 'array':
            return {
                type : 'object',
                subtype : 'array'
            };
        case 'hash':
            return {
                type : 'object'
            }
        case 'object':
            return {
                type : 'object'
            }
        case 'resource':
            return {
                type : 'object'
            };
        default:
            throw new Error('Unknown type "' + data.type + '".');
    }
}

function createPropertyPreview(data) {
    var result = getBasicType(data);

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

function createRemoteObject(data, prefix) {
    var result = getBasicType(data);

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
                result.preview.properties.push(createPropertyPreview(property));
            }
        );
    }

    return result;
}

function createPropertyDescriptor(data, prefix) {
    var value = createRemoteObject(data, prefix);

    return {
        name : 'string' == typeof data.name ? data.name.replace(/\*[^*]+\*/, '') : data.name.toString(),
        value : value,
        writable : true
    };
}

/* ************************************************************************** */

module.exports = {
    createRemoteObject : createRemoteObject,
    createPropertyDescriptor : createPropertyDescriptor
};
