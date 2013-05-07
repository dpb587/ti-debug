var inscom = require('./_common');

function doLoadContexts(session, level, callback) {
    var level = level;

    session.backendSocket.sendMessage('context_names', { 'd' : level }, function (res) {
        var data = res.context[0] ? res.context : [res.context];
        var compiled = [];
        var locked = data.length;

        data.forEach(function (data, i) {
            var data = data, i = i;

            if (data.name == 'Locals') {
                data.name = 'local';
            } else if (data.name == 'Superglobals') {
                data.name = 'global';
            }

            compiled[i] = {
                type : data.name,
                object : {
                    type : 'object',
                    objectId : '|lvl' + level + '|ctx' + data.id
                }
            };
        });

        callback(compiled);
    });
}

function doFreezeFrame(session, callback) {
    session.backendSocket.sendMessage('stack_get', function (res) {
        var data = res.stack[0] ? res.stack : [res.stack];
        var compiled = [];
        var locked = data.length;

        data.forEach(function (data, i) {
            var data = data, i = i;

            session.agents.Debugger._mentionParsedScript(data.filename);

            doLoadContexts(session, data.level, function (result) {
                compiled[i] = {
                    callFrameId : data.level.toString(),
                    functionName : data.where,
                    location : {
                        scriptId : data.filename,
                        lineNumber : parseInt(data.lineno) - 1,
                        columnNumber : 0
                    },
                    scopeChain : result,
                    'this' : null
                };

                if (-- locked == 0) {
                    callback(compiled);
                }
            });
        });
    });
}

function doHandleContinue(session, callback, data) {
    callback();

    if (data.status == 'break') {
        doFreezeFrame(session, function (res) {
            session.frontendSocket.sendInspectorMessage('Debugger.paused', { callFrames : res, reason : 'other' });
        });
    } else if (data.status == 'stopping') {
        session.detach('Program has terminated.');
    }
}


function Debugger(session)
{
    this.parsedScripts = {};
    this.session = session;
}

Debugger.prototype._mentionParsedScript = function (scriptId) {
    if (!this.parsedScripts[scriptId]) {
        this.parsedScripts[scriptId] = true;
        
        this.session.frontendSocket.sendInspectorMessage(
            'Debugger.scriptParsed',
            {
                scriptId : scriptId,
                url : scriptId,
                startLine : 0,
                startColumn : 0,
                endLine : 200,
                endColumn : 200
            },
            function () {}
        );
    }
};

Debugger.prototype.enable = function (params, callback) {
    this.session.backendSocket.sendMessage('step_into', doHandleContinue.bind(this, this.session, callback));
};

Debugger.prototype.getScriptSource = function (params, callback) {
    var callback = callback;

    this.session.backendSocket.sendMessage(
        'source',
        {
            f : params.scriptId
        },
        function (res) {
            if (res['encoding'] == 'base64') {
                callback({
                    scriptSource : new Buffer(res['$t'], 'base64').toString('utf8')
                });
            } else {
                callback({
                    scriptSource : res['$1']
                });
            }
        }
    );
};

Debugger.prototype.stepOver = function (params, callback) {
    this.session.backendSocket.sendMessage('step_over', doHandleContinue.bind(this, this.session, callback));
};

Debugger.prototype.stepInto = function (params, callback) {
    this.session.backendSocket.sendMessage('step_into', doHandleContinue.bind(this, this.session, callback));
};

Debugger.prototype.stepOut = function (params, callback) {
    this.session.backendSocket.sendMessage('step_out', doHandleContinue.bind(this, this.session, callback));
};

Debugger.prototype.resume = function (params, callback) {
    this.session.backendSocket.sendMessage('run', doHandleContinue.bind(this, this.session, callback));
};

Debugger.prototype.pause = function (params, callback) {
    this.session.backendSocket.sendMessage('break', doHandleContinue.bind(this, this.session, callback));
};

Debugger.prototype.evaluateOnCallFrame = function (params, callback) {
    var callback = callback;

    if (params.objectGroup == 'console' || params.objectGroup == 'watch-group') {
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
    } else if (params.objectGroup == 'popover') {
        if (params.expression[0] != '$') {
            callback({
                result : {
                    type : 'object',
                    subtype : 'null',
                    value : null
                }
            });

            return;
        }

        this.session.backendSocket.sendMessage('property_get', { d : params.callFrameId, n : params.expression }, function (res) {
            if (res.error) {
                // seen when hovering $GLOBALS
                callback({
                    result : {
                        type : 'object',
                        subtype : 'null',
                        value : null
                    }
                });

                return;
            }

            var compiled = inscom.doConvertProperty(res.property, '|lvl' + params.callFrameId + '|ctx0|');

            if (res.property.property) {
                compiled.subtype = 'null';
                compiled.preview = {
                    properties : [],
                    lossless : true,
                    overflow : true
                };

                (res.property.property[0] ? res.property.property : [res.property.property]).forEach(function (data, i) {
                    compiled.preview.properties.push(inscom.doConvertProperty3(data));
                });
            }

            callback({
                result : compiled
            });
        });
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

Debugger.prototype.setBreakpointByUrl = function (params, callback) {
    var callback = callback;

    this.session.backendSocket.sendMessage(
        'breakpoint_set',
        {
            t : 'line',
            f : params.url,
            n : params.lineNumber + 1
        },
        function (data) {
            callback({
                breakpointId : data.id.toString(),
                locations : [
                    {
                        scriptId : params.url,
                        lineNumber : params.lineNumber,
                        columnNumber : 0
                    }
                ]
            });
        }
    );
};

Debugger.prototype.removeBreakpoint = function (params, callback) {
    var callback = callback;

    this.session.backendSocket.sendMessage(
        'breakpoint_remove',
        {
            d : params.breakpointId.toString()
        },
        function () {
            callback();
        }
    );
};

Debugger.prototype.setPauseOnExceptions = function (params, callback) {
    callback();
};

Debugger.prototype.causesRecompilation = function (params, callback) {
    callback({
        result : false
    });
};

Debugger.prototype.supportsSeparateScriptCompilationAndExecution = function (params, callback) {
    callback({
        result : false
    });
};

Debugger.prototype.supportsNativeBreakpoints = function (params, callback) {
    callback({
        result : false
    });
};

Debugger.prototype.canSetScriptSource = function (params, callback) {
    callback({
        result : false
    });
};

Debugger.prototype.setOverlayMessage = function (params, callback) {
    callback();
};

module.exports = Debugger;
