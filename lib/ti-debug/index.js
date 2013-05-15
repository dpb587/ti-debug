module.exports.MANIFEST = {
    name : 'ti-debug',
    enabled : true,
    description : 'Internal service manager.',
    options_defaults : {
        host : '127.0.0.1',
        port : '9222'
    },
    options_notes : {
        host : 'host/ip to bind ti-debug server',
        port : 'port to bind ti-debug server'
    },
    version : '0.1.0-dev',
    upstream : 'https://github.com/dpb587/ti-debug'
};

module.exports.create = function (services, options, logger) {
    var Service = require('./service');

    var tidebug = new Service(options['ti-debug'], logger);

    for (var name in options) {
        if ('log-level' == name || 'ti-debug' == name) {
            continue;
        } else if (false === options[name]) {
            continue;
        }
    
        var service = services[name];
        var serviceOptions = service.MANIFEST.options_defaults;
    
        for (var key in options[name]) {
            serviceOptions[key] = options[name][key];
        }
    
        tidebug.createService(
            service,
            serviceOptions
        );
    }

    return tidebug;
};

module.exports.run = function (services, options) {
    if (options.help) {
        console.log('Usage:');
        console.log('');
        console.log('    ' + process.argv[1] + ' [options]');
        console.log('');
        console.log('Global:');
        console.log('');
        console.log('    --help                             output usage information');
        console.log('    --version                          output the version number');
        console.log('    --log-level [none|error|warn|info|debug] logging level [info]');
        console.log('    --[service] [true|false]           enable/disable service');
        console.log('    --[service]:[option] [value]       specific service option');
        console.log('');
        console.log('Services:');
        console.log('');
    
        for (var name in services) {
            var service = services[name];
    
            console.log('  ' + service.MANIFEST.name + (service.MANIFEST.version ? (' (' + service.MANIFEST.version + ')') : ''));
            console.log('  ' + service.MANIFEST.description);
            console.log('');
    
            console.log('    --' + service.MANIFEST.name + ' [true|false]    enable/disable ' + service.MANIFEST.name + ' [' + (service.MANIFEST.enabled ? 'true' : 'false') + ']');
    
            for (var key in service.MANIFEST.options_notes) {
                console.log(
                    '    --' + service.MANIFEST.name + ':' + key + ' [value]    ' + service.MANIFEST.options_notes[key]
                    + ((service.MANIFEST.options_defaults[key]) ? (' [' + service.MANIFEST.options_defaults[key] + ']') : '')
                );
            }
    
            console.log('');
        }
    
        console.log('About:');
        console.log('');
        console.log('    Website: ' + module.exports.MANIFEST.upstream);
        console.log('    Creator: Danny Berger <http://dpb587.me>');
        console.log('    License: MIT License');
        console.log('');
    
        return;
    } else if (options.version) {
        console.log(module.exports.MANIFEST.version);
    
        return;
    }
    
    /**
     * logger
     */
    var Logger = require('socket.io/lib/logger')
    var logger;
    
    if (options['log-level'] && options['log-level'] != 'none') {
        logger = new Logger();
        logger.level = ['error', 'warn', 'info', 'debug'].indexOf(options['log-level']);
    }
    
    /**
     * Bootstrap
     */
    
    var tidebug = module.exports.create(services, options, logger);
    
    tidebug.start();
    
    process.on(
        'SIGINT',
        function () {
            if (logger) {
                logger.info('Received SIGINT');
            }
    
            tidebug.stop();
        }
    );
}
