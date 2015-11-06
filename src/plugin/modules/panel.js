/*global define*/
/*jslint white: true, browser: true*/
define([
    'kb_common_widgetSet'
], function (WidgetSet) {
    'use strict';
    
    function factory(config) {
        var root, container, runtime = config.runtime,
            widgetSet = WidgetSet.make({runtime: runtime});
        
        function init(config) {
            return widgetSet.init(config);
        }
        
        function attach(node) {
            root = node;
            container = node.appendChild(document.createElement('div'));
            return widgetSet.attach(container);
        }
        function start(params) {
            return widgetSet.start(params);
        }
        function run(params) {
            container.innerHTML = 'Hello, I\'m a Panel';
            return widgetSet.run(params);
        }
        function stop() {
            return widgetSet.stop();
        }
        function detach() {
            root.removeChild(container);
            return widgetSet.detach();
        }
        function destroy() {
            return widgetSet.destroy();
        }
        
        return Object.freeze({
            init: init,
            attach: attach,
            start: start,
            run: run,
            stop: stop,
            detach: detach,
            destroy: destroy
        });
    }
    
    return {
        make: function (config) {
            return factory(config);
        }
    };
});