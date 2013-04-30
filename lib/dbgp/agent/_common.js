function doConvertProperty(data, prefix) {
    var compiled = {};

    switch (data.type) {
        case 'bool':
            compiled.type = 'boolean';
            compiled.value = data['$t'] == '1' ? true : false;
            break;
        case 'int':
            compiled.type = 'number';
            compiled.value = data['$t'];
            break;
        case 'string':
            compiled.type = 'string';
            if (data.encoding == 'base64' && data.size > 0) {
                compiled.value = new Buffer(data['$t'], 'base64').toString('utf8');
            } else {
                compiled.value = data['$t'];
            }
            break;
        case 'null':
            compiled.type = 'object';
            compiled.subtype = 'null';
            compiled.value = null;
            break;
        case 'array':
            compiled.type = 'object';
            compiled.objectId = prefix + data.fullname;
            compiled.subtype = 'array';
            compiled.description = 'Array(' + (data.numchildren || 0) + ')';
        case 'hash':
            compiled.type = 'object';
            break;
        case 'object':
            compiled.type = 'object';
            compiled.objectId = prefix + data.fullname;
            compiled.description = data.classname;
            break;
    }

    if (data.classname) {
        compiled.className = data.classname;
    }

    return compiled;
}

function doConvertProperty2(data, prefix) {
    return {
        name : 'string' == typeof data.name ? data.name.replace(/\*[^*]+\*/, '') : data.name.toString(),
        value : doConvertProperty(data, prefix),
        writable : true
    };
}

module.exports = {
    doConvertProperty : doConvertProperty,
    doConvertProperty2 : doConvertProperty2
};
