function vizBugs(canvasId, output) {
    jQuery('.splashScreenExplorer').show();
    var width = jQuery("#"+ canvasId).width();
    //console.log(width)
    var height = 900;
    var totalOntos = 4;
    var ontoSeparation = 300;
    //var eachOntoWidth = (width-100-(totalOntos)*ontoSeparation)/totalOntos;
    var eachOntoWidth = 300
    var barWidth = eachOntoWidth/4;
    var maxBarHeight = height-600;
    var maxValue = maxBarHeight/4;
    var maxStructDepth = maxBarHeight/13;
    var offsetH = 80;
    var structMinWidth = eachOntoWidth/10;
    var negator = Math.E

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
        y: height-40,
        text: "Width of the Ontology (Number of Terms in each Hierarchical Layer)",
        fontSize: 24,
        fontFamily: 'Calibri',
        fontStyle: "bold",
        align:"center",
        fill: '#000',
        width: width-100,
        padding: 10
    });

    var xAxis = new Kinetic.Line({
        points: [0, height-offsetH, width, height-offsetH],
        stroke: 'black',
        strokeWidth: 2,
        lineJoin: 'round',
        opacity: 1
    });


    for (i=0; i < 35; i++) {
        var minGrid = new Kinetic.Line({
            points: [100, maxStructDepth*i+30, width, maxStructDepth*i+30],
            stroke: 'black',
            strokeWidth: 2,
            lineJoin: 'round',
            opacity: 0.2
        });
        staticLayer.add(minGrid);

    /*    var minLabel = new Kinetic.Text({
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
        staticLayer.add(minLabel);*/

    }
/*
    var legendLayer = new Kinetic.Layer({
        width: width-100,
        x: 50
    })*/

    for (i = 0; i < 31; i=i+5) {
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
    //trackCanvas.add(legendLayer);

    structMarkerX = 1070

    /*var yAxisLabel = new Kinetic.Text({
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
    staticLayer.add(yAxisLabel);*/
    var syAxisLabel = new Kinetic.Text({
        x: -5,
        y: height-100,
        text: "Depth of Ontology (Number of Hierarchical Layers)",
        fontSize: 28,
        fontFamily: 'Calibri',
        fontStyle: "bold",
        align:"center",
        fill: '#000',
        width: height,
        rotation: 270,
        padding: 10
    });
    staticLayer.add(syAxisLabel);
    staticLayer.draw();

    render(output);

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
                x: completedLength-eachOntoWidth/2,
                y: -10, //height-offsetH
                text: json[key]["onto"],
                fontSize: 32,
                fontFamily: 'Calibri',
                fontStyle: "bold",
                align:"center",
                fill: '#000',
                width: eachOntoWidth*2,
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
            /*vizDepth = json[key]["maxDepth"] < 22 ? json[key]["maxDepth"] : 21;
            for (i = 0; i < vizDepth; i++) {
                var minorGridline = new Kinetic.Line({
                    points: [completedLength, 30+maxStructDepth*i, completedLength+eachOntoWidth*2, 30+maxStructDepth*i],
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
            }*/

            var midPoint = completedLength + eachOntoWidth/2;

            var xAxisMarker = new Kinetic.Line({
                points: [midPoint, height-900, midPoint, height-70],
                stroke: '#cccccc',
                strokeWidth: 2,
                lineJoin: 'round',
                opacity: 0.1
            });

            var xAxisMarkerTxt = new Kinetic.Text({
                text: 1,
                x: midPoint-5,
                y: height-70,
                fontFamily: 'Calibri',
                fontStyle: "bold",
                align:"center",
                fill: '#333',
                fontSize: 16,
                width: 10
            })

            structGridLines.add(xAxisMarker);
            structGridLines.add(xAxisMarkerTxt);
            
            maxl = json[key]["noStructs"][0][0]["maxl"];
            dlist = [0.5, 4.5, 49.5, 499.5, 4999.5]
            alist = [2, 10, 100, 1000, 10000]
            for (m in dlist) {
                pdpoint = midPoint + Math.log(dlist[m]+negator)*structMinWidth
                ndpoint = midPoint - Math.log(dlist[m]+negator)*structMinWidth
                var pxAxisMarker = new Kinetic.Line({
                    points: [pdpoint, height-900, pdpoint, height-70],
                    stroke: '#cccccc',
                    strokeWidth: 2,
                    lineJoin: 'round',
                    opacity: 0.5
                });

                var nxAxisMarker = new Kinetic.Line({
                    points: [ndpoint, height-900, ndpoint, height-80],
                    stroke: '#cccccc',
                    strokeWidth: 2,
                    lineJoin: 'round',
                    opacity: 0.5
                });

                var pxAxisMarkerTxt = new Kinetic.Text({
                    text: alist[m],
                    x: pdpoint - 20,
                    y: height-70,
                    fontFamily: 'Calibri',
                    fontStyle: "bold",
                    align:"center",
                    fill: '#333',
                    fontSize: 16,
                    width: 50
                })

                structGridLines.add(pxAxisMarker);
                structGridLines.add(nxAxisMarker);
                
                structGridLines.add(pxAxisMarkerTxt);
            }
            console.log(maxl);
            //sc_count = 0
            //col_array = ['#2d004b', '#f7f7f7', '#7f3b08']
            for (depth in json[key]["noStructs"]) {
                structs = json[key]["noStructs"][depth];       
                for (k in structs) {
                    structMismatch = false
                    points = structs[k]["points"];
                    renderedPoints = [];
                    for (p in points) {
                        if (p%2 == 0) {
                            if (points[p] > 0)
                                renderedPoints.push(midPoint + Math.log(points[p]+negator)*structMinWidth)
                            else if (points[p] < 0)
                                renderedPoints.push(midPoint - Math.log(Math.abs(points[p])+negator)*structMinWidth)
                            else
                                renderedPoints.push(midPoint)
                        } else {
                            var yP = points[p]
                            renderedPoints.push(30+yP*maxStructDepth)
                        }
                    }
                    //B232B2
                    //console.log(renderedPoints);
                    if(structs[k]["session"].trim() == json[key]["onto"].trim()){
                        console.log("here")
                    }
                    var struct = new Kinetic.Line({
                        points: renderedPoints,
                        stroke: "#000",
                        fill: structs[k]["session"].trim() == json[key]["onto"].trim() ? "#FF0000" : (structs[k]["session"].trim() == "pubchem" ? '#00FF00' : '#99FFFF'),
                        //fill: structs[k]["session"].trim() == json[key]["onto"].trim() ? "#FF0000" : '#99FFFF',
                        //fill: "#FF0000",
                        closed: true,
                        strokeWidth: 2,
                        opacity: 0.2,
                        lineJoin: 'round',
                        tension: 0
                    });
                    //sc_count += 1;
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
        
        //staticLayer.add(sessionBarGroup);
        //staticLayer.add(singleBarGroup);
        //staticLayer.add(structBarGroup);
        //staticLayer.add(totalBarGroup);
        staticLayer.add(xLabelGroup);
        staticLayer.add(structGridLines);
        staticLayer.add(structGroup);
        staticLayer.add(singleTermGroup);
        trackCanvas.draw();
        jQuery('.splashScreenExplorer').hide();
    }
}