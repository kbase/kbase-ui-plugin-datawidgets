/*global define*/
/*jslint white:true,browser:true*/
define([
    'kb/widget/bases/dataWidget',
    'kb/service/client/workspace',
    'kb/service/utils',
    'kb/common/html'
], function (DataWidget, Workspace, serviceUtil, html) {
    'use strict';

    function factory(config) {

        /**
         * Utility function to build a table based on the given object.
         * 
         * @param {type} expressionSeriesObject
         * @returns {unresolved}
         */
        function buildOverviewTable(expressionSeriesObject) {
            var columns = ['Name', 'Workspace', 'KBID', 'Source', 'Genome', 'Type', 'Errors', 'Owner', 'Creation date'],
                genome = Object.keys(expressionSeriesObject.data.genome_expression_sample_ids_map)[0],
                rows = [[
                        expressionSeriesObject.workspaceInfo.name,
                        expressionSeriesObject.workspaceInfo.ws,
                        expressionSeriesObject.data.regulome_id,
                        genome,
                        expressionSeriesObject.data.type,
                        expressionSeriesObject.data.importErrors,
                        expressionSeriesObject.creator,
                        expressionSeriesObject.created
                    ]],
                content = html.makeTableRotated({
                    columns: columns,
                    rows: rows,
                    class: 'table table-striped table-bordered'
                });
            return content;
        }

        /**
         * Utility function to build a table based on the given set of sample ids.
         * 
         * @param {type} data
         * @returns {unresolved}
         */
        function buildExpressionSeriesTable(data) {
            var columns = ['Gene Expression Samples'],
                // Reformat to be reflect tabular structure.
                rows = data.map(function (datum) {
                    return [datum];
                }),
                content = html.makeTable({
                    columns: columns,
                    rows: rows,
                    class: 'table table-striped table-bordered'
                });
            return content;
        }

        /**
         * 
         * Build a bootstrap tabset, with content derived from the utility 
         * functions above.
         * Note that 
         * 
         * @param {type} widget
         * @returns {unresolved}
         */
        function buildTabset(widget) {
            var tabs = [
                {
                    id: html.genId(),
                    label: 'Overview',
                    content: buildOverviewTable(widget.get('data'))
                },
                {
                    id: html.genId(),
                    label: 'Expression Series',
                    content: buildExpressionSeriesTable(widget.get('sampleData'))
                }
            ];
            return html.makeTabs({
                tabs: tabs
            });
        }

        function doFetch(widget) {
            var workspace = new Workspace(widget.runtime.getConfig('services.workspace.url'), {
                token: widget.runtime.service('session').getAuthToken()
            }),
                params = widget.get('params'),
                // ref = '78/38/1'
                ref = params.workspaceId + '/' + params.objectId + '/' + params.objectVersion;
                
            return workspace.get_objects([{ref: ref}])
                .then(function (data) {
                    if (data.length === 1) {
                        var workspaceObject = data[0];
                        workspaceObject.workspaceInfo = serviceUtil.object_info_to_object(workspaceObject.info);
                        widget.set('data', workspaceObject);
                        return workspaceObject;
                    }
                    if (data.length === 0) {
                        throw new Error('Sorry, no object found');
                    }
                    if (data.length > 1) {
                        throw new Error('Too many data objects found: ' + data.length);
                    }
                })
                .then(function (workspaceObject) {
                    var genome = Object.keys(workspaceObject.data.genome_expression_sample_ids_map)[0],
                        series = workspaceObject.data.genome_expression_sample_ids_map[genome],
                        sampleRefs = series.map(function (sampleRef) {
                            return {ref: sampleRef};
                        });
                    return workspace.get_objects(sampleRefs);
                })
                .then(function (sampleData) {
                    // Munge the returned objects into a list of lists
                    var data = sampleData.map(function (dataObject) {
                        return dataObject.data.id;
                    });
                    widget.set('sampleData', data);
                })
                .then(function () {
                    widget.set('ready', true);
                });
        }

        return DataWidget.make({
            runtime: config.runtime,
            title: 'Expression Series Widget',
            on: {
                initialContent: function () {
                    return html.loading('Loading...');
                },
                fetch: function () {
                    return doFetch(this);
                },
                render: function () {
                    if (this.get('ready')) {
                        return buildTabset(this);
                    }
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