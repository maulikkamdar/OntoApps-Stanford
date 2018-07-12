var width = 0.96*window.innerWidth;
var height = 660 // window.innerHeight - 320 // window.innerHeight - 200
var baseLength = 1/10000;
var trackLength = 0;

var genomeTrackCanvas = new Kinetic.Stage({
	container: 'genomeTrackCanvas',
	width: width,
	height: height, 
});

var staticTrackLayer = new Kinetic.Layer({
	width: width
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

var currentTracks = []; // Keep an array of tracks on the interface to determine the height of the next track.

genomeTrackCanvas.add(dynamicTrackLayer);
genomeTrackCanvas.add(staticTrackLayer);

function populateTracks(){
	var chromosomalData = [];
	for(i in chromosomes) {
		var chromosomeTag = {"id": i, "name": "Chromosome " + i.substring(3, i.length)};
		chromosomalData.push(chromosomeTag);
	}
	d3.select("#chromosomeIds").selectAll("option").data(chromosomalData)
		.enter().append("option").text(function(d) {return d.name; }).attr("value", function(d){ return d.id;});
	drawIdeogramTrack(chromosomalData[0].id);
	drawGenomeTrack(chromosomalData[0].id);
	
	jQuery('#chromosomeIds').multiselect({
		onChange:function(element, checked){
			drawIdeogramTrack(element.val());
			drawGenomeTrack(element.val());
		}
	});
}

var populateTracksTrigger = setInterval(function(){
	if(genomeParsed == true) {
		populateTracks();
		jQuery(".splashScreenExplorer").hide();
		clearInterval(populateTracksTrigger);
	}
}, 10);

//-------------------------- Interface Elements Callback
var playTrackCounter = null;

jQuery('#trackSlider').slider({
	'tooltip': 'hide',
	'value' : 1
}).on('slide', function(ev){
    baseLength = baseLength*ev.value;
    dynamicTrackLayer.draw();
});

jQuery('#play').click(function() {
	playTrackCounter = setInterval(function(){
		var playWidth = dynamicTrackLayer.getAbsolutePosition().x-dynamicTrackLayer.getWidth()/10;
		dynamicTrackLayer.setAbsolutePosition(playWidth, dynamicTrackLayer.getAbsolutePosition().y);
		dynamicTrackLayer.draw();
		if(playWidth-dynamicTrackLayer.getWidth() < -trackLength) {
			clearInterval(playTrackCounter);
		}
	}, 1000);
});

jQuery('#stop').click(function() {
	clearInterval(playTrackCounter);
	dynamicTrackLayer.setAbsolutePosition(100, dynamicTrackLayer.getAbsolutePosition().y);
	dynamicTrackLayer.draw();
})

jQuery('#front').click(function() {
	var playWidth = dynamicTrackLayer.getAbsolutePosition().x-dynamicTrackLayer.getWidth();
	if(playWidth > -trackLength) {
		dynamicTrackLayer.setAbsolutePosition(playWidth, dynamicTrackLayer.getAbsolutePosition().y);
		dynamicTrackLayer.draw();
	}
});

jQuery('#back').click(function() {
	var playWidth = dynamicTrackLayer.getAbsolutePosition().x+dynamicTrackLayer.getWidth();
	if(playWidth-dynamicTrackLayer.getWidth() < 0){
		dynamicTrackLayer.setAbsolutePosition(playWidth, dynamicTrackLayer.getAbsolutePosition().y);
		dynamicTrackLayer.draw();
	}
});

jQuery('#zoomIn').click(function() {
	baseLength *= 2;
	dynamicTrackLayer.draw();
});