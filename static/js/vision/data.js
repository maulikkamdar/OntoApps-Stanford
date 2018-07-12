function vizBPLogs(canvasId, fileType) {
    var width = jQuery("#"+ canvasId).width();
    //console.log(width)
    var height = 800;
    var totalOntos = 8;
    var ontoSeparation = 50;
    var eachOntoWidth = (width-100-(totalOntos)*ontoSeparation)/totalOntos;
    var barWidth = eachOntoWidth/4;
    var maxBarHeight = height-600;
    var maxValue = maxBarHeight/4;
    var maxStructDepth = maxBarHeight/11.5;
    var offsetH = 80;
    var structMinWidth = eachOntoWidth/6;

    jQuery.ajax({
        url: fileType,
        type: 'GET',
        success: function(response) {
            output = JSON.parse(response);
            render(output);
        },
        error: function(error) {
            console.log(error);
        }
    });

    var trackCanvas = new Kinetic.Stage({
        container: canvasId,
        width: width,
        height: height, 
    });

    var staticLayer = new Kinetic.Layer({
        width: width
    });

    var staticLayerBg = new Kinetic.Rect({
        x: 0,
        y: 0,
        width: width,
        height: height,
        fill: '#cccccc',
        stroke: '#cccccc',
        opacity: 0.1,
        strokeWidth: 1
    });
    staticLayer.add(staticLayerBg);

    var yAxis = new Kinetic.Line({
        points: [100, 0, 100, height],
        stroke: 'black',
        strokeWidth: 2,
        lineJoin: 'round',
        opacity: 1
    });

    var xAxisLabel = new Kinetic.Text({
        x: 100,
        y: height-50,
        text: "Ontologies",
        fontSize: 40,
        fontFamily: 'Calibri',
        fontStyle: "bold",
        align:"center",
        fill: '#000',
        width: width-100,
        padding: 10
    });

    var xAxis = new Kinetic.Line({
        points: [0, height-offsetH, width, height-80],
        stroke: 'black',
        strokeWidth: 2,
        lineJoin: 'round',
        opacity: 1
    });


    for (i=0; i < 6; i++) {
        var minGrid = new Kinetic.Line({
            points: [100, height-offsetH-maxValue*i, width, height-offsetH-maxValue*i],
            stroke: 'black',
            strokeWidth: 2,
            lineJoin: 'round',
            opacity: 0.2
        });
        staticLayer.add(minGrid);

        var minLabel = new Kinetic.Text({
            x: 0,
            y: height-1.23*offsetH-maxValue*i,
            text: Math.pow(10,i),
            fontSize: 20,
            fontFamily: 'Calibri',
            fontStyle: "bold",
            align:"right",
            fill: '#000',
            width: 100,
            padding: 10
        })
        staticLayer.add(minLabel);

    }

    var legendLayer = new Kinetic.Layer({
        width: width-100,
        x: 50
    })

    for (i = 0; i < 21; i=i+5) {
        var minorGridLabel = new Kinetic.Text({
            x: 0,
            y: maxStructDepth*i+10,
            text: i,
            fontSize: 20,
            fontFamily: 'Calibri',
            fontStyle: "bold",
            align:"right",
            fill: '#000',
            width: 100,
            padding: 10
        })
        staticLayer.add(minorGridLabel);
    }


    staticLayer.add(yAxis);
    //staticLayer.add(syAxis);
    staticLayer.add(xAxis);
    staticLayer.add(xAxisLabel);
    trackCanvas.add(staticLayer);
    trackCanvas.add(legendLayer);

    function getLegendText(x, y, width, text) {
            var legendText = new Kinetic.Text({
                x: x,
                y: y,
                text: text,
                fontSize: 24,
                fontFamily: 'Calibri',
                fill: '#000000',
                width: width,
                fontStyle: "bold",
                padding: 6,
                align: 'left'
            });
            return legendText;
        }

        function getLegendBox(x, y, width){
            var legendBox = new Kinetic.Rect({
                x: x,
                y: y,
                width: width,
                height: 40,
                fill: '#ffffff',
                stroke: '#000000'
            });
            return legendBox;
        }

        function getLegendLine(x,y,fill, stroke) {
            var legendLine = new Kinetic.Line({
                points: [x, y, x+30, y, x+30, y+30, x, y+30],
                fill: fill,
                stroke: "#000",
                strokeWidth: stroke,
                lineJoin: 'round',
                closed:true
            }); 
            return legendLine;
        }

    legendMarkerH = height-maxBarHeight-180
    structMarkerX = 1070
    legendLayer.add(getLegendBox(100, legendMarkerH, 1200));
    legendLayer.add(getLegendLine(120, legendMarkerH+5, "#FFFF00", 1));
    legendLayer.add(getLegendText(150, legendMarkerH, 300, "# Sessions"));
    legendLayer.add(getLegendLine(270, legendMarkerH+5, "#ff0000", 1));
    legendLayer.add(getLegendText(300, legendMarkerH, 300, "# Single Terms"));
    legendLayer.add(getLegendLine(460, legendMarkerH+5, "#0000ff", 1));
    legendLayer.add(getLegendText(490, legendMarkerH, 300, "# Structures"));
    legendLayer.add(getLegendLine(625, legendMarkerH+5, "#00ff00", 1));
    legendLayer.add(getLegendText(655, legendMarkerH, 300, "# Total Terms"));
    legendLayer.add(new Kinetic.Circle({
                x: 820,
                y: legendMarkerH +20,
                radius: 12,
                stroke: "#000",
                fill: "#FFA500"
            }))
    legendLayer.add(getLegendText(835, legendMarkerH, 300, "Single Terms Location"));
    legendLayer.add(new Kinetic.Line({
        points: [structMarkerX, legendMarkerH+30, structMarkerX+30, legendMarkerH+30, structMarkerX+15, legendMarkerH+5],
        closed: true,
        stroke: "#000",
        fill: '#99FFFF',
        opacity: 0.5
    }))
    legendLayer.add(getLegendText(1100, legendMarkerH, 300, "Structure Location"));
    legendLayer.draw();

    var yAxisLabel = new Kinetic.Text({
        x: -5,
        y: height-50,
        text: "Number (Log Scale)",
        fontSize: 28,
        fontFamily: 'Calibri',
        fontStyle: "bold",
        align:"center",
        fill: '#000',
        width: 300,
        rotation: 270,
        padding: 10
    });
    staticLayer.add(yAxisLabel);
    var syAxisLabel = new Kinetic.Text({
        x: -5,
        y: height-500,
        text: "Depth of ontology",
        fontSize: 28,
        fontFamily: 'Calibri',
        fontStyle: "bold",
        align:"center",
        fill: '#000',
        width: 300,
        rotation: 270,
        padding: 10
    });
    staticLayer.add(syAxisLabel);
    staticLayer.draw();

    function render(json) {
        completedLength = 100 + ontoSeparation/2;
        xLabelGroup = new Kinetic.Group();
        sessionBarGroup = new Kinetic.Group();
        singleBarGroup = new Kinetic.Group();
        structBarGroup = new Kinetic.Group();
        totalBarGroup = new Kinetic.Group();
        structGridLines = new Kinetic.Group();
        structGroup = new Kinetic.Group();
        singleTermGroup =  new Kinetic.Group();

        for (key in json) {
            var ontoLabel = new Kinetic.Text({
                x: completedLength,
                y: height-offsetH,
                text: key,
                fontSize: 20,
                fontFamily: 'Calibri',
                fontStyle: "bold",
                align:"center",
                fill: '#000',
                width: eachOntoWidth,
                padding: 10
            });

            var sessionHeight = Math.log10(json[key]["sessions"])*maxValue;
            var sessionBar = new Kinetic.Rect({
                x: completedLength,
                y: height-offsetH-sessionHeight,
                width: barWidth,
                height: sessionHeight,
                fill: '#FFFF00',
                stroke: '#000000',
                opacity: 1,
                strokeWidth: 1
            });

            var singleHeight = Math.log10(json[key]["singles"])*maxValue;
            var singleBar = new Kinetic.Rect({
                x: completedLength+barWidth,
                y: height-offsetH-singleHeight,
                width: barWidth,
                height: singleHeight,
                fill: '#FF0000',
                stroke: '#000000',
                opacity: 1,
                strokeWidth: 1
            });

            var structHeight = Math.log10(json[key]["structs"])*maxValue;
            var structBar = new Kinetic.Rect({
                x: completedLength+2*barWidth,
                y: height-offsetH-structHeight,
                width: barWidth,
                height: structHeight,
                fill: '#0000FF',
                stroke: '#000000',
                opacity: 1,
                strokeWidth: 1
            });

            var totalHeight = Math.log10(json[key]["total"])*maxValue;
            var totalBar = new Kinetic.Rect({
                x: completedLength+3*barWidth,
                y: height-offsetH-totalHeight,
                width: barWidth,
                height: totalHeight,
                fill: '#00FF00',
                stroke: '#000000',
                opacity: 1,
                strokeWidth: 1
            });

            //console.log(json[key]);
            vizDepth = json[key]["maxDepth"] < 22 ? json[key]["maxDepth"] : 21;
            for (i = 0; i < vizDepth; i++) {
                var minorGridline = new Kinetic.Line({
                    points: [completedLength, 30+maxStructDepth*i, completedLength+eachOntoWidth, 30+maxStructDepth*i],
                    stroke: '#333',
                    strokeWidth: 2,
                    lineJoin: 'round',
                    opacity: 0.2
                })
                structGridLines.add(minorGridline);
            }
            if (vizDepth < json[key]["maxDepth"]) {
                var minorGridlineText = new Kinetic.Text({
                    x: completedLength,
                    y: 30+maxStructDepth*vizDepth,
                    fontFamily: 'Calibri',
                    fontStyle: "bold",
                    align:"center",
                    fill: '#333',
                    fontSize: 16,
                    width: eachOntoWidth,
                    text: "-----" + (json[key]["maxDepth"]-vizDepth) + " levels more-----" 
                });
                structGridLines.add(minorGridlineText);
            }

            var midPoint = completedLength + eachOntoWidth/2;

            for (depth in json[key]["noStructs"]) {
                structs = json[key]["noStructs"][depth];
                for (k in structs) {
                    structMismatch = false
                    points = structs[k]["points"];
                    renderedPoints = [];
                    for (p in points) {
                        if (p%2 == 0) {
                            if (points[p] > 0)
                                renderedPoints.push(midPoint + Math.log10(points[p])*structMinWidth)
                            else if (points[p] < 0)
                                renderedPoints.push(midPoint - Math.log10(Math.abs(points[p]))*structMinWidth)
                            else
                                renderedPoints.push(midPoint)
                        } else {
                            if (points[p] == 0)
                                structMismatch = true
                            var yP = structMismatch ? points[p] : points[p]-1;
                            renderedPoints.push(30+yP*maxStructDepth)
                        }
                    }
                    //B232B2
                    //console.log(renderedPoints);
                    console.log(renderedPoints)
                    var struct = new Kinetic.Line({
                        points: renderedPoints,
                        stroke: "#000",
                        fill: '#99FFFF',
                        closed: true,
                        strokeWidth: 2,
                        opacity: 0.2,
                        lineJoin: 'round',
                        tension: 1
                    });
                    //struct.closed(true);
                    structGroup.add(struct);
                }
            }

            for (depth in json[key]["noSingles"]) {
                singles = json[key]["noSingles"][depth].length;
                var singlePoint = new Kinetic.Circle({
                    radius: Math.log10(singles)*5,
                    fill: "#FFA500",
                    stroke: "#000000",
                    x: completedLength+10,
                    y: 30+depth*maxStructDepth
                });
                singleTermGroup.add(singlePoint);
            }

            completedLength = completedLength + ontoSeparation + eachOntoWidth;
            xLabelGroup.add(ontoLabel);
            sessionBarGroup.add(sessionBar);
            singleBarGroup.add(singleBar);
            structBarGroup.add(structBar);
            totalBarGroup.add(totalBar);
        }
        
        staticLayer.add(sessionBarGroup);
        staticLayer.add(singleBarGroup);
        staticLayer.add(structBarGroup);
        staticLayer.add(totalBarGroup);
        staticLayer.add(xLabelGroup);
        staticLayer.add(structGridLines);
        staticLayer.add(structGroup);
        staticLayer.add(singleTermGroup);
        trackCanvas.draw();
    }
}

//jQuery("#bplogsTab").click(function() {
 //   setTimeout(1000);
    vizBPLogs("trackCanvasObo", "logStatsObo")
    vizBPLogs("trackCanvasUmls", "logStatsUmls")
//});