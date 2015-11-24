/*global define*/
/*jslint white: true*/
define([
    'bluebird',
    'uuid',
    'kb/common/html',
    'kb_service_workspace',
    'kb_service_userAndJobState',
    'kb_dataview_easyTree',
    'kb_service_utils',
    'kb/widget/bases/dataWidget'
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
                fetch: function () {
                    var workspaceClient = new Workspace(this.runtime.getConfig('services.workspace.url'), {
                        token: this.runtime.service('session').getAuthToken()
                    }),
                        ujsClient = new UserAndJobState(this.runtime.getConfig('services.ujs.url'), {
                            token: this.runtime.service('session').getAuthToken()
                        }),
                        ref = makeObjectRef(this.get('params')),
                        // these thread through and are build in the data api calls.
                        refList = [],
                        refToInfoMap = {};
                    
                    this.setTitle(html.loading('Loading Tree Data ...'));

                    return workspaceClient.get_objects([{ref: ref}])
                        .then(function (data) {
                            if (data.length === 1) {
                                return data[0].data;
                            } else {
                                throw new Error('Invalid results');
                            }
                        })
                        .then(function (tree) {
                            // Build a list of references, then fetch the object info for them ...
                            if (tree.ws_refs) {
                                refList = Object.keys(tree.ws_refs).map(function (key) {
                                    return {ref: tree.ws_refs[key].g[0]};
                                });
                            }
                            return [tree, workspaceClient.get_object_info_new({objects: refList})];
                        })
                        .spread(function (tree, objectInfoList) {
                            // ... and then map them by their original ref.
                            var i;
                            for (i = 0; i < objectInfoList.length; i += 1) {
                                refToInfoMap[refList[i].ref] = serviceUtils.object_info_to_object(objectInfoList[i]);
                            }

                            this.set('data', {
                                tree: tree,
                                refToInfoMap: refToInfoMap,
                            });

                        }.bind(this));
                },
                /*
                 * as soon as possible, which should be right after attachment, 
                 * place this layout markup. Any specific places, which are nodes
                 * with ids, may be returned in the places property, and later
                 * accessed as getPlace('place').
                 * 
                 * Note: this is WITHIN the widget native layout.
                 */
                layout: function (container) {
                    var containerId = html.genId(),
                        canvasId = html.genId(),
                        div = html.tag('div'),
                        canvas = html.tag('canvas'),
                        layout = div({id: containerId}, [
                            canvas({id: canvasId, style: {maxHeight: (config.height || defaultHeight) - 85, overflow: 'scroll'}})
                        ]);
                    return {
                        content: layout,
                        places: {
                            canvas: {
                                id: canvasId
                            }
                        }
                    };
                },
                render: function () {
                    var data = this.get('data'),
                        canvas = this.getPlace('canvas');
                    if (!data) {
                        return;
                    }
                    this.setTitle('Tree Data View');
                    new EasyTree(canvas.id, data.tree.tree, data.tree.default_node_labels,
                        function (node) {
                            if ((!data.tree.ws_refs || (!data.tree.ws_refs[node.id]))) {
                                var nodeName = data.tree.default_node_labels[node.id],
                                    url;
                                if (nodeName.indexOf('/') > 0) {
                                    url = '#genes/' + this.get('params').workspaceId + '/' + nodeName;
                                    console.log('URL1');
                                    console.log(url);
                                }
                                return;
                            }
                            var ref = data.tree.ws_refs[node.id].g[0],
                                objectInfo = data.refToInfoMap[ref];
                            if (objectInfo) {
                                // Either way works...
                                // url = '#dataview/' + objectInfo.wsid + '/' + objectInfo.id;
                                url = '#dataview/' + objectInfo.ws + '/' + objectInfo.name;
                                window.open(url, '_blank');
                            }
                        },
                        function (node) {
                            if (node.id && node.id.indexOf('user') === 0) {
                                return '#0000ff';
                            }
                            return null;
                        });
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