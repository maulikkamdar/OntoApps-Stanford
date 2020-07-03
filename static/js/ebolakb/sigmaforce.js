var extractedNodes = [],
    extractedLinks = [];
var nodeLocator = [],
    linkLocator = [],
    clusterLocator = [];
var count = 0,
    linkCount = 0,
    clusterCount = 0;
var colorPalette = ["#FDD9B5", "#1F75FE", "#FF2B2B", "#76FF7A", "#FB7EFD", "#FFCF48"];
var popUp;
var nodecounter = 0,
    linkCounter = 0;

function restore() {
    clearCanvas();
    extractedNodes = []
    extractedLinks = [];
    count = 0;
    linkCount = 0;
    nodeLocator = [];
}

function createGenericNetwork(data, resourceId, resourceType, resourceLabel) {
    //console.log(data)
    restore();

    if (resourceType == "protein")
        url = "http://bio2rdf.org/genbank" + resourceId;
    else if (resourceType == "domain")
        url = "http://bio2rdf.org/" + resourceId.toLowerCase();
    else
        url = "http://bio2rdf.org/" + resourceId;
    var mainNode = {
        "id": count,
        "type": resourceType,
        "name": resourceLabel,
        "label": resourceId,
        "children": [],
        "description": resourceLabel,
        "size": 100,
        "url": url,
        "cluster": "C2"
    };
    extractedNodes.push(mainNode);
    var mainSource = count;
    nodeLocator[url] = count++;

    // console.log(data);
    for (i in data) {
        var identifer = data[i][2].substring(1, data[i][2].length - 1);
        var name = data[i][0].substring(1, data[i][0].length - 1);
        var coUrl = 'http://bio2rdf.org/pubmed:' + identifer;
        var node = {
            "id": count,
            "type": "PubMedRecord",
            "name": name,
            "label": identifer,
            "children": [],
            "description": name,
            "size": 10,
            "url": coUrl,
            "cluster": "C1"
        };
        extractedNodes.push(node);
        var link = {
            "id": linkCount++,
            "source": mainSource,
            "target": count,
            "value": 1,
            "color": "#000"
        };
        extractedLinks.push(link);
        mainNode.children.push(node);
        nodeLocator[coUrl] = count++;
    }

    initVisualization(extractedNodes, extractedLinks);
}

function createSpecNetwork(data, resourceId, resourceLabel) {
    restore();
    var mainNode = {
        "id": count,
        "type": "PubMedRecord",
        "name": resourceLabel,
        "label": resourceId,
        "children": [],
        "description": resourceLabel,
        "size": 100,
        "url": url,
        "cluster": "C2"
    };
    extractedNodes.push(mainNode);
    var mainSource = count;
    nodeLocator[url] = count++;

    for (i in data) {
        mesh = data[i][0].substring(1, data[i][0].length - 1)
        var meshUri = 'http://bio2rdf.org/meshTerm:' + mesh.toLowerCase();
        var pubmedUri = data[i][1];
        var identifierParts = pubmedUri.split(/[:#\/]/);
        var pubide = identifierParts[identifierParts.length - 1];
        pubide = pubide.substring(0, pubide.length - 1)
        if (nodeLocator[pubmedUri] != null)
            pubmedLoc = nodeLocator[pubmedUri]
        else {
            var name = data[i][2]
            name = name.substring(1, name.length - 1)
            var node = {
                "id": count,
                "type": "PubMedRecord",
                "name": name,
                "label": pubide,
                "children": [],
                "description": name,
                "size": 10,
                "url": pubmedUri,
                "cluster": "C1"
            };
            extractedNodes.push(node);
            pubmedLoc = count;
            nodeLocator[pubmedUri] = count++;
        }
        if (nodeLocator[meshUri] != null)
            meshLoc = nodeLocator[meshUri]
        else {
            var node = {
                "id": count,
                "type": "MeshTerm",
                "name": mesh,
                "label": mesh,
                "children": [],
                "description": mesh,
                "size": 20,
                "url": meshUri,
                "cluster": "C0"
            };
            extractedNodes.push(node);
            meshLoc = count;
            var link = {
                "id": linkCount++,
                "source": mainSource,
                "target": meshLoc,
                "value": 1,
                "color": "#000"
            };
            extractedLinks.push(link);
            nodeLocator[meshUri] = count++;
        }
        var link = {
            "id": linkCount++,
            "source": meshLoc,
            "target": pubmedLoc,
            "value": 1,
            "color": "#000"
        };
        extractedLinks.push(link);

    }
    initVisualization(extractedNodes, extractedLinks);
}

function initVisualization(transformedNodes, transformedLinks) {
    // Instanciate sigma.js and customize it :

    var sigInst = sigma.init(document.getElementById('sigmaViz')).drawingProperties({
        "borderSize": 1, //Something other than 0
        "nodeBorderColor": "default", //exactly like this
        "defaultNodeBorderColor": "#000", //Any color of your choice
        "defaultBorderView": "always", //apply the default color to all nodes always (normal+hover)
        "defaultEdgeType": 'curve',
        "labelThreshold": 7,
        "minEdgeSize": 1,
        "maxEdgeSize": 3,
        "defaultLabelColor": '#000'
    });

    var i, N = transformedNodes.length,
        E = transformedLinks.length,
        C = 5,
        d = 0.5,
        clusters = [];
    for (i = 0; i < 5; i++) {
        clusters.push({
            'id': 'C' + i,
            'nodes': [],
            'color': colorPalette[i]
        });
    }

    for (i = 0; i < N; i++) {
        var size = (Math.sqrt(transformedNodes[i].size));
        var cluster = clusters[transformedNodes[i].cluster.substring(1, transformedNodes[i].cluster.length)];
        sigInst.addNode(transformedNodes[i].id, {
            'x': Math.random(),
            'y': Math.random(),
            'size': size,
            'color': cluster['color'],
            'cluster': cluster['id'],
            'label': transformedNodes[i].label,
            'attributes': transformedNodes[i].description
        });
        cluster.nodes.push(transformedNodes[i].id);
    }

    for (i = 0; i < E; i++) {
        sigInst.addEdge(transformedLinks[i].id, transformedLinks[i].source, transformedLinks[i].target, {
            'size': transformedLinks[i].value,
            'color': transformedLinks[i].color
        });
    }

    // Start the ForceAtlas2 algorithm
    // (requires "sigma.forceatlas2.js" to be included)
    sigInst.startForceAtlas2();

    setTimeout(function() {
        sigInst.stopForceAtlas2();
        sigInst
            .bind('overnodes', function(event) {
                var nodes = event.content;
                //console.log(event);
                var neighbors = {};
                sigInst.iterEdges(function(e) {
                    if (nodes.indexOf(e.source) >= 0 || nodes.indexOf(e.target) >= 0) {
                        neighbors[e.source] = 1;
                        neighbors[e.target] = 1;
                    }
                }).iterNodes(function(n) {
                    if (!neighbors[n.id]) {
                        n.hidden = 1;
                    } else {
                        n.hidden = 0;
                    }
                    if (n.id == nodes[0])
                        n.hidden = 0;
                }).draw(2, 2, 2);
            })
            .bind('outnodes', function() {
                sigInst.iterEdges(function(e) {
                    e.hidden = 0;
                }).iterNodes(function(n) {
                    n.hidden = 0;
                }).draw(2, 2, 2);
            })
            .bind('downnodes', function(event) {
                var node;
                sigInst.iterNodes(function(n) {
                    node = n;
                }, [event.content[0]]);
                click(node['label']);
            });
        sigInst.bind('overnodes', showNodeInfo).bind('outnodes', hideNodeInfo).draw();

        function hideNodeInfo(event) {
            popUp && popUp.remove();
            popUp = false;
        }

        function showNodeInfo(event) {
            popUp && popUp.remove();

            var node;
            sigInst.iterNodes(function(n) {
                node = n;
            }, [event.content[0]]);

            // console.log( node);
            var text = "<b>" + node.label + "</b><br>" + node['attributes'];

            popUp = jQuery(
                '<div class="node-info-popup"></div>'
            ).append(
                text
            ).attr(
                'id',
                'node-info' + sigInst.getID()
            ).css({
                'display': 'inline-block',
                'width': '300px',
                'overflow': 'hidden',
                'border-radius': 3,
                'padding': 15,
                'background-color': 'rgba(000,000,000,0.8)',
                'color': '#fff',
                'box-shadow': '0 0 4px #666',
                'position': 'absolute',
                'left': node.displayX,
                'top': node.displayY + 25
            });

            jQuery('ul', popUp).css('margin', '0 0 0 20px');

            jQuery('#sigmaViz').append(popUp);
        }
    }, 5000);
}

function click(attr) {
    if (isInt(attr)) {
        openTab('<http://bio2rdf.org/pubmed:' + attr + '>', attr, "publications");
    }

}

function updateInterface(entityId) {
    clearCanvas();
    click(entityId);
}

function allUpdate() {
    clearCanvas();
    initVisualization(extractedNodes, extractedLinks);
}

function clearCanvas() {
    jQuery('#sigmaViz').remove();
    jQuery("#sigmaViz-parent").append('<div id="sigmaViz" class="sigmaViz"></div>');
    jQuery('#sigmaViz').html('');
}
//init();