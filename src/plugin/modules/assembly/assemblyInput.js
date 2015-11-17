/*global define*/
/*jslint white:true,browser:true*/
define([
    'kb/widget/bases/dataWidget'
], function (DataWidget) {
    'use strict';
    
    function factory(config) {
        
        return DataWidget.make({
            
        });
    }
    
    return {
        make: function (config) {
            return factory(config);
        }
    };
});