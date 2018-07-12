var linearIdeogramGroup = new Kinetic.Group();
var rightStaticLength = 0.95*(width-100);

var staticLayerBg = new Kinetic.Rect({
    x: 0,
    y: 0,
    width: 100,
    height: height,
    fill: '#ffffff',
    stroke: '#cccccc',
    opacity: 1,
    strokeWidth: 1
});

staticTrackLayer.add(staticLayerBg);
staticTrackLayer.draw();

function drawIdeogramTrack(chromosomeId) {
	linearIdeogramGroup.destroy();
	var ideograms = chromosomes[chromosomeId].ideograms;
	var currentGenomeLength = chromosomes[chromosomeId].length;
	var ideogramTrackLength = rightStaticLength/currentGenomeLength;
	
//	var ideogramTrackLength + 100 = (width-100)/currentGenomeLength;
	var acenFrags = 0;
	for(i in ideograms) {
		var color = lookUpTable[ideograms[i].gieStain];
		if(color == null)
			color = {"color": "#ffffff", "opacity": 1};
		if(ideograms[i].gieStain == "acen") {
			if(acenFrags%2 == 0) {
				var point1x = ideograms[i].start*ideogramTrackLength + 100;
				var point2x = ideograms[i].stop*ideogramTrackLength + 100;
				var point3x = ideograms[i].start*ideogramTrackLength + 100;
			} else {
				var point1x = ideograms[i].stop*ideogramTrackLength + 100;
				var point2x = ideograms[i].start*ideogramTrackLength + 100;
				var point3x = ideograms[i].stop*ideogramTrackLength + 100;
			}
			var ideogramElem = new Kinetic.Polygon({
		        points: [point1x, 2.5, point2x, 12.5, point3x, 22.5],
		        fill: color.color,
		        stroke: 'black'
		    });
			acenFrags++;
			linearIdeogramGroup.add(ideogramElem);
		} else {
			var ideogramElem = new Kinetic.Rect({
		        x: ideograms[i].start*ideogramTrackLength + 100,
		        y: 2.5,
		        width: (ideograms[i].stop - ideograms[i].start)*ideogramTrackLength,
		        height: 20,
		        fill: color.color,
		        stroke: 'black',
		        opacity: color.opacity,
		      //  strokeEnabled: false
		    });
			linearIdeogramGroup.add(ideogramElem);
		}
	}
	
	staticTrackLayer.add(linearIdeogramGroup);
	staticTrackLayer.draw();
	
	var pointer = drawIdeogramPointer(currentGenomeLength);
	staticTrackLayer.add(pointer);
	staticTrackLayer.draw();
}

function drawIdeogramPointer(currentGenomeLength) {
	var pointerWidth = rightStaticLength*(width-100)/(currentGenomeLength*baseLength);
	var pointer = new Kinetic.Rect({
	    x: 100,
	    y: 0,
	    width: pointerWidth,
	    height: 25,
	    fill: 'orange',
	    stroke: 'black',
	    opacity: 0.5,
	    strokeWidth: 1,
	    draggable: true,
	    dragBoundFunc: function(pos) {
	    	var newX =  pos.x < 100 ? 100 : pos.x;
	    	newX = newX > rightStaticLength ? rightStaticLength : newX;
	    	console.log(newX);
	    	return {
	    		x: newX,
	        	y: this.getAbsolutePosition().y
	    	}
	    }
	});
	return pointer;
}

console.log("here static");