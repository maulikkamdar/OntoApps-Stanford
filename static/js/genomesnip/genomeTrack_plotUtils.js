var circularDatasets = new Kinetic.Group();
var barDatasets = new Kinetic.Group();
var linearDatasets = new Kinetic.Group();

// ------------------------------------ Dataset Plotting Functions --------------------------------
function plotCircularData(data, chromosomeId){
	circularDatasets.destroy();
	var currentGenomeLength = chromosomes[chromosomeId].length;
	
	var height = 150 + 20*(currentTracks.length-1);
	for(i in currentTracks){
		height += currentTracks[i].height;
	}
//	var baseLength = (width-100)/currentGenomeLength;
	for(i in data) {
		var posX = parseInt(data[i].position)*baseLength;
		var rad = data[i].normalizedValue/2;
		var circle = new Kinetic.Circle({
	        x: posX,
	        y: height-rad,
	        radius: rad,
	        fill: 'red',
	        stroke: 'red',
	        strokeWidth: 1,
	        opacity: 0.4
		});
		circularDatasets.add(circle);
	}
	dynamicTrackLayer.add(circularDatasets);
	
	getDivider(height, currentGenomeLength*baseLength);
	
	dynamicTrackLayer.draw();
}

function plotLinearData(data, chromosomeId){
//	linearDatasets.destroy();
	var currentGenomeLength = chromosomes[chromosomeId].length;
	var height = 150 + 20*(currentTracks.length-1);
	for(i in currentTracks){
		height += currentTracks[i].height;
	}
//	var baseLength = (width-100)/currentGenomeLength;
	for(i in data) {
		var posX = parseInt(data[i].position)*baseLength;
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
	dynamicTrackLayer.add(linearDatasets);
	
	getDivider(height, currentGenomeLength*baseLength);
	
	dynamicTrackLayer.draw();
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

//--------------------------------------------------------------------------------