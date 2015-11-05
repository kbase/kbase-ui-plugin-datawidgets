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
        function start(params) {
            
        }
        function run(params) {
            container.innerHTML = 'Hello, I\'m a Panel';
        }
        function detach() {
            root.removeChild(container);
        }
        function stop() {
            
        }
        
        return {
            attach: attach,
            start: start,
            run: run,
            stop: stop,
            detach: detach
        };
    }
    
    return {
        make: function (config) {
            return factory(config);
        }
    };
});