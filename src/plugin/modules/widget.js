/*global define*/
/*jslint white:true,browser:true*/
define([
    'kb/widget/bases/dataWidget'
], function (DataWidget) {
    'use strict';
    
    function factory(config) {
        return DataWidget.make({
            runtime: config.runtime,
            on: {
                render: function () {
                    return 'Hi, I am a widget';
                }
            }
        });
    }
    
    return {
        make: function (config) {
            var x = factory(config);
            return x;
        }
    };    
});