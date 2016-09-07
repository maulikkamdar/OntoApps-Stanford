function query() {
    jQuery("#scwidth").val(jQuery("#cy").width());
    jQuery("#scheight").val(jQuery("#cy").height());
    jQuery.ajax({
        url: '/phlegra/search',
        data: jQuery('#formPhlegra').serialize(),
        type: 'POST',
        success: function(response) {
            jQuery('#cy').html("");
            output = JSON.parse(response);
            console.log(output);
            visualize(output["nodes"], output["edges"])
        },
        error: function(error) {
            console.log(error);
        }
    });
}

function visualize(nodes, edges) {
    var cy = cytoscape({
      container: document.getElementById('cy'),
      layout: {
        name: 'preset',
        padding: 10
      },
      
      style: cytoscape.stylesheet()
        .selector('node')
          .css({
            'shape': 'data(shape)',
            'width': 'mapData(hsize, 10, 40, 30, 80)',
            'height': 'mapData(vsize, 10, 40, 30, 80)',
            'content': 'data(label)',
            'text-valign': 'center',
            'text-outline-width': 2,
            'text-outline-color': 'data(color)',
            'background-color': 'data(color)',
            'color': '#fff'
          })
        .selector('node.connectednodes')
          .css({
            'text-outline-color': '#FF0000',
            'border-width': 3,
            'border-color': '#FF0000',
          })
        .selector(':selected')
          .css({
            'border-width': 3,
            'border-color': '#333'
          })
        .selector('edge')
          .css({
            'curve-style': 'unbundled-bezier',
            'opacity': 0.5,
            'width': 'mapData(thickness, 10, 100, 2, 10)',
            'target-arrow-shape': 'triangle',
            'line-color': 'data(color)',
            'source-arrow-color': 'data(color)',
            'target-arrow-color': 'data(color)'
          })
        .selector('.faded')
          .css({
            'opacity': 0.25,
            'text-opacity': 0
          }),
      
      elements: {
        nodes: nodes,
        edges: edges
      },
      
      ready: function(){
        window.cy = this;
      }
    });

    cy.on('tap', 'node', function(e) {
        var node = e.cyTarget;
        var directlyConnected = node.neighborhood();
        directlyConnected.nodes().addClass('connectednodes');
        nonNodes = cy.elements().difference(directlyConnected)
        nonNodes.nodes().removeClass('connectednodes');
    });

    cy.on('tap', "edge", function(e) {
        var je = e.cyTarget;
        var connodes = je.connectedNodes();
        connodes.addClass('connectednodes');
        nonNodes = cy.elements().difference(connodes);
        nonNodes.nodes().removeClass('connectednodes');
    });

    //cy.off('tap');
    for (node in nodes) {
        cy.$("#" + nodes[node]["data"]["id"]).qtip({
          content: "<b>" + nodes[node]["content"]["name"] + "</b><br><i>" + nodes[node]["content"]["type"]+ "</i><br> " + nodes[node]["content"]["prov"],
          position: {
            my: 'top center',
            at: 'bottom center'
          },
          style: {
            classes: 'qtip-bootstrap',
            tip: {
              width: 16,
              height: 8
            }
          }
        });
    }
    for (edge in edges) {
        cy.$("#" + edges[edge]["data"]["id"]).qtip({
          content: edges[edge]["content"]["name"] + "<br>" + edges[edge]["content"]["prov"],
          position: {
            my: 'top center',
            at: 'bottom center'
          },
          style: {
            classes: 'qtip-bootstrap',
            tip: {
              width: 16,
              height: 8
            }
          }
        });
    }
}

jQuery('#btnCheck').click(function() {
    query();
});


//visualize(nodes, edges);
