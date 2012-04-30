function InspectorFrontendHost() {
    WebInspector.InspectorFrontendHostStub.call(this, arguments);
}

InspectorFrontendHost.prototype = {
    hiddenPanels : function () {
        return [
            'elements',
            'resources',
            'network',
            'styles',
            'profiles',
            'timeline',
            'audits'
        ].join(',');
    }
};

InspectorFrontendHost.prototype.__proto__ = WebInspector.InspectorFrontendHostStub.prototype;

var InspectorFrontendHost = new InspectorFrontendHost();
