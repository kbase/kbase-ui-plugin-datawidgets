/*global define*/
/*jslint white:true,browser:true*/
define([
    'kb/widget/dataWdiget'
], function (DataWidget) {
    'use strict';
    
    function factory(config) {
        return DataWidget({
            runtime: config.runtime,
            on: {
                render: function () {
                    return 'Hi, I am a widget';
                }
            }
        });
    }
    
    return {
        make: factory
    };    
});