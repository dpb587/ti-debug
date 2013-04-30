window.addEvent('domready', function () {
    $$('div[data-url]').each(function (dom) {
        new Request.HTML({
            method : 'get',
            update : dom,
            url : dom.getAttribute('data-url'),
            onRequest : function () {
                dom.set('html', '<em>Loading&hellip;</em>');
            },
            onFailure : function () {
                dom.set('html', '<em>An error occurred.</em>');
            }
        }).get();
    });
});
