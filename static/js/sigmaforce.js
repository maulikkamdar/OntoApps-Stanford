var clusterLocator = [], linkColors = [];
var count = 0, linkCount = 0, clusterCount = 0;
var colorPalette = ["#FDD9B5", "#1F75FE", "#FF2B2B", "#00ff00", "#FB7EFD", "#FFCF48", "#00ffff", "#8b8989"]; //biscuit, blue, red, green, pink, yellow, light blue, grey
var popUp;

function initVisualization(transformedNodes, transformedLinks, container, origin, clusterDesc, linkDesc) {
  // Instanciate sigma.js and customize it :
  	//console.log(transformedNodes);
  	console.log(transformedLinks);
	var sigInst = sigma.init(document.getElementById(container)).drawingProperties({
		"borderSize": 1,//Something other than 0
        "nodeBorderColor": "default",//exactly like this
        "defaultNodeBorderColor": "#000",//Any color of your choice
        "defaultBorderView": "always",//apply the default color to all nodes always (normal+hover)
		"defaultEdgeType": 'curve',
        "defaultEdgeArrow": 'target',
		"labelThreshold": 6,
		"minEdgeSize": 4,
		"maxEdgeSize": 10,
		"defaultLabelColor": '#000'		
	});
 
	var i, N = transformedNodes.length, E = transformedLinks.length, C = 5, d = 0.5, clusters = [];
	for(i = 0; i < clusterDesc.length; i++){
		clusters.push({
			'id': 'C'+i,
			'nodes': [],
			'color': colorPalette[i]
		});
	}
	
	for (m in clusterDesc) {
		clusterLocator[clusterDesc[m]] = m
	}

	for (m in linkDesc) {
		linkColors[linkDesc[m]] = colorPalette[m]
	}

	console.log(clusters);
	console.log(clusterLocator["search"])

	for(i = 0; i < N; i++){
		var size = transformedNodes[i].size;
        //console.log(transformedNodes[i].cluster);
		var cluster = clusters[clusterLocator[transformedNodes[i].type]];
        //var cluster = clusters[0]
		sigInst.addNode(i, {
			'x': Math.random(),
			'y': Math.random(),
			'size': size,
			'color': cluster['color'],
			'cluster': cluster['id'],
			'label': transformedNodes[i].name,
			'attributes': transformedNodes[i].descriptors
		});
		cluster.nodes.push(i);
	}
 
	for(i = 0; i < E; i++){
		sigInst.addEdge(i, transformedLinks[i].source, transformedLinks[i].target, 
				{'size': transformedLinks[i].width*2, 'color': (typeof linkColors[transformedLinks[i].type] === "undefined" ?  "#000": linkColors[transformedLinks[i].type])});
	}
 
  // Start the ForceAtlas2 algorithm
  // (requires "sigma.forceatlas2.js" to be included)
	sigInst.startForceAtlas2();
 
	setTimeout(function(){
		sigInst.stopForceAtlas2();
		sigInst
		.bind('overnodes',function(event){
			var nodes = event.content;
			console.log(event);
		    var neighbors = {};
		    sigInst.iterEdges(function(e){
		    	if(nodes.indexOf(e.source)>=0 || nodes.indexOf(e.target)>=0){
		    		neighbors[e.source] = 1;
		    		neighbors[e.target] = 1;
		    	}
		    }).iterNodes(function(n){
		    	if(!neighbors[n.id]){
		    		n.hidden = 1;
		    	}else{
		    		n.hidden = 0;
		    	}
		    	if (n.id == nodes[0])
		    		n.hidden = 0;   	
		    }).draw(2,2,2);
		})
		.bind('outnodes',function(){
			sigInst.iterEdges(function(e){
				e.hidden = 0;
		    }).iterNodes(function(n){
		    	n.hidden = 0;
		    }).draw(2,2,2);
		});
		/*.bind('downnodes',function(event){
			var node;
			sigInst.iterNodes(function(n){
				node = n;
			},[event.content[0]]);
			clearCanvas();
			click(node["label"]);
		});*/
		sigInst.bind('overnodes',showNodeInfo).bind('outnodes',hideNodeInfo).draw();
		
		function hideNodeInfo(event) {
			popUp && popUp.remove();
		      popUp = false;
		}
		
		function showNodeInfo(event) {
		    popUp && popUp.remove();

		    var node;
		    sigInst.iterNodes(function(n){
		      node = n;
		    },[event.content[0]]);
		    
		 
		    var text = node['attributes'];
		    console.log(text);
		    popUp = $(
		            '<div class="node-info-popup"></div>'
		          ).append(
		            text
		          ).attr(
		            'id',
		            'node-info'+sigInst.getID()
		          ).css({
		            'display': 'inline-block',
		    		'width' : '400px',
		   			'overflow' : 'hidden',
		            'border-radius': 3,
		            'padding': 15,
		            'background-color': 'rgba(000,000,000,0.8)',
		            'color': '#fff',
		            'box-shadow': '0 0 4px #666',
		            'position': 'absolute',
		            'left': node.displayX,
		            'top': node.displayY+25
		          });

		          $('ul',popUp).css('margin','0 0 0 20px');

		          $('#' + container).append(popUp);
		}
	},5000);
}

function updateInterface(entityId){
	clearCanvas();
	click(entityId);
}

function allUpdate(){
	clearCanvas();
	initVisualization(extractedNodes, extractedLinks);
}

function clearCanvas(container){
	$("#" + container).remove();
	$("#" + container + "-parent").append('<div id="' +container+'" class="sigmaViz"></div>');
	$("#" + container).html('');
}
//init();
