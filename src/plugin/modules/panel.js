/*global define*/
/*jslint white: true, browser: true*/
define([
    'kb_widget_widgetSet',
    'kb_common_html',
    'bootstrap'
], function (WidgetSet, html) {
    'use strict';
    
    function factory(config) {
        var root, container, runtime = config.runtime,
            widgetSet = WidgetSet.make({runtime: runtime});
        
        // Widget Implementation
        
        function render() {
            var div = html.tag('div'),
                p = html.tag('p');
            return div({class: 'container-fluid'}, [
                p('Hi, I am still a panel, but becoming more sophisticated!'),
                p('Below you can find the widgets'),
                div({class: 'row'}, [
                    div({class: 'col-md-3', id: widgetSet.makeWidget('kb_datawidgets_widget')}),
                    div({class: 'col-md-3'}, 'Sorry, nothing here yet'),
                    div({class: 'col-md-3'}, 'Sorry, nothing here yet')                    
                ])
            ]);
        }
        
        // Widget Interface
        
        function init(config) {
            return widgetSet.init(config);
        }
        
        function attach(node) {
            root = node;
            container = node.appendChild(document.createElement('div'));
            container.innerHTML = render();
            return widgetSet.attach(container);
        }
        function start(params) {
            return widgetSet.start(params);
        }
        function run(params) {
            runtime.send('ui', 'setTitle', 'Hi, I am the data widgets plugin');
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