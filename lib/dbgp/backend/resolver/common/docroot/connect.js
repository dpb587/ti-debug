function dbgpConnect (idekey, multiple, callbackStatus, callbackEvent) {
    var detached = io.connect('/dbgp.io');
    detached
        .on('connect', function () {
            if (callbackStatus) {
                callbackStatus('Registering client&hellip;', 'alert');
            }

            detached.emit(
                'proxyinit',
                {
                    idekey : idekey,
                    m : multiple
                },
                function (data) {
                    if (callbackEvent) {
                        callbackEvent('Connected to proxy server');
                    }

                    if (callbackStatus) {
                        callbackStatus('Ready for debug connections to &quot;<strong>' + data + '</strong>&quot;.', 'success')
                    }
                }
            );
        })
        .on('init', function (data) {
            var desturl = '/inspector/inspector/?id=' + data.sid;

            if (callbackEvent) {
                callbackEvent('Starting session for ' + data.remote + ' (' + data.header.init.engine['$t'] + '/' + data.header.init.engine.version + ')');
            }
            
            // @debug open in current window
            if (multiple != '1') {
                window.location = desturl; return;
            } else {
                var pop = window.open(
                    desturl,
                    'dbgp-' + data.sid,
                    'status=0,toolbar=0,location=0,menubar=0,resizable=1,scrollbars=0,height=594,width=960'
                );
    
                if (!pop || pop.closed) {
                    if (callbackStatus) {
                        callbackStatus('A popup blocker seems to be preventing debug sessions from starting.', 'error');
                    }

                    return;
                }
    
                pop.focus();
            }
        })
        .on('disconnect', function () {
            if (callbackEvent) {
                callbackEvent('Disconnected from proxy server');
            }

            if (callbackStatus) {
                callbackStatus('Disconnected. Trying to reconnect&hellip;', 'error');
            }
        })
    ;
}
