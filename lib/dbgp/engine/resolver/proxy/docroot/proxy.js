window.addEvent(
    'domready',
    function () {
        var alert = $('dbgp-status').getFirst();
        var log = $('dbgp-log').getFirst('table tbody');
    
        function updateEvent(message) {
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
    
        function updateStatus(message, style) {
            alert.set('class', 'alert' + (style ? (' alert-' + style) : '')).set('html', message);
        }
    
        dbgpConnect(
            $('dbgp-status').getAttribute('data-idekey'),
            $('dbgp-status').getAttribute('data-multiple'),
            updateStatus,
            updateEvent
        );
    }
);
