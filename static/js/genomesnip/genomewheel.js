var ui = {
    stage: null,
    scale: 1,
    zoomFactor: 1.1,
    origin: {
        x: 0,
        y: 0
    },
    /*zoom: function(event) {
        event.preventDefault();
        var evt = event.originalEvent,
            mx = evt.clientX,
            my = evt.clientY,
            wheel = evt.wheelDelta / 120;
        var zoom = (ui.zoomFactor - (evt.wheelDelta < 0 ? 0.2 : 0));
        var newscale = ui.scale * zoom;
        ui.origin.x = mx / ui.scale + ui.origin.x - mx / newscale;
        ui.origin.y = my / ui.scale + ui.origin.y - my / newscale;

        ui.stage.setOffset(ui.origin.x, ui.origin.y);
        ui.stage.setScale(newscale);
        ui.stage.draw();

        ui.scale *= zoom;
    }*/
};

var stage = ui.stage = new Kinetic.Stage({
	container: 'offsetDiv',
	width: window.innerWidth - 100,
	height: window.innerWidth - 100, // window.innerHeight - 200
	draggable: true
});

var genomeLayer = new Kinetic.Layer();

var chromosomeLayer = new Kinetic.Group();

var pubConLayer = new Kinetic.Group();
var comGroup = new Kinetic.Group()
var diseaseConLayer = new Kinetic.Group();
var pathwayConLayer = new Kinetic.Group();
var chromConLayer = new Kinetic.Group();
var ideoConLayer = new Kinetic.Group();

var enhPromGroup = new Kinetic.Group();
var enhPromConnectorGroup = new Kinetic.Group();
var communityConnectorGroup = new Kinetic.Group();
var enhPromEdgeGroup = new Kinetic.Group();
var totalConEnhProms = 0, doneConEnhProms = 0;
var repEnhProms = [], isComSet = false, isComActive = 0;

var width = window.innerWidth - 100;
var height = window.innerWidth - 100;  // window.innerHeight - 200
var center = {"x": width/2, "y" : height/2};
var trackNum = 0;
// var minDimension = ((window.innerWidth - 100) > (window.innerHeight - 200)) ? (window.innerHeight - 200) : (window.innerWidth - 100);
var minDimension = width;

var genomeOuterRadius = (minDimension*0.95)/2;
var genomeInnerRadius = (minDimension*0.75)/2;
var ideoGramOuterRadius = (minDimension*0.93)/2;
var geneOuterRadius = (minDimension*0.80)/2;
var baseMarkerSpace = 10000000;
var comDimension = 0;
var communityRadius = genomeInnerRadius;

var genomeRendered = false;
var lookUpTable = [];
lookUpTable["acen"] = {"color" : "#0000ff", "opacity": 1};
lookUpTable["gneg"] = {"color" : "#ffffff", "opacity": 1};
lookUpTable["gpos25"] = {"color" : "#000000", "opacity": 0.25};
lookUpTable["gpos50"] = {"color" : "#000000", "opacity": 0.5};
lookUpTable["gpos75"] = {"color" : "#000000", "opacity": 0.75};
lookUpTable["gpos100"] = {"color" : "#000000", "opacity": 1};
lookUpTable["gvar"] = {"color": "#cccccc", "opacity": 1};
var sliceAngle = Math.PI/90;
var baseAngle;

var renderedConnections = []; // Is there a cleaner way to remember chord angles?

var geneInfoBlob = new Kinetic.Text({
    x: 0,
    y: 0,
    text: 'GENE - \n\nEnsembl ID: \nBiotype: \nDescription: \nSource: \nChromosome: \nStart-Stop: \nLength:',
    fontSize: 16,
    fontFamily: 'Calibri',
    fill: '#555',
    width: 300,
    padding: 10,
    opacity: 0
});

var geneInfoBlobBox = new Kinetic.Rect({
    x: 0,
    y: 0,
    stroke: '#555',
    strokeWidth: 1,
    fill: '#ddd',
    width: 300,
    height: geneInfoBlob.getHeight(),
    shadowColor: 'black',
    shadowBlur: 4,
    shadowOffset: [3, 3],
    opacity: 0,
    cornerRadius: 3
});

var legendGroup = plotLegend();

var chromConInfoBlob = new Kinetic.Text({
    x: 0,
    y: 0,
    text: "",
    fontSize: 16,
    fontFamily: 'Calibri',
    fill: '#555',
    width: 400,
    padding: 10,
    opacity: 0
});

var chromConInfoBlobBox = new Kinetic.Rect({
    x: 0,
    y: 0,
    stroke: '#555',
    strokeWidth: 1,
    fill: '#ddd',
    width: 400,
    height: chromConInfoBlob.getHeight(),
    shadowColor: 'black',
    shadowBlur: 4,
    shadowOffset: [3, 3],
    opacity: 0,
    cornerRadius: 3
});


var ideoBlocker = new Kinetic.Shape();
var geneBlocker = new Kinetic.Shape();
var ideogramBorderFill = new Kinetic.Shape();
var geneSeqArc = new Kinetic.Shape();
var geneSeqText = new Kinetic.Group();

genomeLayer.add(geneInfoBlobBox);
genomeLayer.add(geneInfoBlob);
genomeLayer.add(legendGroup);

genomeLayer.add(chromConInfoBlobBox);
genomeLayer.add(chromConInfoBlob);

function plotCommunities(dimension){
	console.log("plottingCommunities");
	dimension = (typeof(dimension) === "undefined") ? 1.8*genomeInnerRadius: dimension;
	if (comDimension != dimension) {
		comDimension = dimension;
		var color = d3.scale.quantize()
	    .range(["#156b87", "#876315", "#543510", "#872815"]);

		var pack = d3.layout.pack()
	    .sort(null)
	    .size([dimension, dimension])
	    .value(function(d) { return d.length * d.length; })
	    .padding(5);

	    comGroup.destroy();
	    
	    color.domain(d3.extent(communities, function(d) { return d.length; }));
	    comPos = pack.nodes({children: communities}).slice(1);
	    //console.log(comPos);
	    offset = (1 - dimension/minDimension)*minDimension/2
	    for (k in comPos) {
	    	var comCirc = new Kinetic.Circle({
	    		x: comPos[k]["x"]+offset,
	    		y: comPos[k]["y"]+offset,
	    		id: comPos[k]["id"],
	    		radius: comPos[k]["r"],
	    		fill: color(comPos[k]["r"]),
	    		opacity: 0.1,
	    		stroke: "#000",
	    		shadowColor: 'black',
			    shadowBlur: 4,
			    shadowOffset: [3, 3],
	    	});

	    	
	    	//comCirc.setZIndex(20);
	    	comCirc.on('click', function(evt) {
	    		document.body.style.cursor = 'pointer';
				var community = evt.targetNode;
				var communityId = community.getId();
				if (isComSet && isComActive == communityId) {
					communityConnectorGroup.destroy();
					isComActive = 0;
					isComSet = false;
				} else {
					communityConnectorGroup.destroy();
					communityConnectors = []
					currentCommunity = communities[communityLocator[communityId]];
					isComSet = true;
					isComActive = communityId;
					for (m in currentCommunity["nodes"]) {
						edgeNode = currentCommunity["nodes"][m];
						if (repEnhProms.indexOf(edgeNode) == -1) {
							var loc = enhPromIdLocator["enhprom"+edgeNode];
							var conChromosome = chromosomes[loc.split("_")[0]].chromosome;
							if (typeof communityConnectors[conChromosome] === "undefined")
								communityConnectors[conChromosome] = 1;
							else
								communityConnectors[conChromosome]++;
						}
					}
					for (chr in communityConnectors) {
						//var enhProm = conChromosome["enhproms"][loc.split("_")[2]];
						//var pointer = (enhProm.start + enhProm.stop)/2;
						//var enhPromAngle = conChromosome.startAngle + pointer*(conChromosome.endAngle - conChromosome.startAngle)/conChromosome.length;
						var conChromosome = chromosomes[chr];
						var chrMidAngle = (conChromosome.endAngle + conChromosome.startAngle)/2;
						var point3 = {"x": center.x + communityRadius*Math.cos(chrMidAngle), "y": center.y + communityRadius*Math.sin(chrMidAngle)};
						var point1 = {"x":community.getAbsolutePosition().x, "y": community.getAbsolutePosition().y}
						var point2 = {"x": (center.x + 2*(point1.x + point3.x)/2)/3, "y": (center.y + 2*(point1.y + point3.y)/2)/3};
						var chordPoints = [];
						chordPoints.push(point1);
						chordPoints.push(point2);
						chordPoints.push(point3);
						var subCord = new Kinetic.Spline({
							points: chordPoints,
							tension: 0.5,
							stroke: "#000",
							strokeWidth: Math.log(communityConnectors[chr])*2,
							opacity: 0.5
						});
						communityConnectorGroup.add(subCord)
					}
					
					genomeLayer.add(communityConnectorGroup);
					genomeLayer.draw()
				}
	    		
			});
	    	comGroup.add(comCirc);
	    	/*if(comPos[k]["r"] > 50) {
	    		//console.log(comPos[k]);
	    	
	    		var comText = new Kinetic.Text({
				    text: comPos[k]["id"],
				    fontSize: 24,
				    x: comPos[k]["x"] + offset,
				    y: comPos[k]["y"] + offset,
				    fontFamily: 'Calibri',
				    width: 150,
				    fill: '#000',
				    opacity: 1
				});
				//comText.setZIndex(100);
	    		comGroup.add(comText);
	    	}*/
	    }
	    //console.log(comGroup.children)
	    genomeLayer.add(comGroup);
	    genomeLayer.draw()
	} else {
		for (k = 0; k < comGroup.children.length; k++) {
			comCirc = comGroup.children[k];
			comCirc.setOpacity(0.1);
			//comCirc.setZIndex(20);
		}
	}
}

function drawChromosomeLayer() {
	baseAngle = (2*Math.PI - totalChromosomes*sliceAngle)/genomeLength;
	var markerAngle = baseMarkerSpace*baseAngle;
	var count = 0;
	var endAngle = 0;
	var onAngle = sliceAngle/2 - Math.PI/2;
	for(i in chromosomes) {
		( function() {
			var currentAngle = onAngle, onIdeAngle = onAngle;
			var endAngle = currentAngle + chromosomes[i].length*baseAngle;
			
			//Merging two steps - Setting and Rendering Angles to remove an extra for loop
			chromosomes[i].startAngle = currentAngle;
			chromosomes[i].endAngle = endAngle;
			
			var totalMarkerCount = Math.floor(chromosomes[i].length/baseMarkerSpace);
			onAngle = endAngle + sliceAngle;
			
			var chromosomeName = i;
			
			var chromosomeGroup = new Kinetic.Group({
				id: chromosomeName
			})
			
			var chromosomeBackFill = getArc(currentAngle, endAngle,genomeInnerRadius, genomeOuterRadius, "#ffffff", 1, chromosomeName+"_back", chromosomeName);
			chromosomeGroup.add(chromosomeBackFill);
			
			var chromosomeBorderFill = getArcOutline(currentAngle, endAngle,genomeInnerRadius, genomeOuterRadius, 
					totalMarkerCount, markerAngle, chromosomeName+"_border", chromosomeName, 1);
			chromosomeGroup.add(chromosomeBorderFill);
			
			// Adding Ideograms to the ChromosomeLayer
			var ideograms = chromosomes[i].ideograms;
			var ideogramLayer = drawAuxiliaryLayers(ideograms, "ideo", onIdeAngle, endAngle-currentAngle, 
					chromosomes[i].length, chromosomeName, genomeInnerRadius, ideoGramOuterRadius);
			chromosomeGroup.add(ideogramLayer);
			
			// Adding Genes to the ChromosomeLayer
			var genes = chromosomes[i].genes;
			var geneticLayer = drawAuxiliaryLayers(genes, "gene", onIdeAngle, endAngle-currentAngle, 
					chromosomes[i].length, chromosomeName, genomeInnerRadius, geneOuterRadius);
			geneticLayer.setVisible(false);
			chromosomeGroup.add(geneticLayer);
			
			chromosomeLayer.add(chromosomeGroup);
			
			// ---- Event Binding Callbacks 
			chromosomeGroup.on('mouseover', function(evt){
				document.body.style.cursor = 'pointer';
				
				var chromosomalArc = evt.targetNode;
				var targetNodeType = chromosomalArc.getId().split("_")[1].substring(0,4);
				var targetNodeId = chromosomalArc.getId().split("_")[1].substring(4);
				if(targetNodeType == "gene") {
					var representedGene = chromosomes[this.getId()].genes[targetNodeId];
					var geneText = "GENE - " + representedGene.externalName + "\n\nEnsembl ID: " + representedGene.ensemblId+ 
					"\nBiotype: Protein Coding"+"\nDescription: " + representedGene.description + "\nSource: " + representedGene.source + 
					"\nChromosome: " + representedGene.chromosome.substring(3)+ "\nStart-Stop: " + representedGene.start +"-"+representedGene.stop + 
					"\nLength: " + (representedGene.stop - representedGene.start);
					
					geneInfoBlobBox.setAbsolutePosition(evt.x, evt.y);
					geneInfoBlobBox.setOpacity(1);
					geneInfoBlobBox.setZIndex(10);			
					geneInfoBlob.setText(geneText);
					geneInfoBlob.setAbsolutePosition(evt.x, evt.y);
					geneInfoBlob.setOpacity(1);
					geneInfoBlob.setZIndex(10);
					geneInfoBlobBox.setHeight(geneInfoBlob.getHeight());
					genomeLayer.draw(); 
				}
			});
			
			chromosomeGroup.on('mouseout', function(evt){
				document.body.style.cursor = 'default';
				geneInfoBlobBox.setAbsolutePosition(0,0);
				geneInfoBlobBox.setOpacity(0);
				
				geneInfoBlob.setAbsolutePosition(0,0);
				geneInfoBlob.setOpacity(0);
				genomeLayer.draw(); 
			});
			
			chromosomeGroup.on('click', function(evt) {
				var chromosomalArc = evt.targetNode;
				var targetNodeType = chromosomalArc.getId().split("_")[1].substring(0,4);
				var targetNodeId = chromosomalArc.getId().split("_")[1].substring(4);
				var repInnerRadius, repOuterRadius, newInnerRadius, newOuterRadius, 
					ideoLayerInnerRadius, ideoLayerOuterRadius, geneLayerInnerRadius, geneLayerOuterRadius;
				if(targetNodeType == "gene") {
					repInnerRadius = 0.925*genomeInnerRadius;
					repOuterRadius = 0.925*genomeInnerRadius + 0.5*(genomeOuterRadius-genomeInnerRadius);
					newInnerRadius = 0.7*genomeInnerRadius;
					newOuterRadius = 0.8*genomeInnerRadius;
					ideoLayerInnerRadius = 0.9*genomeOuterRadius;
					ideoLayerOuterRadius = 0.95*genomeOuterRadius;
					geneLayerInnerRadius = 0.98*genomeOuterRadius;
					geneLayerOuterRadius = genomeOuterRadius;
					communityRadius = newInnerRadius;
					var targetGeneId = targetNodeId;
					var clickedChromIdeos = chromosomes[chromosomalArc.getId().split("_")[0]].ideograms;
					var clickedChromGene = chromosomes[chromosomalArc.getId().split("_")[0]].genes[targetGeneId];
					
					// Get Gene Sequence and store it in the Local Storage (Is there a better way??) 
					// - Too expensive even for a 1mm thick gene on a 180 degree arc and useless to visualize 
					// getGeneSequence(species, chromosomalArc.getId().split("_")[0].substring(3), clickedChromGene.start, clickedChromGene.stop, clickedChromGene.externalName);
					
					getGeneMutation(species, clickedChromGene.externalName);
				//	getGeneSNP(species, clickedChromGene.externalName); (Too expensive)
					
					for(i in clickedChromIdeos){
						if((clickedChromIdeos[i].start < clickedChromGene.start) && (clickedChromIdeos[i].stop > clickedChromGene.stop)) {
							targetNodeId = i; 
							break;
						} else if (clickedChromIdeos[i].stop > clickedChromGene.start) {
							var next = parseInt(i)+1;
							if((clickedChromIdeos[i].stop - clickedChromGene.start) > (clickedChromGene.stop - clickedChromIdeos[next].start))
								targetNodeId = i;
							else
								targetNodeId = next;
							break;
						} 
					}
				} else if(targetNodeType == "ideo"){
					repInnerRadius = 0.925*genomeInnerRadius;
					repOuterRadius = 0.925*genomeInnerRadius + 0.5*(genomeOuterRadius-genomeInnerRadius);
					newInnerRadius = 0.7*genomeInnerRadius;
					newOuterRadius = 0.8*genomeInnerRadius;
					ideoLayerInnerRadius = 0.95*genomeOuterRadius;
					ideoLayerOuterRadius = genomeOuterRadius;
					plotCommunities(1.8*0.65*genomeInnerRadius);
					communityRadius = newInnerRadius;
				} else {
					repInnerRadius = genomeInnerRadius;
					repOuterRadius = genomeOuterRadius;
					newInnerRadius = 0.7*genomeInnerRadius;
					newOuterRadius = 0.8*genomeInnerRadius;
					plotCommunities(1.8*0.65*genomeInnerRadius);
					communityRadius = newInnerRadius;
				}
			
				jQuery(".splashScreenExplorer").show();
				chromConLayer.destroy();
				diseaseConLayer.destroy();
				pathwayConLayer.destroy();
				pubConLayer.destroy();
				communityConnectorGroup.destroy();

				storage.setItem("highlighted", chromosomalArc.getId());
				var intRegex = /^\d+$/;
				for(i in chromosomeLayer.children){
					if(intRegex.test(i)) {
						var representedChromosome = chromosomes[chromosomeLayer.children[i].getId()];
						var chromosomalArcCenter = (representedChromosome.startAngle + representedChromosome.endAngle)/2;
						
						if(chromosomeLayer.children[i].getId() == chromosomalArc.getId().split("_")[0]) {
							ideoBlocker.destroy();
							geneBlocker.destroy();
							ideogramBorderFill.destroy();
							geneSeqArc.destroy();
							geneSeqText.destroy();
							ideoConLayer.destroy();
							enhPromGroup.destroy();
							enhPromConnectorGroup.destroy();
							enhPromEdgeGroup.destroy();
							var ideoArcCenter = chromosomalArcCenter;
							var representedGroup = chromosomeLayer.children[i];
							chromosomeLayer.children[i].children[3].setVisible(true); // too thin gene lines to be set true
							updateChromosomalLayer(chromosomeLayer.children[i], repInnerRadius, repOuterRadius, 
									chromosomalArcCenter-Math.PI/2, chromosomalArcCenter+Math.PI/2, 1000000);
							
						/*	getIdeoConMap(representedChromosome.chromosome);
							var ideoChrom = representedChromosome;
							var ideoConTrigger = setInterval(function(){
								if(ideoReceived){
									drawIdeoConLayer(ideoChrom, newInnerRadius, newOuterRadius, repInnerRadius, ideoArcCenter);
									clearInterval(ideoConTrigger);
								}
							},10);*/
							
							if(targetNodeType == "ideo" || targetNodeType == "gene" ){
								var ideogramLayer = representedGroup.children[2];
								var geneticLayer = representedGroup.children[3];
								var chromosomalIde = ideogramLayer.children[targetNodeId];
								var conIdeogram = representedChromosome.ideograms[chromosomalIde.getId().split("_")[1].substring(4)];
								
								chromosomalIde.setDrawFunc(function(context){	
									var conEndAngle = ideoArcCenter + Math.PI/2;
									var conStartAngle = ideoArcCenter - Math.PI/2;
									drawingFunction(context, this, ideoLayerInnerRadius, ideoLayerOuterRadius, 
											conStartAngle, conEndAngle);
								});
								
								var selectedChromosome = representedChromosome;
								
								for(k in geneticLayer.children){
									if(intRegex.test(k)){
										var chromosomalGene = geneticLayer.children[k];
										chromosomalGene.setDrawFunc(function(context){
											var conGene = selectedChromosome.genes[this.getId().split("_")[1].substring(4)];
											if(typeof conGene != "undefined") {
												// Check if the gene falls withing the boundaries of the ideogram (start stop)
												if(conGene.stop > conIdeogram.start && conGene.start < conIdeogram.stop) {
												
													var geneStartAngle = ideoArcCenter - Math.PI/2 + Math.PI*(conGene.start-conIdeogram.start)/(conIdeogram.stop-conIdeogram.start);
													var geneEndAngle = ideoArcCenter - Math.PI/2 + Math.PI*(conGene.stop-conIdeogram.start)/(conIdeogram.stop-conIdeogram.start);	
													drawingFunction(context, this, 1.01*ideoLayerInnerRadius, 0.99*ideoLayerOuterRadius, 
															geneStartAngle, geneEndAngle);
												} else {
													var geneEndAngle = ideoArcCenter - Math.PI/2 + Math.PI*conGene.stop/selectedChromosome.length;
													var geneStartAngle = ideoArcCenter - Math.PI/2 + Math.PI*conGene.start/selectedChromosome.length;
													drawingFunction(context, this, repInnerRadius, repOuterRadius - 2*(genomeOuterRadius-ideoGramOuterRadius), 
															geneStartAngle, geneEndAngle);
												}
											}
										});
									}
								}
								
								var ideoBlocEndAngle = ideoArcCenter - Math.PI/2 + Math.PI*conIdeogram.stop/selectedChromosome.length;
								var ideoBlocStartAngle = ideoArcCenter - Math.PI/2 + Math.PI*conIdeogram.start/selectedChromosome.length;
								ideoBlocker = getArc(ideoBlocStartAngle, ideoBlocEndAngle, 0.99*repInnerRadius, 
										1.05*repOuterRadius, "#ffffff", 1, "ideoBlocker", "ideoBlocker");
								genomeLayer.add(ideoBlocker);
								
								var totalMarkerCount = Math.floor((conIdeogram.stop-conIdeogram.start)/100000);
								var markerAngle = (Math.PI/(conIdeogram.stop-conIdeogram.start))*100000;
								ideogramBorderFill = getArcOutline(ideoArcCenter - Math.PI/2, ideoArcCenter + Math.PI/2, 
										ideoLayerInnerRadius, ideoLayerOuterRadius, totalMarkerCount, markerAngle, 
										conIdeogram.name+"_border", conIdeogram.name, baseMarkerSpace/100000, conIdeogram.start, conIdeogram.stop);
								genomeLayer.add(ideogramBorderFill);
								
								var ideoMidPoints = getMidPoints(ideoArcCenter, repOuterRadius, ideoLayerInnerRadius);
								var chromoMidPoints = getMidPoints(ideoArcCenter, newOuterRadius, repInnerRadius);

								if(targetNodeType == "ideo") {
									var conEnhProms = conIdeogram["enhproms"];
									totalConEnhProms = conEnhProms.length;
									repEnhProms = conEnhProms;
									doneConEnhProms = 0;
									for (enhprom in conEnhProms) {
										console.log(doneConEnhProms);
										enhpromLoc = enhPromLocator[conEnhProms[enhprom]];
										locParts = enhpromLoc.split("_")
										enhProm = selectedChromosome["enhproms"][parseInt(locParts[2])];
										var epradius = enhProm["stop"]-enhProm["start"]
										var epStartAngle = ideoArcCenter - Math.PI/2 + Math.PI*(enhProm.start-conIdeogram.start)/(conIdeogram.stop-conIdeogram.start);
										var epEndAngle = ideoArcCenter - Math.PI/2 + Math.PI*(enhProm.stop-conIdeogram.start)/(conIdeogram.stop-conIdeogram.start);
										var epMidAngle = (epStartAngle+epEndAngle)/2;
										var epPosRadius = ideoLayerInnerRadius
										var coords = [epPosRadius*Math.cos(epMidAngle), epPosRadius*Math.sin(epMidAngle)]
										var fillColor = (enhProm.name.substring(0,1) == "e") ? "#FF00FF" : "#00FFFF"; 
										var regposX = minDimension/2 + coords[0];
										var regposY = minDimension/2 + coords[1];
										var enhPromStruct = new Kinetic.Circle({
											x: regposX,
											y: regposY,
											radius: Math.log10(epradius)*4,
											fill: fillColor,
											stroke: "#000000",
											opacity: 0.8,
											id: enhProm.id
										})
										enhPromGroup.add(enhPromStruct);

										enhPromStruct.on('mouseover', function(evt){
											document.body.style.cursor = 'pointer';
											
											var targetNode = evt.targetNode;
											var targetId = targetNode.getId();
											var loc = enhPromIdLocator[targetId];
											var conChromosome = chromosomes[loc.split("_")[0]];
											var enhPromNode = conChromosome["enhproms"][loc.split("_")[2]];
											chromConInfoBlobBox.setAbsolutePosition(evt.x, evt.y);
											chromConInfoBlobBox.setOpacity(1);
											chromConInfoBlobBox.setZIndex(10);			
											chromConInfoBlob.setText(enhPromNode.name);
											chromConInfoBlob.setAbsolutePosition(evt.x, evt.y);
											chromConInfoBlob.setOpacity(1);
											chromConInfoBlob.setZIndex(10);
											chromConInfoBlobBox.setHeight(chromConInfoBlob.getHeight());
											genomeLayer.draw(); 
										});
										
										enhPromStruct.on('mouseout', function(evt){
											document.body.style.cursor = 'default';
											chromConInfoBlobBox.setAbsolutePosition(0,0);
											chromConInfoBlobBox.setOpacity(0);
											
											chromConInfoBlob.setAbsolutePosition(0,0);
											chromConInfoBlob.setOpacity(0);
											genomeLayer.draw(); 
										});
										

										enhPromStruct.on("click", function(evt) {
											var enhProm = evt.targetNode;
											var enhPromId = enhProm.getId();
											this.setOpacity(1);
											this.setStroke("red");
											for (m = 0; m < enhPromConnectorGroup.children.length; m++) {
												childSpline = enhPromConnectorGroup.children[m].children[0];
												childSplineId = childSpline.attrs["id"]
												if (childSplineId == enhPromId + "_link") {
													childSpline.setOpacity(1);
													childSpline.setStroke('red');
												}
											}
											numericId = enhPromId.substring(7);
											d3.json('/regRegionEdge?id=' + numericId, function(data) {
												enhPromEdgeGroup.destroy()
												for (community in data) {
													var comCirc = stage.find("#" + community)[0];
													point1 = {"x": comCirc.getAbsolutePosition().x, "y": comCirc.getAbsolutePosition().y};
													for (m in data[community]) {
														edgeNode = data[community][m]["id"];
														edgeWeight = data[community][m]["wt"];
														var loc = enhPromIdLocator["enhprom"+edgeNode];
														var conChromosome = chromosomes[loc.split("_")[0]];
														var enhPromNode = conChromosome["enhproms"][loc.split("_")[2]];
														var pointer = (enhPromNode.start + enhPromNode.stop)/2;
														var enhPromAngle = conChromosome.startAngle + pointer*(conChromosome.endAngle - conChromosome.startAngle)/conChromosome.length;
														var point3 = {"x": center.x + newInnerRadius*Math.cos(enhPromAngle), "y": center.y + newInnerRadius*Math.sin(enhPromAngle)};
														var point2 = {"x": (center.x + 2*(point1.x + point3.x)/2)/3, "y": (center.y + 2*(point1.y + point3.y)/2)/3};
														if (edgeWeight > -1 ) {
															dashLength = (edgeWeight == 0) ? 75 : 50/edgeWeight ;
															var subCord = new Kinetic.Spline({
																points: [point1, point2, point3],
																tension: 0.5,
																stroke: "#ff0000",
																strokeWidth: 2,
																opacity: 1,
																dashArray: [dashLength, 10]
															});
															enhPromEdgeGroup.add(subCord)
														} else {
															var subCord = new Kinetic.Spline({
																points: [point1, point2, point3],
																tension: 0.5,
																stroke: "#ff0000",
																strokeWidth: 2,
																opacity: 1
															});
															enhPromEdgeGroup.add(subCord)
														}
													}
												}
												genomeLayer.add(enhPromEdgeGroup);
												enhPromEdgeGroup.draw();
											});
										});

										getnetworkarcs(enhProm["id"], enhProm["name"], regposX, regposY, epMidAngle, ideoArcCenter, chromosomalArcCenter, conIdeogram, ideoMidPoints, chromoMidPoints, ideoLayerInnerRadius, repOuterRadius, repInnerRadius, newOuterRadius, newInnerRadius);
									}
									myEnhInterval = setInterval(function(){
										if (doneConEnhProms == totalConEnhProms) {
											genomeLayer.add(enhPromConnectorGroup);
											genomeLayer.add(enhPromGroup);
											genomeLayer.draw();
											clearInterval(myEnhInterval);
										}
									}, 1000)
								}
							}	
							if(targetNodeType == "gene") {
								
								var conGene = representedChromosome.genes[targetGeneId];
								var conIdeogram = representedChromosome.ideograms[targetNodeId];
								var geneBlocEndAngle = ideoArcCenter - Math.PI/2 + Math.PI*(conGene.stop - conIdeogram.start)/(conIdeogram.stop-conIdeogram.start);
								var geneBlocStartAngle = ideoArcCenter - Math.PI/2 + Math.PI*(conGene.start - conIdeogram.start)/(conIdeogram.stop-conIdeogram.start);
								geneBlocker = getArc(geneBlocStartAngle, geneBlocEndAngle, 0.99*ideoLayerInnerRadius, 
										1.02*ideoLayerOuterRadius, "#ffffff", 1, "geneBlocker", "geneBlocker");
								genomeLayer.add(geneBlocker);
								
								geneSeqArc = getArc(ideoArcCenter - Math.PI/2, ideoArcCenter + Math.PI/2,
										geneLayerInnerRadius, geneLayerOuterRadius, "#ffffff", 1, "geneSeq", "geneSeq");
								geneSeqArc.setStrokeEnabled(true);
								genomeLayer.add(geneSeqArc);
								
								
								var mutTrigger = setInterval(function(){
									if(mutReceived){
										for(i in mutSequences){
											var start = parseInt(mutSequences[i].start)-25;
											var end = parseInt(mutSequences[i].end)+25;
											var text = mutSequences[i].mutation_description;
											
											geneMutChar = getArc(ideoArcCenter - Math.PI/2 + (start-conGene.start)*Math.PI/(conGene.stop-conGene.start), 
													ideoArcCenter - Math.PI/2 + ((parseInt(end)+1)-conGene.start)*Math.PI/(conGene.stop-conGene.start),
													geneLayerInnerRadius, geneLayerOuterRadius, "#ff0000", 1, start  + "_" + text, text);
											geneSeqText.add(geneMutChar);
										}
										genomeLayer.add(geneSeqText);
										genomeLayer.draw();
										clearInterval(mutTrigger);
										
									}
								}, 10);
							    
							}
						}
						else {
							chromosomeLayer.children[i].children[3].setVisible(false);
							updateChromosomalLayer(chromosomeLayer.children[i], newInnerRadius, newOuterRadius, 
									chromosomes[chromosomeLayer.children[i].getId()].startAngle, 
									chromosomes[chromosomeLayer.children[i].getId()].endAngle, 10000000);
						}
					}
				}
				
				jQuery(".splashScreenExplorer").hide();
				genomeLayer.draw();
	        });
			
		}());
	}	
	
	genomeLayer.add(chromosomeLayer);
	jQuery(".splashScreenExplorer").hide();
	genomeRendered = true;
	
	genomeLayer.draw();
}

function updateChromosomalLayer(chromosomalGroup, innerRadius, outerRadius, startAngle, endAngle, markerSpace){
//	var chromosomalGroup = evt.targetNode.getAncestors()[0];
	var chromosomalBackEnd = chromosomalGroup.children[0];
	var chromosomalBorder = chromosomalGroup.children[1];
	var ideogramLayer = chromosomalGroup.children[2];
	var geneticLayer = chromosomalGroup.children[3];
	
	var representedChromosome = chromosomes[chromosomalBackEnd.getId().split("_")[0]];
	var availableAngle = endAngle-startAngle;
	
	chromosomalBackEnd.setDrawFunc(function (context){
		drawingFunction(context, this, innerRadius, outerRadius, startAngle, endAngle);
	});

	var intRegex = /^\d+$/;
	for(i in ideogramLayer.children){
		if(intRegex.test(i)){
			var chromosomalIde = ideogramLayer.children[i];
			chromosomalIde.setDrawFunc(function(context){
				var conIdeogram = representedChromosome.ideograms[this.getId().split("_")[1].substring(4)];
				var conEndAngle = startAngle + availableAngle*conIdeogram.stop/representedChromosome.length;
				var conStartAngle = startAngle + availableAngle*conIdeogram.start/representedChromosome.length;
				drawingFunction(context, this, innerRadius, outerRadius - (genomeOuterRadius-ideoGramOuterRadius), 
						conStartAngle, conEndAngle);
			});
		}
	}
	
	for(i in geneticLayer.children){
		if(intRegex.test(i)){
			var chromosomalGene = geneticLayer.children[i];
			chromosomalGene.setDrawFunc(function(context){
				var conGene = representedChromosome.genes[this.getId().split("_")[1].substring(4)];
				var conEndAngle = startAngle + availableAngle*conGene.stop/representedChromosome.length;
				var conStartAngle = startAngle + availableAngle*conGene.start/representedChromosome.length;
				drawingFunction(context, this, innerRadius, outerRadius - 2*(genomeOuterRadius-ideoGramOuterRadius), 
						conStartAngle, conEndAngle);
			});
		}
	}
	
	chromosomalBorder.setDrawFunc(function (context){
		var totalMarkerCount = Math.floor(representedChromosome.length/markerSpace);
		var markerAngle = availableAngle*markerSpace/representedChromosome.length;
		
		outlineDrawingFunction(context, this, innerRadius, outerRadius, startAngle, endAngle, totalMarkerCount, 
				markerAngle, this.getId().split("_")[0], baseMarkerSpace/markerSpace);
	});
}

function drawChromConLayer(innerRadius){
	var anglePointer = [];
	var count = 0;
	for(i in chromosomes){
		anglePointer[i] = {"front": chromosomes[i].startAngle, "reverse":chromosomes[i].endAngle, 
				"midStart": midValues[i].start, "midStop": midValues[i].stop, 
				"midfront": chromosomes[i].startAngle + (chromosomes[i].endAngle-chromosomes[i].startAngle)*midValues[i].start,
				"midreverse": chromosomes[i].startAngle + (chromosomes[i].endAngle-chromosomes[i].startAngle)*midValues[i].stop,
				"orderfront": 1, "orderreverse": 24};
		
		renderedConnections[i] = []; // to Save mutual angles
	}
	
	for(var i = 24; i>0; i--){
		var counter = false;
		for (var j = i; j <= 24; j++){
			var chrom1 = "chr" + (i == 23 ? "X" : (i == 24 ? "Y" : i));
			var chrom2 = "chr" + (j == 23 ? "X" : (j == 24 ? "Y" : j));
			if(chrom1 != chrom2) {
				if((chromosomes[chrom2].startAngle - chromosomes[chrom1].startAngle) < Math.PI){
					var point1Ang = anglePointer[chrom1].reverse;
					var point6Ang = anglePointer[chrom1].reverse - (chromosomes[chrom1].endAngle-chromosomes[chrom1].startAngle)*chromConnectors[chrom1+"_"+chrom2].value;
					anglePointer[chrom1].reverse = point6Ang;
					
					var point3Ang = anglePointer[chrom2].front;
					var point4Ang = anglePointer[chrom2].front + (chromosomes[chrom2].endAngle-chromosomes[chrom2].startAngle)*chromConnectors[chrom1+"_"+chrom2].valueRev;
					anglePointer[chrom2].front = point4Ang;
					
					renderedConnections[chrom1].push({"pair": chrom2, "start": point6Ang, "stop":point1Ang, "angleCounter" :  point6Ang, "order":anglePointer[chrom1].orderreverse--});
					renderedConnections[chrom2].push({"pair": chrom1, "start": point3Ang, "stop":point4Ang, "angleCounter" :  point3Ang, "order":anglePointer[chrom2].orderfront++});
				} else {
					var point1Ang = anglePointer[chrom1].midfront;
					var point6Ang = anglePointer[chrom1].midfront - (chromosomes[chrom1].endAngle-chromosomes[chrom1].startAngle)*chromConnectors[chrom1+"_"+chrom2].value;
					anglePointer[chrom1].midfront = point6Ang;
					
					var point3Ang = anglePointer[chrom2].midreverse;
					var point4Ang = anglePointer[chrom2].midreverse + (chromosomes[chrom2].endAngle-chromosomes[chrom2].startAngle)*chromConnectors[chrom1+"_"+chrom2].valueRev;
					anglePointer[chrom2].midreverse = point4Ang;
					
					if(counter){
						renderedConnections[chrom1].push({"pair": chrom2, "start": point6Ang, "stop":point1Ang, "angleCounter" :  point6Ang, "order":anglePointer[chrom1].orderreverse--});
						renderedConnections[chrom2].push({"pair": chrom1, "start": point3Ang, "stop":point4Ang, "angleCounter" :  point3Ang, "order":anglePointer[chrom2].orderfront++});
					} else {
						counter = true;
						renderedConnections[chrom1][0].order = anglePointer[chrom1].orderreverse;
						renderedConnections[chrom2][0].order = anglePointer[chrom2].orderfront;
						anglePointer[chrom1].orderreverse -= 1; // to account for the mid value?
						anglePointer[chrom2].orderfront += 1;
						renderedConnections[chrom1].push({"pair": chrom2, "start": point6Ang, "stop":point1Ang, "angleCounter" :  point6Ang, "order":anglePointer[chrom1].orderreverse--});
						renderedConnections[chrom2].push({"pair": chrom1, "start": point3Ang, "stop":point4Ang, "angleCounter" :  point3Ang, "order":anglePointer[chrom2].orderfront++});
					}
					
				}
				
				var points = [];
				var point1 = {"x": center.x + 0.98*innerRadius*Math.cos(point1Ang),
						"y": center.y + 0.98*innerRadius*Math.sin(point1Ang)};
				var point3 = {"x": center.x + 0.98*innerRadius*Math.cos(point3Ang),
						"y": center.y + 0.98*innerRadius*Math.sin(point3Ang)};
				var point4 = {"x": center.x + 0.98*innerRadius*Math.cos(point4Ang),
						"y": center.y + 0.98*innerRadius*Math.sin(point4Ang)};
				var point6 = {"x": center.x + 0.98*innerRadius*Math.cos(point6Ang),
						"y": center.y + 0.98*innerRadius*Math.sin(point6Ang)};
				var point2 = {"x": (center.x + 2*(point1.x + point3.x)/2)/3, "y": (center.y + 2*(point1.y + point3.y)/2)/3};
				var point5 = {"x": (center.x + 2*(point4.x + point6.x)/2)/3, "y": (center.y + 2*(point4.y + point6.y)/2)/3};
				points.push(point1);
				points.push(point2);
				points.push(point3);
				points.push(point4);
				points.push(point5);
				points.push(point6);
				var chord = getBlob(points, "#cccccc", "chromCon-" + chrom1+"_"+chrom2);
				chromConLayer.add(chord);
			} else {
				var point1Ang = chromosomes[chrom1].startAngle + (chromosomes[chrom1].endAngle-chromosomes[chrom1].startAngle)*anglePointer[chrom1].midStart;
				var point3Ang = chromosomes[chrom1].startAngle + (chromosomes[chrom1].endAngle-chromosomes[chrom1].startAngle)*anglePointer[chrom2].midStop;
				
				var points = [];
				var point1 = {"x": center.x + 0.98*innerRadius*Math.cos(point1Ang),
						"y": center.y + 0.98*innerRadius*Math.sin(point1Ang)};
				var point3 = {"x": center.x + 0.98*innerRadius*Math.cos(point3Ang),
						"y": center.y + 0.98*innerRadius*Math.sin(point3Ang)};
				var point2 = {"x": (center.x + 2*(point1.x + point3.x)/2)/3, "y": (center.y + 2*(point1.y + point3.y)/2)/3};
				
				renderedConnections[chrom1].push({"pair": chrom1, "start": point1Ang, "angleCounter" :  point1Ang, "stop":point3Ang});
				
				points.push(point1);
				points.push(point2);
				points.push(point3);
				var chord = getBlob(points, "#cccccc", "chromCon-" + chrom1+"_"+chrom2);
				chromConLayer.add(chord);
			}
		}
	}
	for(i in renderedConnections){
		renderedConnections[i].sort(function(a,b){return a.order - b.order});
	}
	//console.log(renderedConnections);
	genomeLayer.add(chromConLayer);
	genomeLayer.draw();
	
	// ---- Event Binding Callbacks 
	chromConLayer.on('mouseover', function(evt){
		document.body.style.cursor = 'pointer';
		var mousePos = stage.getPointerPosition();
		var chromosomalChord = evt.targetNode;
		var targetNodeType = chromosomalChord.getId().split("-")[0];
		var targetNodeId = chromosomalChord.getId().split("-")[1];
		if(targetNodeType == "chromCon") {
			var representedChord = chromConnectors[targetNodeId];
			var chordText = 'COMMON :: ' + representedChord.name + 
					'\n\nDisease Co-occurence - ' + representedChord.disease + 
					'\nPathway Co-occurence - ' + representedChord.pathway + 
					'\nPublication Co-occurence - ' + representedChord.pubmed;
			
			chromConInfoBlobBox.setAbsolutePosition(mousePos.x, mousePos.y);
			chromConInfoBlobBox.setOpacity(1);
			chromConInfoBlobBox.setZIndex(20);			
			chromConInfoBlob.setText(chordText);
			chromConInfoBlob.setAbsolutePosition(mousePos.x, mousePos.y);
			chromConInfoBlob.setOpacity(1);
			chromConInfoBlob.setZIndex(10);
			chromConInfoBlobBox.setHeight(chromConInfoBlob.getHeight());
			genomeLayer.draw(); 
		}
	});
	
	chromConLayer.on('mouseout', function(evt){
		document.body.style.cursor = 'default';
		chromConInfoBlobBox.setAbsolutePosition(0,0);
		chromConInfoBlobBox.setOpacity(0);
		
		chromConInfoBlob.setAbsolutePosition(0,0);
		chromConInfoBlob.setOpacity(0);
		genomeLayer.draw(); 
	});
}

function drawAuxiliaryLayers(data, type, startAngle, availableAngle, chromosomeLength, chromosomeName, innerRadius, outerRadius){
	var dataLayer = new Kinetic.Group({
		id: chromosomeName+"_" + type
	})
	for(j in data) {
		( function() {
			var currentIdeAngle = startAngle + data[j].start*availableAngle/chromosomeLength;
			var endIdeAngle = startAngle + data[j].stop*availableAngle/chromosomeLength;
			
			data[j].startAngle = currentIdeAngle;
			data[j].endAngle = endIdeAngle;
			
			if(type == "ideo") {
				var color = lookUpTable[data[j].gieStain];
				if(color == null)
					color = {"color": "#ffffff", "opacity": 1};
				var name = data[j].name;
			} else {
				var color = {"color": "#00ff00", "opacity": 1};
				var name = data[j].externalName;
			}
			
			var backFill = getArc(currentIdeAngle, endIdeAngle, innerRadius, 
					outerRadius, color.color, color.opacity, chromosomeName+ "_"+ type + j, name);
			
			dataLayer.add(backFill);
		}());
	}
	return dataLayer;
}

function getMidPoints(arcCenter, innerRadius, outerRadius){
	var centerRadius = (innerRadius+outerRadius)/2;
	var leftAngle = arcCenter - Math.PI/2;
	var rightAngle = arcCenter + Math.PI/2;
	var counterAngles = Math.PI/20;
	var midPoints = [];
	for(i = 0; i < 20; i++){
		var currentAngle = leftAngle + counterAngles*i;
		var point = {"x": center.x + centerRadius*Math.cos(currentAngle), "y": center.y + centerRadius*Math.sin(currentAngle), "angle": currentAngle};
		midPoints.push(point);
	}
	return midPoints;
}

function getMidPointsSec(arcCenter, centerRadius, lowerBound, upperBound){
	var leftAngle = arcCenter - Math.PI/2;
	var rightAngle = arcCenter + Math.PI/2;
	var counterAngles = Math.PI/20;
	var midPoints = [];
	for(i = 0; i < 20; i++){
		var currentAngle = leftAngle + counterAngles*i;
		if(currentAngle > lowerBound && currentAngle < upperBound) {
			var point = {"x": center.x + centerRadius*Math.cos(currentAngle), "y": center.y + centerRadius*Math.sin(currentAngle), "angle": currentAngle};
			midPoints.push(point);
		}
	}
	return midPoints;
}

function getArc(currentAngle, endAngle,innerRadius, outerRadius, fill,opacity, id, name){
	var arcElem = new Kinetic.Shape({
		drawFunc: function(context) {
			drawingFunction(context, this, innerRadius, outerRadius, currentAngle, endAngle);
		},
		id: id,
		name: name,
		fill: fill,
		stroke: 'black',
		strokeWidth: 1,
		opacity: opacity,
		strokeEnabled: false
	});
	return arcElem;
}

function getArcOutline(currentAngle, endAngle, innerRadius, outerRadius, totalMarkerCount, markerAngle, id, name, pointer, startM, endM){
	var arcOutlineElem = new Kinetic.Shape({
		drawFunc: function(context) {
			outlineDrawingFunction(context, this, innerRadius, outerRadius, currentAngle, endAngle, 
					totalMarkerCount, markerAngle, name, pointer, startM, endM);
		},
		id: id,
		fill: "#ffffff",
		stroke: 'black',
		strokeWidth: 1,
		fillEnabled: false
	});
	return arcOutlineElem;
}

function getSeqArc(currentAngle, endAngle,innerRadius, outerRadius, fill,opacity, id, name, text){
	var seqArcElem = new Kinetic.Shape({
		drawFunc: function(context) {
			drawingFunction(context, this, innerRadius, outerRadius, currentAngle, endAngle);
		},
		id: id,
		name: name,
		fill: fill,
		stroke: 'black',
		strokeWidth: 1,
		opacity: opacity,
		strokeEnabled: false
	});
	return seqArcElem;
}

function getSpline(points, color, id, weight, opacity){
	
	var spline = new Kinetic.Spline({
		points: points,
        stroke: color,
        strokeWidth: weight,
        tension: 0.2,
        opacity: opacity,
        id: id
	});
	return spline;
}

function getBlob(points, color, id, opacity){
	
	var blob = new Kinetic.Blob({
		points: points,
        stroke: "#000",
        strokeWidth: 1,
        fill: color,
        tension: 0.2,
        opacity: 0,
        id: id
	});
	return blob;
}

function drawingFunction(context, arcElem, innerRadius, outerRadius, currentAngle, endAngle){
	context.beginPath();
	context.arc(center.x, center.y, innerRadius, endAngle, currentAngle, true);
	context.lineTo(center.x + outerRadius*Math.cos(currentAngle), center.y + outerRadius*Math.sin(currentAngle));
	context.arc(center.x, center.y, outerRadius, currentAngle, endAngle);
	context.lineTo(center.x + innerRadius*Math.cos(endAngle), center.y + innerRadius*Math.sin(endAngle));
	context.closePath();
	context.fillStrokeShape(arcElem);
}

function outlineDrawingFunction(context, arcElem, innerRadius, outerRadius, 
		currentAngle, endAngle, totalMarkerCount, markerAngle, chromosomeName, pointer, startM, endM) {
	context.beginPath();
	context.arc(center.x, center.y, innerRadius, endAngle, currentAngle, true);
	context.lineTo(center.x + outerRadius*Math.cos(currentAngle), center.y + outerRadius*Math.sin(currentAngle));
	var markerCount = 0;
	var currentMarkerAngle = currentAngle;
	var endMarkerAngle = currentAngle;
	while(markerCount < totalMarkerCount) {
		currentMarkerAngle = currentAngle + markerCount*markerAngle;
		endMarkerAngle = currentAngle + (markerCount+1)*markerAngle;
		context.arc(center.x, center.y, outerRadius, currentMarkerAngle, endMarkerAngle);
		
		// ----- All the effort for markers 
		if(typeof pointer == "undefined")
			pointer = 1;
		if((markerCount+1)%(5*pointer) == 0){
			context.save();
			context.translate(center.x + outerRadius*1.022*Math.cos(endMarkerAngle), center.y + outerRadius*1.022*Math.sin(endMarkerAngle));
			context.font="10px Georgia";
			if(endMarkerAngle < Math.PI/2) {
				context.rotate(endMarkerAngle);
				context.fillText((markerCount+1)/pointer,0,4);
			} else {
				context.rotate(endMarkerAngle + Math.PI);
				context.fillText((markerCount+1)/pointer,-9,4);
			}		
			context.restore();
			context.lineTo(center.x + outerRadius*1.02*Math.cos(endMarkerAngle), center.y + outerRadius*1.02*Math.sin(endMarkerAngle));
		} else
			context.lineTo(center.x + outerRadius*1.012*Math.cos(endMarkerAngle), center.y + outerRadius*1.012*Math.sin(endMarkerAngle));
		// -----
		
		markerCount++;
	}
	
	// ----- Print Chromosome names
	var textAngle = (currentAngle+endAngle)/2;
	context.save();
	context.translate(center.x + innerRadius*0.9*Math.cos(textAngle), center.y + innerRadius*0.9*Math.sin(textAngle));
	context.font="bold 64px sans-serif";
	if(textAngle < Math.PI/2) {
		context.rotate(textAngle);
		context.fillText(chromosomeName,0,0);
	} else {
		context.rotate(textAngle+Math.PI);
		context.fillText(chromosomeName,-18,0);
	}		
	context.restore();
	// -------
	
	context.arc(center.x, center.y, outerRadius, endMarkerAngle, endAngle);
	context.lineTo(center.x + innerRadius*Math.cos(endAngle), center.y + innerRadius*Math.sin(endAngle));
	context.closePath();
	context.fillStrokeShape(arcElem);
}

function plotLegend(){
	var legendGroup = new Kinetic.Group();
	var legendWidth = 180;
	var legendBox = new Kinetic.Rect({
	    x: 0,
	    y: 10,
	    stroke: '#000',
	    strokeWidth: 1,
	    fill: '#fff',
	    width: legendWidth,
	    height: 320,
	    shadowColor: 'black',
	    shadowBlur: 4,
	    shadowOffset: [3, 3],
	    opacity: 1,
	    cornerRadius: 3
	});
	legendGroup.add(legendBox);
	
	var legendTextSize = 16;
	var yPos = 0;
	var incrementer = 16;
	var xLoc = 30;

	var legendChromosome = new Kinetic.Text({
	    x: 0,
	    y: yPos,
	    text: "Chromosome",
	    fontSize: legendTextSize,
	    fontFamily: 'Calibri',
	    fontStyle: 'bold',
	    fill: '#555',
	    width: legendWidth,
	    padding: 10,
	    opacity: 1
	});

	legendGroup.add(legendChromosome);

	yPos = yPos + incrementer + 5;
	var ideogramText = new Kinetic.Text({
	    x: 0,
	    y: yPos,
	    text: "Ideogram (Stain)",
	    fontSize: legendTextSize,
	    fontFamily: 'Calibri',
	    fill: '#555',
	    fontStyle: 'bold',
	    width: legendWidth,
	    padding: 10,
	    opacity: 1
	});

	legendGroup.add(ideogramText);

	yPos = yPos + incrementer + 5;
	for (stain in lookUpTable) {
		var ideogramLegend = new Kinetic.Rect({
			x: 10,
			y: yPos+incrementer/2,
			fill: lookUpTable[stain]["color"],
			opacity: lookUpTable[stain]["opacity"],
			width: incrementer,
			height: incrementer,
			stroke: "#000"
		});
		legendGroup.add(ideogramLegend);
		var legendStain = new Kinetic.Text({
			x: xLoc,
			y: yPos,
			text: stain.toUpperCase(),
		    fontSize: legendTextSize,
		    fontFamily: 'Calibri',
		    fill: '#555',
		    width: legendWidth,
		    padding: 10,
		    opacity: 1
		});
		legendGroup.add(legendStain);
		yPos = yPos + incrementer;
	}

	yPos = yPos + 5
	var geneText = new Kinetic.Text({
	    x: 0,
	    y: yPos,
	    text: "Gene (Mutations)",
	    fontSize: legendTextSize,
	    fontStyle: 'bold',
	    fontFamily: 'Calibri',
	    fill: '#555',
	    width: legendWidth,
	    padding: 10,
	    opacity: 1
	});

	legendGroup.add(geneText);
	yPos = yPos + incrementer + 5;
	var normalLegend = new Kinetic.Rect({
		x: 10,
		y: yPos+incrementer/2,
		fill: "#00ff00",
		opacity: 1,
		width: incrementer,
		height: incrementer,
		stroke: "#000"
	});
	var normalGene = new Kinetic.Text({
	    x: xLoc,
	    y: yPos,
	    text: "Gene (Normal)",
	    fontSize: legendTextSize,
	    fontFamily: 'Calibri',
	    fill: '#555',
	    width: legendWidth,
	    padding: 10,
	    opacity: 1
	});
	legendGroup.add(normalLegend);
	legendGroup.add(normalGene);

	yPos = yPos + incrementer;
	var somaticLegend = new Kinetic.Rect({
		x: 10,
		y: yPos+incrementer/2,
		fill: "#FF0000",
		opacity: 1,
		width: incrementer,
		height: incrementer,
		stroke: "#000"
	});
	var somaticGene = new Kinetic.Text({
	    x: xLoc,
	    y: yPos,
	    text: "Gene (Somatic)",
	    fontSize: legendTextSize,
	    fontFamily: 'Calibri',
	    fill: '#555',
	    width: legendWidth,
	    padding: 10,
	    opacity: 1
	});
	legendGroup.add(somaticLegend);
	legendGroup.add(somaticGene);
	
	yPos = yPos + incrementer;
	var germlineLegend = new Kinetic.Rect({
		x: 10,
		y: yPos+incrementer/2,
		fill: "#8B2252",
		opacity: 1,
		width: incrementer,
		height: incrementer,
		stroke: "#000"
	});
	var germlineGene = new Kinetic.Text({
	    x: xLoc,
	    y: yPos,
	    text: "Gene (Germline)",
	    fontSize: legendTextSize,
	    fontFamily: 'Calibri',
	    fill: '#555',
	    width: legendWidth,
	    padding: 10,
	    opacity: 1
	});
	legendGroup.add(germlineLegend);
	legendGroup.add(germlineGene);

	yPos = yPos + incrementer;
	var cancerLegend = new Kinetic.Rect({
		x: 10,
		y: yPos+incrementer/2,
		fill: "#8B2500",
		opacity: 1,
		width: incrementer,
		height: incrementer,
		stroke: "#000"
	});
	var cancerGene = new Kinetic.Text({
	    x: xLoc,
	    y: yPos,
	    text: "Gene (Both)",
	    fontSize: legendTextSize,
	    fontFamily: 'Calibri',
	    fill: '#555',
	    width: legendWidth,
	    padding: 10,
	    opacity: 1
	});
	legendGroup.add(cancerLegend);
	legendGroup.add(cancerGene);

	yPos = yPos + incrementer + 5;
	var enhCircle = new Kinetic.Circle({
		x: 10+incrementer/2,
		y: yPos+incrementer,
		radius: incrementer/2,
		opacity: 0.8,
		fill: "#FF00FF",
		stroke: "#000"
	})
	var enhText = new Kinetic.Text({
	    x: xLoc,
	    y: yPos,
	    text: "Enhancers",
	    fontSize: legendTextSize,
	    fontStyle: 'bold',
	    fontFamily: 'Calibri',
	    fill: '#555',
	    width: legendWidth,
	    padding: 10,
	    opacity: 1
	});
  
	legendGroup.add(enhCircle);
	legendGroup.add(enhText);

	yPos = yPos + incrementer + 5;
	var promCircle = new Kinetic.Circle({
		x: 10+incrementer/2,
		y: yPos+incrementer,
		radius: incrementer/2,
		opacity: 0.8,
		fill: "#00FFFF",
		stroke: "#000"
	})
	var promText = new Kinetic.Text({
	    x: xLoc,
	    y: yPos,
	    text: "Promoters",
	    fontSize: legendTextSize,
	    fontStyle: 'bold',
	    fontFamily: 'Calibri',
	    fill: '#555',
	    width: legendWidth,
	    padding: 10,
	    opacity: 1
	});
	legendGroup.add(promCircle);
	legendGroup.add(promText);

	yPos = yPos + incrementer + 5;
	var comCircle = new Kinetic.Circle({
		x: 10+incrementer/2,
		y: yPos+incrementer,
		radius: incrementer/2,
		opacity: 0.8,
		fill: "#0000FF",
		stroke: "#000"
	})
	var comText = new Kinetic.Text({
	    x: xLoc,
	    y: yPos,
	    text: "Communities",
	    fontSize: legendTextSize,
	    fontStyle: 'bold',
	    fontFamily: 'Calibri',
	    fill: '#555',
	    width: legendWidth,
	    padding: 10,
	    opacity: 1
	});
	legendGroup.add(comCircle);
	legendGroup.add(comText);


	var legendWidth2 = 180
	var legendBox2 = new Kinetic.Rect({
	    x: legendWidth + 25,
	    y: 10,
	    stroke: '#000',
	    strokeWidth: 1,
	    fill: '#fff',
	    width: legendWidth2,
	    height: 90,
	    shadowColor: 'black',
	    shadowBlur: 4,
	    shadowOffset: [3, 3],
	    opacity: 1,
	    cornerRadius: 3
	});

	legendGroup.add(legendBox2);
	
	var yPos = 0;
	var incrementer = 16;
	var xLoc = 30;

	var legendEdges = new Kinetic.Text({
	    x: legendWidth + 25,
	    y: yPos,
	    text: "Edges",
	    fontSize: legendTextSize,
	    fontFamily: 'Calibri',
	    fontStyle: 'bold',
	    fill: '#555',
	    width: legendWidth2,
	    padding: 10,
	    opacity: 1
	});

	legendGroup.add(legendEdges);

	yPos = yPos + incrementer + 5;
	var communityEdge = new Kinetic.Text({
	    x: legendWidth2 + 25 + 40,
	    y: yPos,
	    text: "Community Edge",
	    fontSize: legendTextSize,
	    fontFamily: 'Calibri',
	    fill: '#555',
	    fontStyle: 'bold',
	    width: legendWidth,
	    padding: 10,
	    opacity: 1
	});

	legendGroup.add(communityEdge);

	var communityLine = new Kinetic.Line({
		points: [legendWidth2 + 30, yPos + 18, legendWidth2 + 25 + 40, yPos+18],
        stroke: "#000",
        strokeWidth: 2,
        tension: 0.2,
        opacity: 1
	})

	legendGroup.add(communityLine);

	yPos = yPos + incrementer + 5;
	var positiveEdge = new Kinetic.Text({
	    x: legendWidth2 + 25 + 40,
	    y: yPos,
	    text: "Positive Edge",
	    fontSize: legendTextSize,
	    fontFamily: 'Calibri',
	    fill: '#555',
	    fontStyle: 'bold',
	    width: legendWidth,
	    padding: 10,
	    opacity: 1
	});

	legendGroup.add(positiveEdge);

	var positiveLine = new Kinetic.Line({
		points: [legendWidth2 + 30, yPos + 18, legendWidth2 + 25 + 40, yPos+18],
        stroke: "#ff0000",
        strokeWidth: 2,
        tension: 0.2,
        opacity: 1
	})

	legendGroup.add(positiveLine);

	yPos = yPos + incrementer + 5;
	var predictedEdge = new Kinetic.Text({
	    x: legendWidth2 + 25 + 40,
	    y: yPos,
	    text: "Predicted Edge",
	    fontSize: legendTextSize,
	    fontFamily: 'Calibri',
	    fill: '#555',
	    fontStyle: 'bold',
	    width: legendWidth,
	    padding: 10,
	    opacity: 1
	});

	legendGroup.add(predictedEdge);

	var predictedLine = new Kinetic.Line({
		points: [legendWidth2 + 30, yPos + 18, legendWidth2 + 25 + 40, yPos+18],
        stroke: "#ff0000",
        strokeWidth: 2,
        tension: 0.2,
        opacity: 1,
        dashArray: [5, 2]
	})

	legendGroup.add(predictedLine);

	return legendGroup;
}


stage.add(genomeLayer);

console.log("wheel here");
jQuery(stage.content).on('mousewheel', ui.zoom);

// -------------------------------- Triggers to know if extra information is parsed
var cancerGeneTrigger = setInterval(function(){
	if(genomeRendered == true && cancerGenes.length > 0) {
		for(i in cancerGenes){
			var cancerGene = chromosomes[cancerGenes[i].split("_")[0]].genes[cancerGenes[i].split("_")[1].substring(4)];
			if(cancerGene.somaticMut && cancerGene.germlineMut)
				chromosomeLayer.get('#'+ cancerGenes[i])[0].setFill('#8B2500');
			else if(cancerGene.somaticMut)
				chromosomeLayer.get('#'+ cancerGenes[i])[0].setFill('#FF0000');
			else
				chromosomeLayer.get('#'+ cancerGenes[i])[0].setFill('#8B2252');
		}
	//	genomeLayer.draw();
		clearInterval(cancerGeneTrigger);
	}
}, 10);


jQuery('.dropdown-toggle').dropdown();
jQuery('.dropdown input, .dropdown label').click(function(e) {
	e.stopPropagation();
});

jQuery('#tabIds').on('click', ' li a .close', function() {
    var tabId = jQuery(this).parents('li').children('a').attr('href');
    jQuery(this).parents('li').remove('li');
    jQuery(tabId).remove();
    jQuery('#tabIds a:first').tab('show');
});

var chromConTrigger = setInterval(function(){
	if(genomeRendered && chromConParsed){
	//	drawChromConLayer(genomeInnerRadius);
	//	console.log(chromConnectors);
		clearInterval(chromConTrigger);
	}
});


