var inscom = require('./_common');

function doLoadContexts(engine, level, callback) {
    var level = level;

    engine.send('context_names', { 'd' : level }, function (res) {
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

function doFreezeFrame(engine, browser, callback) {
    engine.send('stack_get', function (res) {
        var data = res.stack[0] ? res.stack : [res.stack];
        var compiled = [];
        var locked = data.length;

        data.forEach(function (data, i) {
            var data = data, i = i;

            browser.inspector.Debugger._mentionParsedScript(data.filename);

            doLoadContexts(engine, data.level, function (result) {
                compiled[i] = {
                    callFrameId : data.level,
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

function doHandleContinue(engine, browser, callback, data) {
    callback();

    if (data.status == 'break') {
        doFreezeFrame(this.engine, this.browser, function (res) {
            browser.send('Debugger.paused', { callFrames : res, reason : 'other' });
        });
    } else if (data.status == 'stopping') {
        engine.close();
    }
}


function Debugger(engine, browser)
{
    this.parsedScripts = {};
    this.engine = engine;
    this.browser = browser;
}

Debugger.prototype._mentionParsedScript = function (scriptId) {
    if (!this.parsedScripts[scriptId]) {
        this.parsedScripts[scriptId] = true;
        
        this.browser.send(
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
    this.engine.send('step_into', doHandleContinue.bind(this, this.engine, this.browser, callback));
};

Debugger.prototype.getScriptSource = function (params, callback) {
    var callback = callback;

    this.engine.send(
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
    this.engine.send('step_over', doHandleContinue.bind(this, this.engine, this.browser, callback));
};

Debugger.prototype.stepInto = function (params, callback) {
    this.engine.send('step_into', doHandleContinue.bind(this, this.engine, this.browser, callback));
};

Debugger.prototype.stepOut = function (params, callback) {
    this.engine.send('step_out', doHandleContinue.bind(this, this.engine, this.browser, callback));
};

Debugger.prototype.resume = function (params, callback) {
    this.engine.send('run', doHandleContinue.bind(this, this.engine, this.browser, callback));
};

Debugger.prototype.pause = function (params, callback) {
    this.engine.send('break', doHandleContinue.bind(this, this.engine, this.browser, callback));
};

Debugger.prototype.evaluateOnCallFrame = function (params, callback) {
    var callback = callback;

    if (params.objectGroup == 'console' || params.objectGroup == 'watch-group') {
        this.engine.send(
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

    this.engine.send(
        'breakpoint_set',
        {
            t : 'line',
            f : params.url,
            n : params.lineNumber + 1
        },
        function (data) {
            callback({
                breakpointId : data.id,
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

    this.engine.send(
        'breakpoint_remove',
        {
            d : params.breakpointId
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

module.exports = Debugger;
