var assert = require('assert');

var DataTypeHelper = require('../../../../../lib/dbgp/protocol/inspector/util/data_type_helper');
var xdebugData = require('./_data/xdebug');

function createGetBasicTypeTest(raw, expected) {
    return function (done) {
        assert.deepEqual(
            DataTypeHelper.getBasicType(raw),
            expected

        );

        done();
    };
}

function createGetPropertyPreviewTest(raw, expected) {
    return function (done) {
        assert.deepEqual(
            DataTypeHelper.getPropertyPreview(raw),
            expected

        );

        done();
    };
}

function createGetRemoteObjectTest(raw, expected) {
    return function (done) {
        assert.deepEqual(
            DataTypeHelper.getRemoteObject(raw, '|lvl0|'),
            expected

        );

        done();
    };
}

describe(
    'dbgp/protocol/inspector/util/data_type_helper',
    function () {
        describe(
            '#getBasicType',
            function () {
                it(
                    'converts array',
                    createGetBasicTypeTest(
                        xdebugData.basicFilledArrayValue,
                        {
                            type : 'object',
                            subtype : 'array'
                        }
                    )
                );

                it(
                    'converts boolean (false)',
                    createGetBasicTypeTest(
                        xdebugData.basicBooleanFalseValue,
                        {
                            type : 'boolean',
                            value : false
                        }
                    )
                );

                it(
                    'converts boolean (true)',
                    createGetBasicTypeTest(
                        xdebugData.basicBooleanTrueValue,
                        {
                            type : 'boolean',
                            value : true
                        }
                    )
                );

                it(
                    'converts float',
                    createGetBasicTypeTest(
                        xdebugData.basicFloatValue,
                        {
                            type : 'number',
                            value : 1368202805.1654
                        }
                    )
                );

                it(
                    'converts hash',
                    function () {
                        // unused by xdebug
                    }
                );

                it(
                    'converts int',
                    createGetBasicTypeTest(
                        xdebugData.basicIntValue,
                        {
                            type : 'number',
                            value : 1
                        }
                    )
                );

                it(
                    'converts null',
                    createGetBasicTypeTest(
                        xdebugData.basicNullValue,
                        {
                            type : 'object',
                            subtype : 'null'
                        }
                    )
                );

                it(
                    'converts object',
                    createGetBasicTypeTest(
                        xdebugData.basicObjectValue,
                        {
                            type : 'object'
                        }
                    )
                );

                it(
                    'converts resource',
                    createGetBasicTypeTest(
                        xdebugData.basicResourceValue,
                        {
                            type : 'object'
                        }
                    )
                );

                it(
                    'converts string (base64)',
                    createGetBasicTypeTest(
                        xdebugData.basicStringBase64Value,
                        {
                            type : 'string',
                            value : '/index.php'
                        }
                    )
                );

                it(
                    'converts undefined/uninitialized',
                    createGetBasicTypeTest(
                        xdebugData.basicUninitializedValue,
                        {
                            type : 'undefined'
                        }
                    )
                );

                it(
                    'fails on unexpected',
                    function (done) {
                        try {
                            DataTypeHelper.getBasicType(
                                {
                                    type : 'verystrange'
                                }
                            )
                        } catch (e) {
                            return done();
                        }

                        throw new Error('Expected exception was not thrown.');
                    }
                );
            }
        );

        describe(
            '#getPropertyPreview',
            function () {
                it(
                    'converts array',
                    createGetPropertyPreviewTest(
                        xdebugData.basicFilledArrayValue,
                        {
                            type: "object",
                            subtype: "array",
                            name: "$weekday",
                            value: "Array(2)"
                        }
                    )
                );

                it(
                    'converts boolean (false)',
                    createGetPropertyPreviewTest(
                        xdebugData.basicBooleanFalseValue,
                        {
                            type: "boolean",
                            value: false,
                            name: "$_wp_using_ext_object_cache"
                        }
                    )
                );

                it(
                    'converts boolean (true)',
                    createGetPropertyPreviewTest(
                        xdebugData.basicBooleanTrueValue,
                        {
                            type: "boolean",
                            value: true,
                            name: "editor-style"
                        }
                    )
                );

                it(
                    'converts float',
                    createGetPropertyPreviewTest(
                        xdebugData.basicFloatValue,
                        {
                            type: "number",
                            value: 1368202805.1654,
                            name: "$timestart"
                        }
                    )
                );

                it(
                    'converts hash',
                    function () {
                        // unused by xdebug
                    }
                );

                it(
                    'converts int',
                    createGetPropertyPreviewTest(
                        xdebugData.basicIntValue,
                        {
                            type: "number",
                            value: 1,
                            name: "$blog_id"
                        }
                    )
                );

                it(
                    'converts null',
                    createGetPropertyPreviewTest(
                        xdebugData.basicNullValue,
                        {
                            type: "object",
                            subtype: "null",
                            name: "$userdata",
                            value: "null"
                        }
                    )
                );

                it(
                    'converts object',
                    createGetPropertyPreviewTest(
                        xdebugData.basicObjectValue,
                        {
                            type: "object",
                            name: "$wp",
                            value: "WP"
                        }
                    )
                );

                it(
                    'converts resource',
                    createGetPropertyPreviewTest(
                        xdebugData.basicResourceValue,
                        {
                            type: "object",
                            name: "result",
                            value: "<Resource#undefined>"
                        }
                    )
                );

                it(
                    'converts string (base64)',
                    createGetPropertyPreviewTest(
                        xdebugData.basicStringBase64Value,
                        {
                            type: "string",
                            value: "/index.php",
                            name: "$PHP_SELF"
                        }
                    )
                );

                it(
                    'converts undefined/uninitialized',
                    createGetPropertyPreviewTest(
                        xdebugData.basicUninitializedValue,
                        {
                            type: "undefined",
                            name: "$wp_did_header"
                        }
                    )
                );
            }
        );

        describe(
            '#getRemoteObject',
            function () {
                it(
                    'converts array',
                    createGetRemoteObjectTest(
                        xdebugData.basicFilledArrayValue,
                        {
                            type: 'object',
                            subtype: 'array',
                            objectId: '|lvl0|$weekday@62703408',
                            description: 'Array(2)',
                            value: null,
                            preview: {
                                lossless: false,
                                overflow: false,
                                properties: [
                                    {
                                        type: 'string',
                                        value: 'Sunday',
                                        name: 0
                                    },
                                    {
                                        type: 'string',
                                        value: 'Monday',
                                        name: 1
                                    }
                                ]
                            }
                        }
                    )
                );

                it(
                    'converts boolean (false)',
                    createGetRemoteObjectTest(
                        xdebugData.basicBooleanFalseValue,
                        {
                            type: 'boolean',
                            value: false
                        }
                    )
                );

                it(
                    'converts boolean (true)',
                    createGetRemoteObjectTest(
                        xdebugData.basicBooleanTrueValue,
                        {
                            type: 'boolean',
                            value: true
                        }
                    )
                );

                it(
                    'converts float',
                    createGetRemoteObjectTest(
                        xdebugData.basicFloatValue,
                        {
                            type: 'number',
                            value: 1368202805.1654
                        }
                    )
                );

                it(
                    'converts hash',
                    function () {
                        // unused by xdebug
                    }
                );

                it(
                    'converts int',
                    createGetRemoteObjectTest(
                        xdebugData.basicIntValue,
                        {
                            type: 'number',
                            value: 1
                        }
                    )
                );

                it(
                    'converts null',
                    createGetRemoteObjectTest(
                        xdebugData.basicNullValue,
                        {
                            type: 'object',
                            subtype: 'null',
                            value: null
                        }
                    )
                );

                it(
                    'converts object',
                    createGetRemoteObjectTest(
                        xdebugData.basicObjectValue,
                        {
                            type: 'object',
                            className: 'WP',
                            objectId: '|lvl0|$wp@61600728',
                            description: 'WP',
                            value: null,
                            preview: {
                                lossless: false,
                                overflow: false,
                                properties: [
                                    {
                                        type: 'object',
                                        subtype: 'array',
                                        name: 'public_query_vars',
                                        value: 'Array(47)'
                                    },
                                    {
                                        type: 'object',
                                        subtype: 'array',
                                        name: 'private_query_vars',
                                        value: 'Array(21)'
                                    }
                                ]
                            }
                        }
                    )
                );

                it(
                    'converts resource',
                    createGetRemoteObjectTest(
                        xdebugData.basicResourceValue,
                        {
                            type: 'object',
                            objectId: '|lvl0|$wpdb->result',
                            description: '<Resource#undefined>',
                            value: null
                        }
                    )
                );

                it(
                    'converts string (base64)',
                    createGetRemoteObjectTest(
                        xdebugData.basicStringBase64Value,
                        {
                            type: 'string',
                            value: '/index.php'
                        }
                    )
                );

                it(
                    'converts undefined/uninitialized',
                    createGetRemoteObjectTest(
                        xdebugData.basicUninitializedValue,
                        {
                            type: 'undefined'
                        }
                    )
                );
            }
        );
    }
);
