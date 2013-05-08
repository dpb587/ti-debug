function dbgpConnect (idekey, multiple, callbackStatus, callbackEvent) {
    var detached = io.connect('/dbgp.io');
    detached
        .on(
            'connect',
            function () {
                if (callbackStatus) {
                    callbackStatus('Registering client&hellip;', 'alert');
                }
    
                detached.emit(
                    'proxyinit',
                    {
                        idekey : idekey,
                        m : multiple || false
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
            }
        )
        .on(
            'init',
            function (data) {
                if (callbackEvent) {
                    callbackEvent('Starting session for ' + data.backend.remote + ' (' + data.backend.header.init.engine['$t'] + '/' + data.backend.header.init.engine.version + ')');
                }
                
                // @debug open in current window
                if (multiple == true) {
                    var pop = window.open(
                        data.frontend.url,
                        '',
                        'status=0,toolbar=0,location=0,menubar=0,resizable=1,scrollbars=0,height=' + data.frontend.size.y + ',width=' + data.frontend.size.x
                    );
        
                    if (!pop || pop.closed) {
                        if (callbackStatus) {
                            callbackStatus('A popup blocker seems to be preventing debug sessions from starting.', 'error');
                        }
    
                        return;
                    }
        
                    pop.focus();
                } else {
                    window.focus();
                    window.location
                        = data.frontend.url
                        + ((-1 < data.frontend.url.indexOf('?')) ? '&' : '?')
                        + 'return_to=' + encodeURIComponent(window.location.pathname + window.location.search)
                    ;
    
                    return;
                }
            }
        )
        .on(
            'disconnect',
            function () {
                if (callbackEvent) {
                    callbackEvent('Disconnected from proxy server');
                }
    
                if (callbackStatus) {
                    callbackStatus('Disconnected. Trying to reconnect&hellip;', 'error');
                }

                io.close();
            }
        )
    ;
}
