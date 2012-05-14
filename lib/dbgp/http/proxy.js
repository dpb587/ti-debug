window.addEvent('domready', function () {
    var detached = io.connect('/dbgp.io');
    var alert = $('dbgp-status').getFirst();
    var log = $('dbgp-log').getFirst();

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
                    alert
                        .set('class', 'alert alert-success')
                        .set('html', 'Listening for debug connections to &quot;<strong>' + data + '</strong>&quot;.')
                    ;
                }
            );
        })
        .on('init', function (data) {
            log.adopt(
                new Element(
                    'li',
                    {
                        'html' : 'Session initiated from <code>' + data.remote + '</code>'
                    }
                )
            );
    
            window.open(
                './inspector/inspector.html?sid=' + data.sid, 'dbgp-' + data.sid,
                'status=0,toolbar=0,location=0,menubar=0,resizable=1,scrollbars=0,height=594,width=960'
            );
        })
        .on('disconnect', function () {
            alert
                .set('class', 'alert alert-error')
                .set('html', 'Disconnected. Trying to reconnect&hellip;')
            ;
        })
    ;
});
