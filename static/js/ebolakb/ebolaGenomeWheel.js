var width = jQuery("#genomicsDiv").width() - 50;
var height = jQuery("#genomicsDiv").width() - 50;
var ebolaBaseLength = 18959;

var ui = {
    stage: null,
    scale: 1,
    zoomFactor: 1.1,
    origin: {
        x: 0,
        y: 0
    },
    zoom: function(event) {
        event.preventDefault();
        var evt = event.originalEvent,
            mx = evt.clientX /* - canvas.offsetLeft */ ,
            my = evt.clientY /* - canvas.offsetTop */ ,
            wheel = evt.wheelDelta / 120;
        var zoom = (ui.zoomFactor - (evt.wheelDelta < 0 ? 0.2 : 0));
        var newscale = ui.scale * zoom;
        ui.origin.x = mx / ui.scale + ui.origin.x - mx / newscale;
        ui.origin.y = my / ui.scale + ui.origin.y - my / newscale;

        ui.stage.setOffset(ui.origin.x, ui.origin.y);
        ui.stage.setScale(newscale);
        ui.stage.draw();

        ui.scale *= zoom;
    }
};

var stage = ui.stage = new Kinetic.Stage({
    container: 'offsetDiv',
    width: width,
    height: height, // window.innerHeight - 200
    draggable: true
});

var genomeLayer = new Kinetic.Layer();
var chromosomeLayer = new Kinetic.Group();
var center = {
    "x": width / 2,
    "y": height / 2
};
var minDimension = width;
var genomeOuterRadius = (minDimension * 0.95) / 2;
var genomeInnerRadius = (minDimension * 0.60) / 2;
var proteinOuterRadius = (minDimension * 0.93) / 2;
var sliceAngle = Math.PI / 90;
var baseMarkerSpace = 100;
var genomeId = "http://bio2rdf.org/ebola:EBOV";

var geneInfoBlob = new Kinetic.Text({
    x: 0,
    y: 0,
    text: 'Protein Name - \n\nNCBI Reference Sequence: \nDescription: \n',
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

genomeLayer.add(geneInfoBlobBox);
genomeLayer.add(geneInfoBlob);
geneInfoBlobBox.hide()
geneInfoBlob.hide()

function drawChromosomeLayer() {
    baseAngle = (2 * Math.PI - sliceAngle) / ebolaBaseLength;
    var markerAngle = baseMarkerSpace * baseAngle;
    var onAngle = sliceAngle / 2 - Math.PI / 2;
    var genomeEndAngle = onAngle + ebolaBaseLength * baseAngle;

    var chromosomeGroup = new Kinetic.Group({
        id: genomeId
    })
    var genomeBackFill = getArc(onAngle, genomeEndAngle, genomeInnerRadius, genomeOuterRadius, "#ff0000", 1, "ebol-ebola", "Ebola Genome");
    chromosomeGroup.add(genomeBackFill);

    var totalMarkerCount = Math.floor(ebolaBaseLength / baseMarkerSpace);
    var chromosomeBorderFill = getArcOutline(onAngle, genomeEndAngle, genomeInnerRadius, genomeOuterRadius,
        totalMarkerCount, markerAngle, "ebol-border", "Ebola Genome", 1);
    chromosomeGroup.add(chromosomeBorderFill);

    var pront = 0;

    var proteinLayer = new Kinetic.Group({
        id: 'ebola_protein'
    })
    var domainLayer = new Kinetic.Group({
        id: 'ebola_domain'
    })
    for (i in proteins) {
        var ebolaProtein = proteins[i];
        var startAngle = onAngle + ebolaProtein.start * baseAngle;
        var endAngle = onAngle + ebolaProtein.stop * baseAngle;

        var adjunctRadius = proteinOuterRadius - genomeInnerRadius;

        var iter = pront % 3;
        var specificInnerRadius = genomeInnerRadius + (iter) * (adjunctRadius / 3) + 2.5;
        var specificOuterRadius = genomeInnerRadius + (iter + 1) * (adjunctRadius / 3) - 2.5;

        var proteinBackFill = getArc(startAngle, endAngle, specificInnerRadius, specificOuterRadius, "#00ff00", 1, "protein-" + ebolaProtein.id, ebolaProtein.name);
        proteinLayer.add(proteinBackFill);
        pront++;

        var dont = 0;
        var ddiv = 1; //change this to accommodate domains in protein width
        for (j in ebolaProtein.domains) {
            var ebolaDomain = ebolaProtein.domains[j];
            var domainStartAngle = startAngle + ebolaDomain.start * baseAngle * 3;
            var domainStopAngle = startAngle + ebolaDomain.stop * baseAngle * 3;

            var dpAdjunctRadius = 0.7 * (specificOuterRadius - specificInnerRadius);
            var iterD = dont % ddiv;
            var spDomainInnerRadius = specificInnerRadius + (iterD) * (dpAdjunctRadius / ddiv);
            var spDomainOuterRadius = specificInnerRadius + (iterD + 1) * (dpAdjunctRadius / ddiv);

            var domainBackFill = getArc(domainStartAngle, domainStopAngle, spDomainInnerRadius, spDomainOuterRadius, "#0000ff", 1, "domain-" + ebolaDomain.id, ebolaDomain.signature);
            domainLayer.add(domainBackFill);
            dont++;
        }
    }

    chromosomeGroup.add(proteinLayer);
    chromosomeGroup.add(domainLayer);
    //domainLayer.setVisible(false);

    // ---- Event Binding Callbacks
    chromosomeGroup.on('mouseover', function(evt) {
        document.body.style.cursor = 'pointer';

        var chromosomalArc = evt.targetNode;
        console.log(evt)
        var targetNodeType = chromosomalArc.getId().split("-")[0];
        var targetNodeId = chromosomalArc.getId().split("-")[1];

        if (targetNodeType == "protein") {
            var protein = proteins[proteinLocator[targetNodeId]];
            proteinText = 'Gene Product Name - ' + protein.proteinName + '\n\nNCBI Reference Sequence: ' + protein.id + '\nDescription: ' + protein.proteinDescription + '\n';
            geneInfoBlobBox.setAbsolutePosition(0, 0);
            geneInfoBlobBox.setOpacity(1);
            geneInfoBlobBox.setZIndex(10);
            geneInfoBlob.setText(proteinText);
            geneInfoBlob.setAbsolutePosition(0, 0);
            geneInfoBlob.setOpacity(1);
            geneInfoBlob.setZIndex(10);
            geneInfoBlobBox.setHeight(geneInfoBlob.getHeight());
            geneInfoBlobBox.show();
            geneInfoBlob.show();
            genomeLayer.draw();
        } else if (targetNodeType == "domain") {
            if (typeof domainLocator[targetNodeId] !== "undefined") {
                var domainPos = domainLocator[targetNodeId].split('_');
                var domain = proteins[parseInt(domainPos[0])].domains[parseInt(domainPos[1])];
                domainText = 'Domain ID - ' + domain.id + '\n\nDomain System: ' + domain.domainSystem + '\nDomain Signature: ' + domain.signature + '\nInterpro Id: ' + domain.interproId + '\nInterpro Name: ' + domain.interproName;
                geneInfoBlobBox.setAbsolutePosition(0, 0);
                geneInfoBlobBox.setOpacity(1);
                geneInfoBlobBox.setZIndex(10);
                geneInfoBlob.setText(domainText);
                geneInfoBlob.setAbsolutePosition(0, 0);
                geneInfoBlob.setOpacity(1);
                geneInfoBlob.setZIndex(10);
                geneInfoBlobBox.setHeight(geneInfoBlob.getHeight());
                geneInfoBlobBox.show();
                geneInfoBlob.show();
                genomeLayer.draw();
            } else {
                console.log(targetNodeId);
            }

        }
    });

    chromosomeGroup.on('mouseout', function(evt) {
        document.body.style.cursor = 'default';
        geneInfoBlobBox.setAbsolutePosition(-1000, -1000);
        geneInfoBlobBox.setOpacity(0);

        geneInfoBlob.setAbsolutePosition(-1000, -1000);
        geneInfoBlob.setOpacity(0);
        geneInfoBlobBox.hide();
        geneInfoBlob.hide();
        genomeLayer.draw();
    });

    chromosomeGroup.on('click', function(evt) {
        var chromosomalArc = evt.targetNode;
        var targetNodeType = chromosomalArc.getId().split("-")[0];
        var targetNodeId = chromosomalArc.getId().split("-")[1];

        var repInnerRadius, repOuterRadius, proteinOuterRadius, domainOuterRadius;

        makeRequest(targetNodeType, targetNodeId);
    });


    chromosomeLayer.add(chromosomeGroup);
    genomeLayer.add(chromosomeLayer);

    genomeRendered = true;
    genomeLayer.draw();
}

function getArc(currentAngle, endAngle, innerRadius, outerRadius, fill, opacity, id, name) {
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
    //arcElem.setZIndex(5);
    return arcElem;
}

function getArcOutline(currentAngle, endAngle, innerRadius, outerRadius, totalMarkerCount, markerAngle, id, name, pointer, startM, endM) {
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

function drawingFunction(context, arcElem, innerRadius, outerRadius, currentAngle, endAngle) {
    context.beginPath();
    context.arc(center.x, center.y, innerRadius, endAngle, currentAngle, true);
    context.lineTo(center.x + outerRadius * Math.cos(currentAngle), center.y + outerRadius * Math.sin(currentAngle));
    context.arc(center.x, center.y, outerRadius, currentAngle, endAngle);
    context.lineTo(center.x + innerRadius * Math.cos(endAngle), center.y + innerRadius * Math.sin(endAngle));
    context.closePath();
    context.fillStrokeShape(arcElem);
}

function outlineDrawingFunction(context, arcElem, innerRadius, outerRadius,
    currentAngle, endAngle, totalMarkerCount, markerAngle, chromosomeName, pointer, startM, endM) {
    context.beginPath();
    context.arc(center.x, center.y, innerRadius, endAngle, currentAngle, true);
    context.lineTo(center.x + outerRadius * Math.cos(currentAngle), center.y + outerRadius * Math.sin(currentAngle));
    var markerCount = 0;
    var currentMarkerAngle = currentAngle;
    var endMarkerAngle = currentAngle;
    while (markerCount < totalMarkerCount) {
        currentMarkerAngle = currentAngle + markerCount * markerAngle;
        endMarkerAngle = currentAngle + (markerCount + 1) * markerAngle;
        context.arc(center.x, center.y, outerRadius, currentMarkerAngle, endMarkerAngle);

        // ----- All the effort for markers
        if (typeof pointer == "undefined")
            pointer = 1;
        if ((markerCount + 1) % (5 * pointer) == 0) {
            context.save();
            context.translate(center.x + outerRadius * 1.022 * Math.cos(endMarkerAngle), center.y + outerRadius * 1.022 * Math.sin(endMarkerAngle));
            context.font = "10px Georgia";
            if (endMarkerAngle < Math.PI / 2) {
                context.rotate(endMarkerAngle);
                context.fillText((markerCount + 1) / pointer, 0, 4);
            } else {
                context.rotate(endMarkerAngle + Math.PI);
                context.fillText((markerCount + 1) / pointer, -9, 4);
            }
            context.restore();
            context.lineTo(center.x + outerRadius * 1.02 * Math.cos(endMarkerAngle), center.y + outerRadius * 1.02 * Math.sin(endMarkerAngle));
        } else
            context.lineTo(center.x + outerRadius * 1.012 * Math.cos(endMarkerAngle), center.y + outerRadius * 1.012 * Math.sin(endMarkerAngle));
        // -----

        markerCount++;
    }

    // ----- Print Chromosome names
    /*var textAngle = (currentAngle+endAngle)/2;
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
    context.restore();*/
    // -------

    context.arc(center.x, center.y, outerRadius, endMarkerAngle, endAngle);
    context.lineTo(center.x + innerRadius * Math.cos(endAngle), center.y + innerRadius * Math.sin(endAngle));
    context.closePath();
    context.fillStrokeShape(arcElem);
}


stage.add(genomeLayer);
console.log("wheel here");
jQuery(stage.content).on('mousewheel', ui.zoom);