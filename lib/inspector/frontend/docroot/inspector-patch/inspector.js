WebInspector._panelDescriptors = function() {
    this.panels = {};
    WebInspector.inspectorView = new WebInspector.InspectorView();
    var parentElement = document.getElementById("main");
    WebInspector.inspectorView.show(parentElement);
    WebInspector.inspectorView.addEventListener(WebInspector.InspectorView.Events.PanelSelected, this._panelSelected, this);

    //var elements = new WebInspector.ElementsPanelDescriptor();
    //var resources = new WebInspector.PanelDescriptor("resources", WebInspector.UIString("Resources"), "ResourcesPanel", "ResourcesPanel.js");
    //var network = new WebInspector.NetworkPanelDescriptor();
    var scripts = new WebInspector.ScriptsPanelDescriptor();
    //var timeline = new WebInspector.TimelinePanelDescriptor();
    //var profiles = new WebInspector.ProfilesPanelDescriptor();
    //var audits = new WebInspector.PanelDescriptor("audits", WebInspector.UIString("Audits"), "AuditsPanel", "AuditsPanel.js");
    var console = new WebInspector.PanelDescriptor("console", WebInspector.UIString("Console"), "ConsolePanel");
    //var allDescriptors = [elements, resources, network, scripts, timeline, profiles, audits, console];
    var allDescriptors = [scripts, console];
    //var allProfilers = [profiles];
    var allProfilers = [];
    if (WebInspector.experimentsSettings.separateProfilers.isEnabled()) {
        allProfilers = [];
        allProfilers.push(new WebInspector.PanelDescriptor("cpu-profiler", WebInspector.UIString("CPU Profiler"), "CPUProfilerPanel", "ProfilesPanel.js"));
        if (!WebInspector.WorkerManager.isWorkerFrontend())
            allProfilers.push(new WebInspector.PanelDescriptor("css-profiler", WebInspector.UIString("CSS Profiler"), "CSSSelectorProfilerPanel", "ProfilesPanel.js"));
        if (Capabilities.heapProfilerPresent)
            allProfilers.push(new WebInspector.PanelDescriptor("heap-profiler", WebInspector.UIString("Heap Profiler"), "HeapProfilerPanel", "ProfilesPanel.js"));
        if (!WebInspector.WorkerManager.isWorkerFrontend() && WebInspector.experimentsSettings.canvasInspection.isEnabled())
            allProfilers.push(new WebInspector.PanelDescriptor("canvas-profiler", WebInspector.UIString("Canvas Profiler"), "CanvasProfilerPanel", "ProfilesPanel.js"));
        if (!WebInspector.WorkerManager.isWorkerFrontend() && WebInspector.experimentsSettings.nativeMemorySnapshots.isEnabled()) {
            allProfilers.push(new WebInspector.PanelDescriptor("memory-chart-profiler", WebInspector.UIString("Memory Distribution"), "MemoryChartProfilerPanel", "ProfilesPanel.js"));
            allProfilers.push(new WebInspector.PanelDescriptor("memory-snapshot-profiler", WebInspector.UIString("Memory Snapshots"), "NativeMemoryProfilerPanel", "ProfilesPanel.js"));
        }
        Array.prototype.splice.bind(allDescriptors, allDescriptors.indexOf(profiles), 1).apply(null, allProfilers);
    }

    var panelDescriptors = [];
    if (WebInspector.WorkerManager.isWorkerFrontend()) {
        panelDescriptors.push(scripts);
        //panelDescriptors.push(timeline);
        panelDescriptors = panelDescriptors.concat(allProfilers);
        panelDescriptors.push(console);
        return panelDescriptors;
    }
    for (var i = 0; i < allDescriptors.length; ++i)
        panelDescriptors.push(allDescriptors[i]);
    return panelDescriptors;
};

WebInspector.loaded = function () {
    var connected = false;

    WebInspector.dockController = new WebInspector.DockController();

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

    var socket = io.connect('/inspector.io');

    socket.on('connect', function () {
        socket.emit(
            'attach',
            {
                id : WebInspector.queryParamsObject.id
            },
            function (result) {
                if (result) {
                    _register(result);

                    socket.on('event', function (data) {
                        if (!connected) {
                            console.warn('Not connected and ignored backend event.');

                            return;
                        }

                        InspectorBackend.dispatch(data);
                    });

                    WebInspector.socket = socket;

                    InspectorFrontendHost.sendMessageToBackend = function (message) {
                        if (!connected) {
                            console.warn('Not connected and ignored frontend event.');

                            return;
                        }

                        socket.emit('event', message);
                    };
    
                    connected = true;

                    WebInspector.doLoadedDone();
                } else {
                    console.warn('Debug Session Unavailable for ' + WebInspector.queryParamsObject.sid);
                }
            }
        );
    });

    socket.on('disconnect', function () {
        connected = false;

        var panel = WebInspector.inspectorView.panel('scripts');
        panel.pauseButton.disabled = true;
        panel.pauseButton.addStyleClass('paused');
        panel.debuggerStatusElement.textContent = WebInspector.UIString('Disconnected');

        console.warn('Disconnected');
    });
};
