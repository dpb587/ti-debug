window.addEvent('domready', function () {
    var detached = io.connect('/dbgp.io');
    var alert = $('dbgp-status').getFirst();
    var log = $('dbgp-log').getFirst('table tbody');

    function appendLog(message) {
        var date = new Date();
        var tr = new Element('tr')
            .adopt(
                new Element(
                    'td',
                    {
                        text : date.getFullYear()
                            + '-' + (date.getMonth() < 9 ? '0' : '') + (date.getMonth() + 1)
                            + '-' + (date.getDate() < 10 ? '0' : '') + date.getDate()
                            + ' ' + (date.getHours() < 10 ? '0' : '') + date.getHours()
                            + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes()
                            + ':' + (date.getSeconds() < 10 ? '0' : '') + date.getSeconds(),
                        style : 'color:#999999;width:120px;'
                    }
                )
            )
            .adopt(
                new Element(
                    'td',
                    {
                        text : message
                    }
                )
            );

        tr.inject(log, 'top');
    }

    detached
        .on('connect', function () {
            alert
                .set('class', 'alert')
                .set('html', 'Registering client&hellip;')
            ;

            detached.emit(
                'proxyinit',
                {
                    idekey : $('dbgp-status').getAttribute('data-idekey')
                },
                function (data) {
                    appendLog('Connected to proxy server');

                    alert
                        .set('class', 'alert alert-success')
                        .set('html', 'Ready for debug connections to &quot;<strong>' + data + '</strong>&quot;.')
                    ;

                    document.title = 'dbgp (' + data + ') - ti-debug';
                }
            );
        })
        .on('init', function (data) {
            appendLog('Starting session for ' + data.remote + ' (' + data.header.init.engine['$t'] + '/' + data.header.init.engine.version + ')');
            
            // @debug open in current window
            window.location = './inspector/inspector.html?sid=' + data.sid; return;

            var pop = window.open(
                './inspector/inspector.html?sid=' + data.sid, 'dbgp-' + data.sid,
                'status=0,toolbar=0,location=0,menubar=0,resizable=1,scrollbars=0,height=594,width=960'
            );

            if (!pop || pop.closed) {
                alert
                    .set('class', 'alert alert-error')
                    .set('html', 'A popup blocker seems to be preventing debug sessions from starting.')
                ;

                return;
            }

            pop.focus();
        })
        .on('disconnect', function () {
            appendLog('Disconnected from proxy server');

            alert
                .set('class', 'alert alert-error')
                .set('html', 'Disconnected. Trying to reconnect&hellip;')
            ;
        })
    ;
});
