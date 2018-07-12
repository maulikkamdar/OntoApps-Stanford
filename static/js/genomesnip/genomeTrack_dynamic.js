var linearGeneGroup = new Kinetic.Group();
var markerGroup = new Kinetic.Group();
var dividerGroup = new Kinetic.Group();

// ------------------- Dynamic layer Static Objects
var yAxis = new Kinetic.Line({
	points: [0, 0, 0, height],
	stroke: 'black',
	strokeWidth: 2,
	lineJoin: 'round',
	opacity: 0.1
});

var geneInfoText = new Kinetic.Text({
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

var geneInfoBox = new Kinetic.Rect({
    x: 0,
    y: 0,
    stroke: '#555',
    strokeWidth: 1,
    fill: '#ddd',
    width: 300,
    height: geneInfoText.getHeight(),
    shadowColor: 'black',
    shadowBlur: 4,
    shadowOffset: [3, 3],
    opacity: 0,
    cornerRadius: 3
});

dynamicTrackLayer.add(geneInfoBox);
dynamicTrackLayer.add(geneInfoText);
dynamicTrackLayer.add(yAxis);

//-----------------------------------------------------------

function drawGenomeTrack(chromosomeId) {
	linearGeneGroup.destroy();
	markerGroup.destroy();
	var currentGenomeLength = chromosomes[chromosomeId].length;
	var baseY = 30;
	var genes = chromosomes[chromosomeId].genes;
	var geneDistance = 10;
	var currentY = baseY;
	var currentStop = -2* geneDistance;
	var currentDistance = geneDistance;
	var numberOfLayers = 0;
	
	for(i in genes){
		(function (){
			currentDistance = (genes[i].start)*baseLength - currentStop;
			if(currentDistance < geneDistance){
				currentY += 8;
				if((currentY - baseY)/8 > numberOfLayers)
					numberOfLayers++;
			} else {
				currentStop = genes[i].stop*baseLength;
				currentY = baseY;
			}
			var geneElem = new Kinetic.Rect({
		        x: genes[i].start*baseLength,
		        y: currentY,
		        width: (genes[i].stop - genes[i].start)*baseLength,
		        height: 5,
		        fill: 'blue',
		        stroke: 'black',
		        opacity: 0.6,
		        //strokeEnabled: false
		    });
			linearGeneGroup.add(geneElem);
			
			var geneText = "GENE - " + genes[i].externalName + "\n\nEnsembl ID: " + genes[i].ensemblId+ 
			"\nBiotype: Protein Coding"+"\nDescription: " + genes[i].description + "\nSource: " + genes[i].source + 
			"\nChromosome: " + chromosomeId.substring(3,chromosomeId.length)+ "\nStart-Stop: " + genes[i].start +"-"+genes[i].stop + 
			"\nLength: " + (genes[i].stop - genes[i].start);
			geneElem.on('mouseover', function() {
				geneInfoBox.setAbsolutePosition(this.getAbsolutePosition().x, this.getAbsolutePosition().y+8);
				geneInfoBox.setOpacity(1);
				geneInfoBox.setZIndex(4);			
				geneInfoText.setText(geneText);
				geneInfoText.setAbsolutePosition(this.getAbsolutePosition().x, this.getAbsolutePosition().y+8);
				geneInfoText.setOpacity(1);
				geneInfoText.setZIndex(4);
				geneInfoBox.setHeight(geneInfoText.getHeight());
				dynamicTrackLayer.draw(); 
	        });
			
			geneElem.on('mouseout', function() {
				geneInfoBox.setAbsolutePosition(0,0);
				geneInfoBox.setOpacity(0);
				
				geneInfoText.setAbsolutePosition(0,0);
				geneInfoText.setOpacity(0);
				dynamicTrackLayer.draw(); 
	        });
		}());
		
	}
	dynamicTrackLayer.add(linearGeneGroup);
	
	getDivider(baseY - 5, trackLength);
	getDivider(baseY + (numberOfLayers +1)*8, trackLength);
	dynamicTrackLayer.add(dividerGroup);
	
	var totalMarkerCount = Math.floor(currentGenomeLength/1000000);
	var markerCount = 1;
	while(markerCount < (totalMarkerCount + 1) ){
		if(markerCount%5 == 0)
			markerHeight = 15;
		else
			markerHeight = 8;
		var markerX = markerCount*1000000*baseLength;
		var marker = new Kinetic.Line({
			points: [markerX, height - 30, markerX, height - 30 +markerHeight],
			stroke: 'black',
			strokeWidth: 2,
			lineJoin: 'round',
			opacity: 0.4
		});
		markerGroup.add(marker);
		if(markerCount%5 == 0){
			var markerText = new Kinetic.Text({
		        x: markerX - 3,
		        y: height - 30 + markerHeight,
		        text: markerCount,
		        fontSize: 10,
		        fontFamily: 'Calibri',
		        fill: 'green'
		     });
			markerGroup.add(markerText);
		}
		markerCount++;
	}
	
	dynamicTrackLayer.add(markerGroup);
	dynamicTrackLayer.draw();
}

function getDivider(height, trackLength) {
	var divider = new Kinetic.Line({
		  points: [0, height, trackLength, height],
		  stroke: 'black',
		  strokeWidth: 2,
		  lineJoin: 'round',
		  opacity: 0.1
		});
	dividerGroup.add(divider);
}

console.log("dynamic here");