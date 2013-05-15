module.exports.createMockService = function (service) {
    return new service(
        // ti-debug
        {},
        // app
        {
            io : {
                on : function () {}
            },
            get : function () {}
        },
        // options
        {},
        // logger
        null
    );
};
