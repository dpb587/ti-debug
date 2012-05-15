function Service() {
    
}

Service.prototype.__proto__ = require('events').EventEmitter.prototype;

Service.prototype.start = function () {
};

Service.prototype.registerWebService = function (web) {
    var that = this;

    web.get('/index.html', function (req, res) {
        res.send(
            '<form class="form-inline well" action="/v8/debug.html" method="GET">' +
                '<label for="v8-pid">Process ID</label> ' +
                '<input id="v8-pid" class="span2" name="pid" type="text" /> ' +
                '<button type="submit" class="btn btn-primary">Start Session &rarr;</button>' +
            '</form>' +
            '<p>' +
                'Initiate a debugging session on a local process running under the V8 engine. <em>This is currently a stub.</em>' +
            '</p>'
        );
    });
};

module.exports = Service;
