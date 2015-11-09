define([
], function () {
    'use strict';
    
    function factory (config) {
        var root;
        
        function attach(node) {
            root = node;
        }
        function run(params) {
            root.innerHTML = 'See, it works!';
        }
        
        return {
            attach: attach,
            run: run            
        };        
    }
    
    return {
        make: function (config) {
            return factory(config);
        }
    };
});