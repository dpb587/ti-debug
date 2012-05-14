WebInspector.loaded = function () {
    function _register(json) {
        var schema = JSON.parse(json);
        var jsTypes = { integer: "number", array: "object" };
        var rawTypes = {};
    
        var domains = schema["domains"];
        for (var i = 0; i < domains.length; ++i) {
            var domain = domains[i];
            for (var j = 0; domain.types && j < domain.types.length; ++j) {
                var type = domain.types[j];
                rawTypes[domain.domain + "." + type.id] = jsTypes[type.type] || type.type;
            }
        }
    
        var result = [];
        for (var i = 0; i < domains.length; ++i) {
            var domain = domains[i];

            var commands = domain["commands"] || [];    
            for (var j = 0; j < commands.length; ++j) {
                var command = commands[j];
                var parameters = command["parameters"];
                var paramsText = [];
                for (var k = 0; parameters && k < parameters.length; ++k) {
                    var parameter = parameters[k];
    
                    var type;
                    if (parameter.type)
                        type = jsTypes[parameter.type] || parameter.type;
                    else {
                        var ref = parameter["$ref"];
                        if (ref.indexOf(".") !== -1)
                            type = rawTypes[ref];
                        else
                            type = rawTypes[domain.domain + "." + ref];
                    }
    
                    var text = "{\"name\": \"" + parameter.name + "\", \"type\": \"" + type + "\", \"optional\": " + (parameter.optional ? "true" : "false") + "}";
                    paramsText.push(text);
                }
    
                var returnsText = [];
                var returns = command["returns"] || [];
                for (var k = 0; k < returns.length; ++k) {
                    var parameter = returns[k];
                    returnsText.push("\"" + parameter.name + "\"");
                }
                result.push("InspectorBackend.registerCommand(\"" + domain.domain + "." + command.name + "\", [" + paramsText.join(", ") + "], [" + returnsText.join(", ") + "]);");
            }
    
            for (var j = 0; domain.events && j < domain.events.length; ++j) {
                var event = domain.events[j];
                var paramsText = [];
                for (var k = 0; event.parameters && k < event.parameters.length; ++k) {
                    var parameter = event.parameters[k];
                    paramsText.push("\"" + parameter.name + "\"");
                }
                result.push("InspectorBackend.registerEvent(\"" + domain.domain + "." + event.name + "\", [" + paramsText.join(", ") + "]);");
            }
    
            result.push("InspectorBackend.register" + domain.domain + "Dispatcher = InspectorBackend.registerDomainDispatcher.bind(InspectorBackend, \"" + domain.domain + "\");");
        }
        eval(result.join("\n"));
    }

    var socket = io.connect('/dbgp.io');

    socket.on('connect', function () {
        socket.emit(
            'attach',
            {
                sid : WebInspector.queryParamsObject.sid
            },
            function (result) {
                if (result) {
                    _register(result);

                    socket.on('event', function (data) {
                        InspectorBackend.dispatch(data);
                    });

                    WebInspector.socket = socket;
                    InspectorFrontendHost.sendMessageToBackend = function (message) {
                        socket.emit('event', message);
                    };
    
                    WebInspector.doLoadedDone();
                } else {
                    console.warn('Debug Session Unavailable for ' + WebInspector.queryParamsObject.sid);
                }
            }
        );
    });

    socket.on('disconnect', function () {
        console.warn('Disconnected');
    });
};
