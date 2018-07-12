var ScatterPlot = function (scatterDiv) {
    this.canvasId = scatterDiv;
}

ScatterPlot.prototype.load_base_canvas = function () {
    this.width = jQuery("#"+ canvasId).width();
    this.height = 680;
    this.offsetW = 70;
    this.offsetH = 50;
    this.xtickH = 10;
    this.ytickH = 10;
    this.minH = 10;
    this.minW = 10;
    this.plotWidth = width-offsetW-minW
    this.plotHeight = height-offsetH-minH
    this.GRID_COLOR = "#FFFFFF";
    this.tick_label_box_size = 40;
    this.axis_label_box_size = 200;
    this.category_dict = {}
    this.boxLayer_shown = false;

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
                mx = evt.clientX /* - canvas.offsetLeft */,
                my = evt.clientY /* - canvas.offsetTop */,
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

    var trackCanvas = ui.stage = new Kinetic.Stage({
        container: canvasId,
        width: width,
        height: height,
        draggable: false
    });

    var staticLayer = new Kinetic.Layer({
        width: width
    });

    var dynamicLayer = new Kinetic.Layer({
        width: width
    });

    var staticLayerBg = new Kinetic.Rect({
        x: offsetW,
        y: minH,
        width: plotWidth,
        height: plotHeight,
        fill: '#cccccc',
        stroke: '#000000',
        opacity: 0.5,
        strokeWidth: 1
    });
    staticLayer.add(staticLayerBg);

    var axisLines = new Kinetic.Group();

    var yAxis = new Kinetic.Line({
        points: [offsetW, minH, offsetW, height-offsetH],
        stroke: 'black',
        strokeWidth: 1,
        lineJoin: 'round',
        opacity: 1
    });

    var xAxis = new Kinetic.Line({
        points: [offsetW, height-offsetH, width-minW, height-offsetH],
        stroke: 'black',
        strokeWidth: 1,
        lineJoin: 'round',
        opacity: 1
    });

    var legendBox_width = 200
    var legendLayer = new Kinetic.Layer();
    var legendLayer_shown = false;
    var leg_start_x = plotWidth-legendBox_width+offsetW-minW
    var leg_start_y = 20
    var legendBox = new Kinetic.Rect({
        x: leg_start_x,
        y: leg_start_y,
        width: legendBox_width,
        height: plotHeight-minH-10,
        fill: "#ffffff",
        stroke: "#000000",
        strokeWidth: 1,
        opacity: 0.8
    })

    var legendLabel = canvas_text(leg_start_x + 20, leg_start_y + 5, "Categories", 32, legendBox_width-20, 0)
    var legendLine = new Kinetic.Line({
                            points: [leg_start_x+10, leg_start_y + 40, leg_start_x + legendBox_width-20, leg_start_y+40],
                            stroke: "#000000",
                            closed: false,
                            strokeWidth: 2,
                            lineJoin: 'round'
                        });

    legendLayer.add(legendBox);
    legendLayer.add(legendLabel);
    legendLayer.add(legendLine);
    legendLayer.hide()
    axisLines.add(yAxis);
    axisLines.add(xAxis);
    staticLayer.add(axisLines);
    trackCanvas.add(staticLayer);
    trackCanvas.add(dynamicLayer);
    trackCanvas.add(legendLayer);
    trackCanvas.draw();
}

function transform(_2dpoint, xlim, ylim) {
    point_x = offsetW + (_2dpoint[0] - xlim["xmin"])*plotWidth/(xlim["xmax"] - xlim["xmin"]);
    point_y = height - (offsetH + (_2dpoint[1] - ylim["ymin"])*plotHeight/(ylim["ymax"] - ylim["ymin"]));
    trans_point = [point_x, point_y];
    //console.log(trans_point);
    return trans_point;
}

function render(output) {
    console.log(output["points"].length)
    //dynamicLayer.destroy();
    category_dict = {}
    points = new Kinetic.Group();
    gridGroup = new Kinetic.Group();
    xtickGroup = new Kinetic.Group();
    ytickGroup = new Kinetic.Group();
    xgridLines = new Kinetic.Group();
    ygridLines = new Kinetic.Group();
    customLegendGroup = new Kinetic.Group(); 

    gridGroup.add(canvas_text(plotWidth/2-axis_label_box_size/2, height-offsetH+xtickH*3, output["chart_props"]["xaxislabel"], 16, axis_label_box_size, 0));
    yaxis_label = canvas_text(minW-ytickH, plotHeight/2+axis_label_box_size/2, output["chart_props"]["yaxislabel"], 16, axis_label_box_size, 0);
    yaxis_label.rotation(270);
    gridGroup.add(yaxis_label);
    //points = sample_shape_generator();
    for (k in output["chart_props"]["xticks"]) {
        point_pos = transform([output["chart_props"]["xticks"][k], output["chart_props"]["ylims"]["ymin"]], output["chart_props"]["xlims"], output["chart_props"]["ylims"])
        xtickGroup.add(new Kinetic.Line({points: [point_pos[0], point_pos[1], point_pos[0], point_pos[1] + ytickH], stroke: "#000000", closed: false, strokeWidth: 2}))
        xtickGroup.add(canvas_text(point_pos[0]-tick_label_box_size/6, point_pos[1] + 1.5*ytickH, output["chart_props"]["xticklabels"][k], 12, tick_label_box_size, 0));
        xgridLines.add(new Kinetic.Line({points: [point_pos[0], point_pos[1], point_pos[0], point_pos[1] - plotHeight], stroke: GRID_COLOR, closed: false, strokeWidth: 1}))
    }
    for (k in output["chart_props"]["yticks"]) {
        point_pos = transform([output["chart_props"]["xlims"]["xmin"], output["chart_props"]["yticks"][k]], output["chart_props"]["xlims"], output["chart_props"]["ylims"])
        ytickGroup.add(new Kinetic.Line({points: [point_pos[0], point_pos[1], point_pos[0] - xtickH, point_pos[1]], stroke: "#000000", closed: false, strokeWidth: 2}))
        ytickGroup.add(canvas_text(point_pos[0] - 1.5*xtickH-2*tick_label_box_size/3, point_pos[1]-6, output["chart_props"]["yticklabels"][k], 12, tick_label_box_size, 0));
        ygridLines.add(new Kinetic.Line({points: [point_pos[0], point_pos[1], point_pos[0] + plotWidth, point_pos[1]], stroke: GRID_COLOR, closed: false, strokeWidth: 1}))
    }
    gridGroup.add(xgridLines);
    gridGroup.add(ygridLines);
    gridGroup.add(xtickGroup);
    gridGroup.add(ytickGroup);
    for (k in output["points"]) {
        point_pos = transform([output["points"][k]["x"], output["points"][k]["y"]], output["chart_props"]["xlims"], output["chart_props"]["ylims"])
        //console.log(output["points"][k]["shape"])
        shape = shapes_lib[output["points"][k]["shape"]](point_pos[0], point_pos[1], output["points"][k]["size"], output["points"][k]["color"], output["points"][k]["color"], output["points"][k]["alpha"], true);
        points.add(shape)
    }

    var leg_count = 0;
    var leg_height = 20;
    var leg_x = leg_start_x + 10;
    var allowed_width = legendBox_width-40;
    for (k in output["category_mapper"]) {
        leg_text = output["category_mapper"][k]["label"];
        posy = leg_start_y + 60 + leg_count*leg_height;
        leg_group = new Kinetic.Group();
        leg = canvas_text(leg_x + 24, posy, leg_text, 16, allowed_width, 0, k)
        leg_group.add(leg);
        leg_shape = shapes_lib[output["category_mapper"][k]["assig_shape"]](leg_x + 10, posy + 8, 16, '#800026', '#800026', 1, false);
        leg_group.add(leg_shape);
        leg_count = leg_count + 1 + parseInt(leg_text.width("16px Calibri")/allowed_width);
        leg_group.on('mouseover', function(evt){
            document.body.style.cursor = 'pointer';
            var mousePos = stage.getPointerPosition();
            var node = evt.target.attrs;

            console.log(node);
        });
        customLegendGroup.add(leg_group);
    }
    legendLayer.add(customLegendGroup);
    dynamicLayer.add(gridGroup);
    dynamicLayer.add(points);
    trackCanvas.draw();
}

/*chromConLayer.on('mouseover', function(evt){
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
    });*/



    
jQuery.get('/get_quantiles', function(data){
    for (k in data) {
        jQuery("#cselect-widget").append($('<option>', {value:data[k], text:k}));
        jQuery("#sselect-widget").append($('<option>', {value:data[k], text:k}));
    }
},'json');

jQuery("#legend_info").click(function(){
    if (!legendLayer_shown) {
        legendLayer.show();
        trackCanvas.draw();
        legendLayer_shown = true;  
    } else {
        legendLayer_shown = false;
        legendLayer.hide();
        trackCanvas.draw();
    }
});

jQuery("#boxselect").click(function(){
    if (!boxLayer_shown) {
        layer = generate_selection_box();
        trackCanvas.add(layer);
        trackCanvas.draw();
        boxLayer_shown = true;
        $("#boxselect").toggleClass('btn-default btn-success');
    } else {
        boxLayer_shown = false;
        layer.destroy();
        trackCanvas.draw();
        $("#boxselect").toggleClass('btn-success btn-default');
    }
})