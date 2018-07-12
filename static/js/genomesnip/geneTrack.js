var width = 0.95*window.innerWidth;
var height = 660 // window.innerHeight - 320 // window.innerHeight - 200
var currentTracks = [];

function appendCanvas (trackNum, conGene){
	var genomeTrackCanvas = new Kinetic.Stage({
		container: 'genomeTrackCanvas' + trackNum,
		width: width,
		height: height
	});
	
	currentTracks[conGene.externalName+"_"+trackNum]=[];
	var staticTrackLayer = new Kinetic.Layer({
		width: 100
	});

	var dynamicTrackLayer = new Kinetic.Layer({
		width: width - 100,
		x: 100,
		draggable: true,
	    dragBoundFunc: function(pos) {
	    	var newX =  pos.x > 100 ? 100 : pos.x;
	    	return {
	    		x: newX,
	        	y: this.getAbsolutePosition().y
	    	}
	    }
	});
	
	var yAxis = new Kinetic.Line({
		points: [0, 0, 0, height],
		stroke: 'black',
		strokeWidth: 2,
		lineJoin: 'round',
		opacity: 0.1
	});
	
	dynamicTrackLayer.add(yAxis);
	
	var staticLayerBg = new Kinetic.Rect({
	    x: 0,
	    y: 0,
	    width: 100,
	    height: height,
	    fill: '#cccccc',
	    stroke: '#cccccc',
	    opacity: 1,
	    strokeWidth: 1
	});

	staticTrackLayer.add(staticLayerBg);
	
	var dividerGroup = new Kinetic.Group();
	dynamicTrackLayer.add(dividerGroup);
	
	var baseLength = (width - 100)/(conGene.stop-conGene.start); // Too visualize the entire gene length
//	var baseLength = 1;
	if(conGene.somaticMut && conGene.germlineMut)
		fill = '#8B2500';
	else if(conGene.somaticMut)
		fill = '#FF0000';
	else if(conGene.germlineMut)
		fill = '#8B2252';
	else
		fill = '#00ff00'
			
	var geneRect = new Kinetic.Rect({
	    x: 0,
	    y: 0,
	    width: (conGene.stop-conGene.start)*baseLength, //typically just the width of the window but we will make it more flexible
	    height: 10,
	    fill: fill,
	    stroke: '#000000',
	    opacity: 1,
	    strokeWidth: 1
	});
	
	dynamicTrackLayer.add(geneRect);
	
	var mutTrackTrigger = setInterval(function(){
	//	console.log("here");
		if(mutReceived){
			
			geneMutGroup = new Kinetic.Group();
			geneSnpGroup = new Kinetic.Group();
			
			var mutText = getText({"x": 0, "y": 0}, "Mutations");
		//	var snpText = getText({"x": 0, "y": 15}, "SNPs");
			
			for(i in mutSequences){
				var start = parseInt(mutSequences[i].start)-5;
				var end = parseInt(mutSequences[i].end)+5;
				var text = mutSequences[i].mutation_description;
				
				geneMutChar = getRect({"x": (start-conGene.start)*baseLength, "y": 15}, (end-start)*baseLength, 10, "#ff0000", start  + "_" + text);
				geneMutGroup.add(geneMutChar);
			}
		/*	for(i in snpSequences){
				var start = parseInt(snpSequences[i].position);
				var end = parseInt(snpSequences[i].position)+1;
				var text = snpSequences[i]["Ensembl consequence type"];
				
				geneSnpChar = getRect({"x": (start-conGene.start)*baseLength, "y": 30}, (end-start)*baseLength, 10, "#0000ff", start  + "_" + text);
				geneSnpGroup.add(geneSnpChar);
			}*/
			staticTrackLayer.add(mutText);
		//	staticTrackLayer.add(snpText);
			
			dynamicTrackLayer.add(geneMutGroup);
		//	dynamicTrackLayer.add(geneSnpGroup);
			
			staticTrackLayer.draw();
			dynamicTrackLayer.draw();
			
			clearInterval(mutTrackTrigger);
		}
	}, 10);
	genomeTrackCanvas.add(dynamicTrackLayer);
	genomeTrackCanvas.add(staticTrackLayer);
	
	return {"gene": conGene,"staticL": staticTrackLayer,"dynamic": dynamicTrackLayer, "baseLength": baseLength, "dividers": dividerGroup};
}

function plotLinearData(data, gene, trackNum, trackCanvas, currentTrack){
	var linearDatasets = new Kinetic.Group();
	
	var height = 70 + 20*(currentTracks[gene.externalName + "_" +trackNum].length-1);
	for(i in currentTracks[gene.externalName + "_" +trackNum]){
		height += currentTracks[gene.externalName + "_" +trackNum][i].height;
	}

	for(i in data) {
		var posX = (parseInt(data[i].position)-gene.start)*trackCanvas.baseLength;
		var rad = data[i].normalizedValue;
		var line = new Kinetic.Line({
			points: [posX, height - rad, posX, height],
			stroke: 'red',
			strokeWidth: 1,
			lineJoin: 'round',
			opacity: 1
	    });
		linearDatasets.add(line);
	}
//	console.log(trackCanvas);
	var patientIdText = getText({"x": 0, "y": height-20}, currentTrack.name);
	trackCanvas.dynamic.add(linearDatasets);
	trackCanvas.staticL.add(patientIdText)
	trackCanvas.dividers.add(getDivider(height, (trackCanvas.gene.stop-trackCanvas.gene.start)*trackCanvas.baseLength));
	trackCanvas.staticL.draw();
	trackCanvas.dynamic.draw();
}

function plotBarData(data, chromosomeId){
//	barDatasets.destroy();
	var currentGenomeLength = chromosomes[chromosomeId].length;
	var height = 150 + 20*(currentTracks.length-1);
	for(i in currentTracks){
		height += currentTracks[i].height;
	}
//	var baseLength = (width-100)/currentGenomeLength;
	for(i in data) {
		var startX = parseInt(data[i].start)*baseLength;
		var stopX = parseInt(data[i].stop)*baseLength;
		var rad = data[i].normalizedValue;
		var rect = new Kinetic.Rect({
	        x: startX,
	        y: height - rad,
	        width: stopX - startX,
	        height: rad,
	        fill: 'green',
	        stroke: 'green',
	        opacity: 0.4,
	        strokeWidth: 1
	    });

		barDatasets.add(rect);
	}
	dynamicTrackLayer.add(barDatasets);
	
	getDivider(height, currentGenomeLength*baseLength);
	
	dynamicTrackLayer.draw();
}

function getRect(coOrds, width, height, color, id){
	var rect = new Kinetic.Rect({
        x: coOrds.x,
        y: coOrds.y,
        width: width,
        height: height,
        fill: color,
        id: id,
        stroke: 'black',
        strokeWidth: 4,
        strokeEnabled: false
      });
	return rect;
}

function getText(coOrds, text){
	var staticText = new Kinetic.Text({
	    x: coOrds.x,
	    y: coOrds.y,
	    text: text,
	    fontSize: 16,
	    fontFamily: 'Calibri',
	    fill: '#000',
	    width: 100,
	    padding: 10,
	    opacity: 1
	});
	return staticText;
}

function getDivider(height, trackLength) {
	var divider = new Kinetic.Line({
		  points: [0, height, trackLength, height],
		  stroke: 'black',
		  strokeWidth: 2,
		  lineJoin: 'round',
		  opacity: 0.1
		});
	return divider;
}