/*global define*/
/*jslint white:true,browser:true*/
define([
    'bluebird',
    'kb/common/html',
    'plugins/datawidgets/modules/objectIdentity',
    './data',
    './view',
    './error'
], function (Promise, html, objectIdentity, dataWidgetFactory, viewWidgetFactory, errorWidgetFactory) {
    'use strict';

    function factory(config) {
        var runtime = config.runtime,
            root, container,
            data = dataWidgetFactory.make(config),
            view = viewWidgetFactory.make(config),
            error;

        function attach(node) {
            root = node;
            container = root.appendChild(document.createElement('div'));
            view.setup(container);
        }

        function start(params) {
            /// TODO: should params be explicitly rewritten here to ensure
            // proper form as input to the sub-widget?
            data.start(params);
            view.start(params);
        }

        function run(params) {
            /*
             * The data fetch method takes a single object argument which 
             * should implement the following top level properties:
             * config - follows the same structure as the global site config
             *   object, but only exposes the properties required by this
             *   data object
             *   
             * authorization - any authorization needed, at present just the
             *   token object
             * 
             * params - the actual input consumed by the data object. Must be
             *   a specific defined object. For instance, the objectRef object 
             *   consists of 
             *   workspace - string - workspace id or name
             *   object - string - object id or name
             *   objectVersion - object version number
             *   
             *   (or make it the same as the workspace's object identifier object?)
             */
            var objectRef = objectIdentity.makeObjectRef(params.workspaceId, params.objectId, params.objectVersion);
            return data.fetch({
                config: {
                    services: {
                        workspace: {
                            url: runtime.getConfig('services.workspace.url')
                        }
                    }
                },
                authorization: {
                    token: runtime.service('session').getAuthToken()
                },
                objectRef: objectRef
            })
                .then(function (data) {
                    return view.update(data);
                });
//                .catch(function (err) {
//                    // TODO: bulletproof error display here!!!!
//                    error = errorWidgetFactory.make(config);
//                    console.log('ERROR widget');
//                    console.log(error);
//                    container.innerHTML = '';
//                    Promise.try(function () {
//                        return error.setup(container);
//                    })
//                        .then(function () {
//                            return error.start({});
//                        })
//                        .then(function () {
//                            return error.update({
//                                title: 'Error Rendering Widget',
//                                message: 'There was a problem with this widget.',
//                                error: err
//                            });
//                        })
//                        .catch(function (err2) {
//                            container.innerHTML = html.makePanel({
//                                title: 'Error',
//                                content: 'Error rendering the error widget'
//                            });
//                            console.log('ERROR!');
//                            console.log('Error rendering the error widget');
//                            console.log(err2);
//                            console.log(err);
//                        })
//                });
        }

        function stop() {
            view.stop();
            if (error) {
                error.stop();
            }
            data.stop();
        }

        function detach() {
            view.teardown();
            if (error) {
                error.teardown();
            }
            root.removeChild(container);
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