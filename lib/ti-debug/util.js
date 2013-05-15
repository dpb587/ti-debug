var fs = require('fs');

module.exports.loadServices = function () {
    var services = {};

    fs.readdirSync(__dirname + '/..').forEach(
        function (name) {
            services[name] = require(__dirname + '/../' + name);
        }
    );

    return services;
};

module.exports.parseCLI = function (argv, services, options) {
    for (var name in services) {
        options[name] = options[name] || services[name].MANIFEST.enabled;
    }
    
    function updateOptions(options, path, value) {
        options[path[0]] = path[1] ? updateOptions('object' == typeof options[path[0]] ? options[path[0]] : {}, path.slice(1), value) : value;
    
        return options;
    }
    
    var curropt;
    
    argv.forEach(
        function(val, index) {
            if (1 >= index) {
                return;
            } else if ('--' == val.substr(0, 2)) {
                if (curropt) {
                    options = updateOptions(options, curropt.substr(2).split(':'), true);
                }
    
                curropt = val;
            } else if (curropt) {
                if (val == 'true') {
                    val = true;
                } else if (val == 'false') {
                    val = false;
                }
    
                options = updateOptions(options, curropt.substr(2).split(':'), val);
    
                curropt = null;
            } else {
                throw new Error('Unexpected argument: ' + val);
            }
        }
    );
    
    if (curropt) {
        options = updateOptions(options, curropt.substr(2).split(':'), true);
    }

    return options;
};
