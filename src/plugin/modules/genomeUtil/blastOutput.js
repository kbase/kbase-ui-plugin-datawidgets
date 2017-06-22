define([
    'jquery',
    'd3',
    'kb_common/html',
    'kb_service/client/workspace',
    'kb_widget/legacy/kbaseTabs',
    '../objectIdentity',

    'datatables_bootstrap'

], function (
    $,
    d3,
    html,
    Workspace,
    kbaseTabs,
    objectIdentity
) {
    var t = html.tag,
        div = t('div');

    function factory(config) {
        var hostNode, container;
        var runtime = config.runtime;

        // RENDERING

        function renderError(err) {
            console.error('ERROR', err);
            container.innerHTML = div({
                class: 'alert alert-danger'
            }, err.message);
        }

        function renderMessage(message) {
            container.innerHTML = div({
                class: 'alert alert-info'
            }, message);
        }

        //tabData is used to create tabs later on in the output widget
        var tabDef = {
            names: ['Overview', 'Hits', 'Graphical Alignment', 'Sequence Alignment'],
            ids: ['overview', 'contigs', 'genes', 'alignments']
        };

        function renderOverviewTab(data, pref) {
            var parameters = data.BlastOutput_param.Parameters;
            var db = data.BlastOutput_db;
            var query_info = data.BlastOutput_iterations.Iteration[0]['Iteration_query-def'];
            var hits = data.BlastOutput_iterations.Iteration[0].Iteration_hits.Hit;

            // Place the table in the DOM
            $('#' + pref + 'overview').append('<table class="table table-striped table-bordered" style="margin-left: auto; margin-right: auto;" id="' + pref + 'overview-table"/>');

            var overviewLabels = ['Input Sequence ids', 'Input Genome id(s)', 'Total number of hits'];
            var overviewData = [query_info, db, hits.length];

            // Now we populate it
            var overviewTable = $('#' + pref + 'overview-table');
            for (var i = 0; i < overviewData.length; i++) {
                overviewTable.append('<tr><td>' + overviewLabels[i] + '</td><td>' + overviewData[i] + '</td></tr>');
            }

            for (var key in parameters) {
                overviewTable.append('<tr><td>' + key + '</td><td>' + parameters[key] + '</td></tr>');
            }

            return overviewTable;
        }

        function renderHitsTab(data, pref) {
            $('#' + pref + 'contigs').append('<table class="table table-striped table-bordered" style="margin-left: auto; margin-right: auto;" id="' + pref + 'contigs-table"/>');

            var formatEvalue = function (value) {
                if (value.includes('e')) {
                    var val = value.split('e');
                    return parseInt(val[0]) + 'e' + val[1];
                } else if (value !== '0') {
                    return parseFloat(value).toFixed(4);
                } else {
                    return value;
                }
            };
            var genesData = [];

            var hits = data.BlastOutput_iterations.Iteration[0].Iteration_hits.Hit;
            var query_len = parseInt(data.BlastOutput_iterations.Iteration[0]['Iteration_query-len']);
            hits.forEach(function (d) {
                var hit_id = d['Hit_id'];
                var hit_def = d['Hit_def'];
                var hit_len = d['Hit_len'];

                var hsps = d['Hit_hsps'].Hsp;
                var hsp = hsps[0];

                var evalue = hsp['Hsp_evalue'];
                var identity = hsp['Hsp_identity'];
                var align_len = hsp['Hsp_align-len'];
                var query_to = hsp['Hsp_query-to'];
                var query_from = hsp['Hsp_query-from'];
                var hit_to = hsp['Hsp_hit-to'];
                var hit_from = hsp['Hsp_hit-from'];
                var bit_score = hsp['Hsp_bit-score'];

                genesData.push({
                    gene_id: hit_id,
                    evalue: formatEvalue(evalue),
                    gene_annotation: hit_def,
                    identity: Math.round(identity / align_len * 100) + '%',
                    query_cov: Math.round((Math.abs(query_to - query_from) + 1) / query_len * 100) + '%',
                    subject_cov: Math.round((Math.abs(hit_to - hit_from) + 1) / hit_len * 100) + '%',
                    score: bit_score
                });
            });

            function geneEvents() {
                //   $('.'+pref+'gene-click').unbind('click');
                //  $('.'+pref+'gene-click').click(function() {
                //get geneID and pass it to the next step
                //    var geneId = [$(this).data('geneid')];
                // showGene(geneId);
                //});
            }

            var genesSettings = {
                'sPaginationType': 'full_numbers',
                'iDisplayLength': 10,
                'aaSorting': [
                    [5, 'desc'],
                    [1, 'asc']
                ],
                'aoColumns': [
                    { sTitle: 'GeneID', mData: 'gene_id' },
                    { sTitle: 'E Value', mData: 'evalue' },
                    { sTitle: 'Identity', mData: 'identity' },
                    { sTitle: 'Query cover', mData: 'query_cov' },
                    { sTitle: 'Subject cover', mData: 'subject_cov' },
                    { sTitle: 'Score', mData: 'score' },
                    { sTitle: 'Function', mData: 'gene_annotation' }
                ],
                'aaData': [],
                'oLanguage': {
                    'sSearch': 'Search Hits:',
                    'sEmptyTable': 'No Hits found.'
                },
                'fnDrawCallback': geneEvents
            };
            var contigsDiv = $('#' + pref + 'contigs-table').dataTable(genesSettings);
            contigsDiv.fnAddData(genesData);
        }

        function renderGraphicalAlignmentTab(data, pref) {
            var gethitcolor = function (n) {
                n = Number(n);
                var color = '#000000';
                if (n < 40) {
                    color = '#000000';
                }
                if (n >= 40 && n < 50) {
                    color = '#0000FF';
                }
                if (n >= 50 && n < 80) {
                    color = '#66FF66';
                }
                if (n >= 80 && n < 200) {
                    color = '#FF3399';
                }
                if (n >= 200) {
                    color = '#FF0000';
                }
                return (color);

            };

            var id = pref + 'genes';
            var genesDivdata = document.getElementById(id);

            var dataForGraphics = function (Hit) {
                var formatted_hits = [{}];
                Hit.forEach(function (oneHit, idx) {
                    oneHit['Hit_hsps']['Hsp'].forEach(function (hsp) {

                        var begin = hsp['Hsp_query-from'];
                        var end = hsp['Hsp_query-to'];

                        if (begin > end) {
                            var tmp = begin;
                            begin = end;
                            end = tmp;
                        }
                        formatted_hits.push({
                            'begin': begin,
                            'seqlength': (end - begin),
                            'rownumber': idx,
                            'bitscore': hsp['Hsp_bit-score'],
                            'id': oneHit['Hit_id']
                        });

                    });
                });
                return (formatted_hits);

            };

            var querylength = data.BlastOutput_iterations.Iteration[0]['Iteration_query-len'];
            var hits = data.BlastOutput_iterations.Iteration[0].Iteration_hits.Hit;

            //set up svg display for graphics alignment
            var margin = { top: 0, right: 0, bottom: 0, left: 10 },
                width = 540 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

            var padding = margin.left + margin.right;

            var scaley = margin.top + 20;
            var rect1 = margin.top + 10;
            var fullscalelength = (10 - Number(querylength) % 10) + Number(querylength);

            var x = d3.scale.linear()
                .domain([0, querylength])
                .range([0, width - 30]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient('bottom');
            var svg = d3.select(genesDivdata).append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g')
                .attr('transform', 'translate(' + 10 + ',' + margin.top + ')');

            svg.append('rect')
                .attr('x', 0)
                .attr('fill', 'green')
                .attr('y', 0)
                .attr('width', x(querylength))
                .attr('height', 6)
                .attr('transform', 'translate(' + 10 + ',' + margin.top + ')');

            //Prepare data to use with d3

            var formattedhits = dataForGraphics(hits);

            //display svg

            svg.selectAll('rect')
                .data(formattedhits)
                .enter()
                .append('rect')
                .attr('fill', function (d) {
                    return (gethitcolor(d.bitscore));
                })
                .attr('y', function (d) {
                    return (d.rownumber * 7)
                })
                .attr('x', function (d) {
                    return x(d.begin);
                })
                .attr('width', function (d) {
                    return x(d.seqlength);
                })
                .attr('height', function () {
                    return 4;
                })
                .attr('transform', 'translate(' + 10 + ',' + 30 + ')');

            svg.append('g')
                .attr('class', 'axis') //Assign "axis" class
                .attr('transform', 'translate(' + 10 + ',' + 10 + ')')
                .call(xAxis);
        }

        function renderSequenceAlignmentTab(data, pref) {
            function paddingx(n) {
                var z = ' ';
                n = n + '';
                var width = 8;
                return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
            }

            //formatter for hits

            function formatter(d, al) {
                var accession = d['Hit_accession'];
                var hit_def = d['Hit_def'];
                var hit_len = d['Hit_len'];
                var hsps = d['Hit_hsps'].Hsp;
                var num_matches = hsps.length;

                var str = '<div STYLE="font-family: monospace;  white-space: pre;">';
                str += '</br><hr>' + 'Sequence ID:' + accession + '</br>';
                str += 'Hit_def:' + hit_def + '</br>' + 'Length:' + hit_len + ' ';
                str += 'Number of matches:' + num_matches + '<hr>';
                al.append(str);

                hsps.forEach(function (hsp, counter) {
                    var match_number = counter + 1;
                    var align_len = hsp['Hsp_align-len'];
                    var bit_score = hsp['Hsp_bit-score'];
                    var evalue = hsp['Hsp_evalue'];
                    var gaps = hsp['Hsp_gaps'];
                    var hit_frame = hsp['Hsp_hit-frame'];
                    var hit_from = hsp['Hsp_hit-from'];
                    var hit_to = hsp['Hsp_hit-to'];
                    var hseq = hsp['Hsp_hseq'];
                    var identity = hsp['Hsp_identity'];
                    var midline = hsp['Hsp_midline'];
                    var num = hsp['Hsp_num'];
                    var positive = hsp['Hsp_positive'];
                    var qseq = hsp['Hsp_qseq'];
                    var query_frame = hsp['Hsp_query-frame'];
                    var query_from = hsp['Hsp_query-from'];
                    var query_to = hsp['Hsp_query-to'];
                    var score = hsp['Hsp_score'];

                    if (gaps == null) {
                        gaps = 0;
                    }

                    var empty_space = new Array(10).join(' ');

                    var pctid = (Number(identity) / Number(align_len)) * 100;
                    var pctpositive = (Number(positive) / Number(align_len)) * 100;
                    var pctgap = (Number(gaps) / Number(align_len)) * 100;

                    var str = '<div STYLE="font-family: monospace;  white-space: pre;">';
                    str += '</br>' + 'Range ' + match_number + ': ' + hit_from + ' to ' + hit_to + '</br>';
                    str += 'Score = ' + bit_score + '(' + score + '), ' + 'Expect = ' + evalue + '</br>';
                    str += 'Identities = ' + identity + '/' + align_len + '(' + Math.round(pctid) + '%), ';
                    str += 'Positives = ' + positive + '/' + align_len + '(' + Math.round(pctpositive) + '%), ';
                    str += 'Gaps = ' + gaps + '/' + align_len + '(' + Math.round(pctgap) + ')';
                    if (query_frame || hit_frame) {
                        str += ', Frame = ';
                        (query_frame) ? str += query_frame: '';
                        (query_frame && hit_frame) ? str += '/': '';
                        (hit_frame) ? str += hit_frame: '';
                    }
                    str += '</br></br>';
                    al.append(str);

                    var q_start = 0;
                    var q_end = 0;
                    var h_start = 0;
                    var h_end = 0;

                    var i = 0;
                    while (i < hseq.length) {
                        var start = i;
                        var end = i + 60;
                        var p1 = hseq.substring(start, end);
                        var p2 = midline.substring(start, end);
                        var p3 = qseq.substring(start, end);

                        if (i == 0) {
                            q_start = Number(query_from);
                            h_start = Number(hit_from);
                        } else {
                            h_start = h_end + 1;
                            q_start = q_end + 1;
                        }

                        var c1 = p1.replace(/-/g, '');
                        var c3 = p3.replace(/-/g, '');

                        q_end = q_start + c3.length - 1;
                        h_end = h_start + c1.length - 1;

                        var alnstr = '<div STYLE="font-family: monospace;  white-space: pre;">';
                        alnstr += paddingx(q_start) + ' ' + p3 + ' ' + q_end + '</br>';
                        alnstr += empty_space + p2 + '</br>';
                        alnstr += paddingx(h_start) + ' ' + p1 + ' ' + h_end + '</br>';
                        alnstr += '</font></div></br>';
                        al.append(alnstr);
                        i = end;
                    }

                });
            }

            //text alignment tab and use of formatter function to add to the content of the tab

            var al = $('#' + pref + 'alignments');
            var hits = data.BlastOutput_iterations.Iteration[0].Iteration_hits.Hit;
            hits.forEach(function (hit) {
                formatter(hit, al);
            });

        }

        function render(data) {
            var pref = html.genId();
            var $container = $(container);
            $container.empty();
            var tabPane = $('<div id="' + pref + 'tab-content">');
            $container.append(tabPane);

            // can't use new-style yet...
            //var tabWidget = new kbaseTabs(tabPane, { canDelete: true, tabs: [] });
            tabPane.kbaseTabs({
                canDelete: true,
                tabs: []
            });

            var tabNames = tabDef.names;
            var tabIds = tabDef.ids;

            tabIds.forEach(function (tabId, i) {
                var tabDiv = $('<div id="' + pref + tabId + '"> ');
                tabPane.kbaseTabs('addTab', {
                    tab: tabNames[i],
                    content: tabDiv,
                    canDelete: false,
                    show: (i == 0)
                });
            });

            renderOverviewTab(data, pref);

            renderHitsTab(data, pref);

            renderGraphicalAlignmentTab(data, pref);

            renderSequenceAlignmentTab(data, pref);
        }

        // LIFECYCLE API

        function attach(node) {
            hostNode = node;
            container = hostNode.appendChild(document.createElement('div'));
        }

        function start(params) {
            var workspaceClient = new Workspace(runtime.config('services.workspace.url'), {
                token: runtime.service('session').getAuthToken()
            });
            var objectRef = objectIdentity.makeObjectRef(params.workspaceId, params.objectId, params.objectVersion);

            return workspaceClient.get_objects([{
                    ref: objectRef
                }])
                .then(function (result) {
                    // console.log('GOT', result);
                    render(result[0].data);
                })
                .catch(function (err) {
                    renderError(err);
                });

            // container.innerHTML = 'started... ' + objectRef;
        }

        function stop() {

        }

        function detach() {
            if (hostNode && container) {
                hostNode.removeChild(container);
            }
        }

        return {
            attach: attach,
            start: start,
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