/*global define*/
/*jslint white:true,browser:true*/
define([
    'kb/widget/bases/dataWdiget'
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
            console.log('RETURNING');
            console.log(x);
            return x;
        }
    };    
});