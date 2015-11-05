/*global define*/
/*jslint white: true, browser: true*/
define([    
], function () {
    'use strict';
    
    function factory(config) {
        var root, container;
        function attach(node) {
            root = node;
            container = node.appendChild(document.createElement('div'));
        }
        function run(params) {
            container.innerHTML = 'Hello, I\'m a Panel';
        }
        function detach() {
            root.removeChild(container);
        }
        
        return {
            attach: attach,
            run: run,
            detach: detach
        };
    }
    
    return {
        make: function (config) {
            return factory(config);
        }
    };
});