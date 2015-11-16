/*global define*/
/*jslint white: true*/
define([
    'bluebird',
    'uuid',
    'kb_common_html',
    'kb_service_workspace',
    'kb_service_userAndJobState',
    'kb_dataview_easyTree',
    'kb_service_utils',
    'kb/widget/bases/dataWidget',
], function (Promise, uuid, html, Workspace, UserAndJobState, EasyTree, serviceUtils, DataWidget) {
    'use strict';

    function makeObjectRef(obj) {
        return serviceUtils.makeWorkspaceObjectRef(obj.workspaceId, obj.objectId, obj.objectVersion);
    }


    function factory(config) {
        var defaultWidth = 1045,
            defaultHeight = 600;
        return DataWidget.make({
            runtime: config.runtime,
            title: 'Tree Data View',
            on: {
                initialContent: function () {
                    return html.loading('Loading tree...');
                },
                fetch: function () {
                    var workspaceClient = new Workspace(this.runtime.getConfig('services.workspace.url'), {
                        token: this.runtime.service('session').getAuthToken()
                    }),
                        ujsClient = new UserAndJobState(this.runtime.getConfig('services.ujs.url'), {
                            token: this.runtime.service('session').getAuthToken()
                        }),
                        ref = makeObjectRef(this.get('params')),
                        // these thread through and are build in the data api calls.
                        treeObject,
                        refList = [],
                        refToInfoMap = {};

                    return workspaceClient.get_objects([{ref: ref}])
                        .then(function (data) {
                            if (data.length === 1) {
                                treeObject = data[0];
                                treeObject.objectInfo = serviceUtils.object_info_to_object(treeObject.info);
                                return treeObject;
                            } else {
                                throw new Error('Invalid results');
                            }
                        })
                        .then(function (data) {
                                var treeRef = makeObjectRef({
                                    workspaceId: data.objectInfo.wsid,
                                    objectId: data.objectInfo.id,
                                    objectVersion: data.objectInfo.version
                                }),
                                tree = data.tree;
                            if (tree.ws_refs) {
                                refList = Object.keys(tree.ws_refs).map(function (key) {
                                    return {ref: tree.ws_refs[key].g[0]};
                                });
                            }
                            return workspaceClient.get_object_info_new({objects: refList});
                        })
                        .then(function (objectInfoList) {
                            var i;
                            for (i = 0; i < objectInfoList.length; i += 1) {
                                refToInfoMap[refList[i].ref] = objectInfoList[i];
                            }
                            
                            this.set('data', {
                                tree: treeObject,
                                refList: refList,
                                refToInfoMap: refToInfoMap,
                            });                            
                        })
                },
                attach: function (container) {
                    var containerId = html.genId(),
                        canvasId = html.getId(),
                        div = html.tag('div'),
                        canvas = html.tag('canvas'),
                        layout = div({id: containerId}, [
                            canvas({id: canvasId, style: {maxHeight: (config.height || defaultHeight) - 85, overflow: 'scroll'}})
                        ]);
                    container.innerHTML = layout;
                },
                render: function () {
                    var data = this.get('data');
                    return 'Wow, I finall got all that!, e.g.: ' + data.tree.objectInfo.id;
                   
                }
            }
        });
    }

    return {
        make: function (config) {
            return factory(config);
        }
    };
});