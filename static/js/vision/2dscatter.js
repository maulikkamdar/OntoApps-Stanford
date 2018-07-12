var ScatterPlot = function (scatterDiv, plot_type) {
    this.canvasId = scatterDiv;
    this.plot_type = plot_type;
}

ScatterPlot.prototype.load_base_canvas = function () {
    this.width = jQuery("#"+ this.canvasId).width();
    this.height = 800;
    this.offsetW = 70;
    this.offsetH = 50;
    this.xtickH = 10;
    this.ytickH = 10;
    this.minH = 10;
    this.minW = 10;
    this.plotWidth = this.width-this.offsetW-this.minW
    this.plotHeight = this.height-this.offsetH-this.minH
    this.GRID_COLOR = "#FFFFFF";
    this.tick_label_box_size = 40;
    this.axis_label_box_size = 400;
    this.category_dict = {}
    this.boxLayer_shown = false;
    this.is_drag = false;
    this.is_zoom_in = false;
    this.is_zoom_out = false;
    this.zoomFactor = 1.1;
    this.point_pos_dict = {};
    this.point_dict = {}

    this.classInfoBlob = new Kinetic.Text({
        x: 0,
        y: 0,
        text: 'Class - \n\nClass ID: \nParents: \nDescription: ',
        fontSize: 16,
        fontFamily: 'Calibri',
        fill: '#555',
        width: 300,
        padding: 10,
        opacity: 0
    });

    this.classInfoBlobBox = new Kinetic.Rect({
        x: 0,
        y: 0,
        stroke: '#555',
        strokeWidth: 1,
        fill: '#ddd',
        width: 300,
        height: 0,
        shadowColor: 'black',
        shadowBlur: 4,
        shadowOffset: [3, 3],
        opacity: 0,
        cornerRadius: 3
    });

    this.hoverGroup = new Kinetic.Group();
    this.hoverLayer = new Kinetic.Layer({
        width: this.width
    });
    
    this.hoverGroup.add(this.classInfoBlobBox);
    this.hoverGroup.add(this.classInfoBlob);
    this.hoverLayer.add(this.hoverGroup);
    this.hoverGroup.setDraggable(true);

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

    this.trackCanvas = ui.stage = new Kinetic.Stage({
        container: this.canvasId,
        width: this.width,
        height: this.height,
        draggable: false
    });

    var staticLayer = new Kinetic.Layer({
        width: this.width
    });

    var staticLayerBg = new Kinetic.Rect({
        x: this.offsetW,
        y: this.minH,
        width: this.plotWidth,
        height: this.plotHeight,
        fill: '#cccccc',
        stroke: '#000000',
        opacity: 0.5,
        strokeWidth: 1
    });
    staticLayer.add(staticLayerBg);

    axisLines = get_axis_group(this.width, this.height, this.offsetW, this.offsetH, this.minW, this.minH);
    this.legend = new Legend(200);
    this.legend.gen_legend_box(this.plotWidth, this.plotHeight, this.offsetW, this.offsetH, this.minW, this.minH);
    this.legend.legendLayer.hide()

    this.dynamicLayer = new Kinetic.Layer({
        width: this.width
    });

    this.dataGroup = new Kinetic.Group();
    this.customLegendGroup = new Kinetic.Group();
    staticLayer.add(axisLines);
    this.trackCanvas.add(staticLayer);
    this.trackCanvas.add(this.dynamicLayer);
    this.trackCanvas.add(this.legend.legendLayer);
    this.trackCanvas.add(this.hoverLayer);
    
    this.trackCanvas.draw();
}

ScatterPlot.prototype.transform = function (_2dpoint, xlim, ylim) {
    point_x = this.offsetW + (_2dpoint[0] - xlim["xmin"])*this.plotWidth/(xlim["xmax"] - xlim["xmin"]);
    point_y = this.height - (this.offsetH + (_2dpoint[1] - ylim["ymin"])*this.plotHeight/(ylim["ymax"] - ylim["ymin"]));
    trans_point = [point_x, point_y];
    //console.log(trans_point);
    return trans_point;
}

ScatterPlot.prototype.reverse_transform = function (_2dpoint, xlim, ylim) {
    return [];
}

ScatterPlot.prototype.render = function (output) {
    console.log(output["added_features"])
    this.dataGroup.remove();
    this.customLegendGroup.remove();
    this.dataGroup = new Kinetic.Group()
    this.category_dict = {}

    points = new Kinetic.Group();
    gridGroup = new Kinetic.Group();
    xtickGroup = new Kinetic.Group();
    ytickGroup = new Kinetic.Group();
    xgridLines = new Kinetic.Group();
    ygridLines = new Kinetic.Group();
    this.customLegendGroup = new Kinetic.Group(); 

    gridGroup.add(canvas_text(this.plotWidth/2 - output["chart_props"]["xaxislabel"].width("16px Calibri")/2, this.height - this.offsetH + this.xtickH*3, output["chart_props"]["xaxislabel"], 16, this.axis_label_box_size, 0));
    console.log(output["chart_props"]["yaxislabel"].width("16px Calibri"));
    yaxis_label = canvas_text(this.minW - this.ytickH, this.plotHeight/2 + output["chart_props"]["yaxislabel"].width("16px Calibri")/2, output["chart_props"]["yaxislabel"], 16, this.axis_label_box_size, 0);
    yaxis_label.rotation(270);
    gridGroup.add(yaxis_label);

    for (k in output["chart_props"]["xticks"]) {
        point_pos = this.transform([output["chart_props"]["xticks"][k], output["chart_props"]["ylims"]["ymin"]], output["chart_props"]["xlims"], output["chart_props"]["ylims"])
        xtickGroup.add(new Kinetic.Line({points: [point_pos[0], point_pos[1], point_pos[0], point_pos[1] + this.ytickH], stroke: "#000000", closed: false, strokeWidth: 2}))
        xtickGroup.add(canvas_text(point_pos[0] - this.tick_label_box_size/6, point_pos[1] + 1.5*this.ytickH, output["chart_props"]["xticklabels"][k], 12, this.tick_label_box_size, 0));
        xgridLines.add(new Kinetic.Line({points: [point_pos[0], point_pos[1], point_pos[0], point_pos[1] - this.plotHeight], stroke: this.GRID_COLOR, closed: false, strokeWidth: 1}))
    }
    for (k in output["chart_props"]["yticks"]) {
        point_pos = this.transform([output["chart_props"]["xlims"]["xmin"], output["chart_props"]["yticks"][k]], output["chart_props"]["xlims"], output["chart_props"]["ylims"])
        ytickGroup.add(new Kinetic.Line({points: [point_pos[0], point_pos[1], point_pos[0] - this.xtickH, point_pos[1]], stroke: "#000000", closed: false, strokeWidth: 2}))
        ytickGroup.add(canvas_text(point_pos[0] - 1.5*this.xtickH - 2*this.tick_label_box_size/3, point_pos[1]-6, output["chart_props"]["yticklabels"][k], 12, this.tick_label_box_size, 0));
        ygridLines.add(new Kinetic.Line({points: [point_pos[0], point_pos[1], point_pos[0] + this.plotWidth, point_pos[1]], stroke: this.GRID_COLOR, closed: false, strokeWidth: 1}))
    }
    gridGroup.add(xgridLines);
    gridGroup.add(ygridLines);
    gridGroup.add(xtickGroup);
    gridGroup.add(ytickGroup);

    var legendLabel = canvas_text(this.legend.leg_start_x + 20, this.legend.leg_start_y + 5, "Categories", 32, this.legend.legendBox_width - 20, 0)
    var legendLine = new Kinetic.Line({
                            points: [this.legend.leg_start_x + 10, this.legend.leg_start_y + 40, this.legend.leg_start_x + this.legend.legendBox_width - 20, this.legend.leg_start_y + 40],
                            stroke: "#000000",
                            closed: false,
                            strokeWidth: 2,
                            lineJoin: 'round'
                        });

    this.legend.legendLayer.add(legendLabel);
    this.legend.legendLayer.add(legendLine);

    var leg_count = 0;
    var leg_height = 20;
    var leg_x = this.legend.leg_start_x + 10;
    var allowed_width = this.legend.legendBox_width-40;

    for (k in output["category_mapper"]) {
        leg_text = output["category_mapper"][k]["label"];
        posy = this.legend.leg_start_y + 60 + leg_count*leg_height;
        leg_group = new Kinetic.Group();
        leg = canvas_text(leg_x + 40, posy, leg_text, 16, allowed_width, 0, k)
        leg_group.add(leg);
        leg_shape = shapes_lib[output["category_mapper"][k]["assig_shape"]](leg_x + 28, posy + 8, 16, '#800026', '#800026', 1, false);
        leg_group.add(leg_shape);
        leg_check = shapes_lib["square"](leg_x + 6, posy + 8, 14, "#000", "#000", 1, false);
        leg_check_mark = shapes_lib["tick"](leg_x + 6, posy + 8, 14, "#000", "#000", 1, false);
        //leg_check_mark.setId("check_" + k);
        leg_group.add(leg_check);
        leg_group.add(leg_check_mark);
        this.category_dict[k] = {"show": true, "points": new Kinetic.Group(), "tick": leg_check_mark}
        leg_count = leg_count + 1 + parseInt(leg_text.width("16px Calibri")/allowed_width);
        stage = this.trackCanvas;
        leg_group.on('mouseover', function(evt){
            document.body.style.cursor = 'pointer';
        });
        leg_group.on('mouseout', function(evt){
            document.body.style.cursor = 'default';
        });
        plot = this;
        leg_group.on('click', function(evt){
            document.body.style.cursor = 'pointer';
            var mousePos = stage.getPointerPosition();
            var node = evt.target.attrs;
            plot.show_hide_category(node);
        })
        this.customLegendGroup.add(leg_group);
        points.add(this.category_dict[k]["points"]);
    }

    point_dict = this.point_dict;
    for (k in output["points"]) {
        point_pos = this.transform([output["points"][k]["x"], output["points"][k]["y"]], output["chart_props"]["xlims"], output["chart_props"]["ylims"])
        point_pos_identifer = Math.round(point_pos[0]) + ":-:" + Math.round(point_pos[1]);
        this.point_dict[output["points"][k]["index"]] = output["points"][k]["label"];
        this.point_pos_dict[point_pos_identifer] = output["points"][k]["index"]
        shape = shapes_lib[output["points"][k]["shape"]](point_pos[0], point_pos[1], output["points"][k]["size"], output["points"][k]["color"], output["points"][k]["color"], output["points"][k]["alpha"], true);
        shape.setId(output["points"][k]["index"]);
        plot = this;
        shape.on('mouseover', function(evt) {
            document.body.style.cursor = 'pointer';
            var node = evt.target.attrs;
            nparts = node["id"].split(":^:")
            label = point_dict[node["id"]];
            if (nparts.length > 1) {
                info = nparts.slice(0,5).join(", ") + " ..."
                var classInfo = label + "\n\n" + info + "\n Click for more details";
            } else {
                var classInfo = 'Class Label: ' + label + '\n\nClass ID: ' + node["id"] //+ '\nDescription: ' + output["description"];
            }
            plot.classInfoBlobBox.setAbsolutePosition({"x": evt.evt.layerX + 5, "y": evt.evt.layerY + 5});
            plot.classInfoBlobBox.setOpacity(1);
            plot.classInfoBlobBox.setZIndex(10);          
            plot.classInfoBlob.setText(classInfo);
            plot.classInfoBlob.setAbsolutePosition({"x": evt.evt.layerX + 5, "y": evt.evt.layerY + 5});
            plot.classInfoBlob.setOpacity(1);
            plot.classInfoBlob.setZIndex(10);
            plot.classInfoBlobBox.setHeight(plot.classInfoBlob.getHeight());
            plot.hoverLayer.draw();
        });
        shape.on('mouseout', function(evt) {
            document.body.style.cursor = 'default';
            plot.classInfoBlobBox.setAbsolutePosition({"x": 0, "y": 0});
            plot.classInfoBlobBox.setOpacity(0);
            
            plot.classInfoBlob.setAbsolutePosition({"x": 0, "y": 0});
            plot.classInfoBlob.setOpacity(0);
            plot.classInfoBlobBox.setHeight(0);
            plot.hoverLayer.draw(); 
        });
        shape.on('click', function(evt) {
            var node = evt.target.attrs;
            jQuery.ajax({
                url: "/class_info?class_id=" + node["id"] + "&user_id=" + storage.getItem("user"),
                type: 'GET',
                beforeSend: function(){
                    jQuery('.splashScreenExplorer').show();
                },
                complete: function(){
                    jQuery('.splashScreenExplorer').hide();
                },
                success: function(response) {     
                    output = JSON.parse(response);
                    console.log(output);
                },
                error: function(error) {
                    console.log(error);
                }
            });
        });
        if (typeof this.category_dict[output["points"][k]["cat_1d"]] !== "undefined") {
            this.category_dict[output["points"][k]["cat_1d"]]["points"].add(shape);    
        } else {
            this.category_dict["ACN"]["points"].add(shape);    
        }
        //console.log(this.category_dict);
    }

    addFeatures = new Kinetic.Group()
    for (k in output["added_features"]) {
        if (output["added_features"][k]["type"] == "threshold") {
            addFeatures.add(new Kinetic.Line({points: []}));
        } else if (output["added_features"][k]["type"] == "spearman") {
            spm = new Kinetic.Group();
            dims = [300, 25]
            spm_box = new Kinetic.Rect({
                x: plot.plotWidth-dims[0],
                y: plot.plotHeight-dims[1]-30,
                width: dims[0],
                height: dims[1],
                opacity: 0.8,
                stroke: "#000",
                fill: "#fff",
                strokeWidth: 1,
                shadowBlur: 4,
                shadowOffset: [3, 3],
                cornerRadius: 3
            })
            spm_text = canvas_text(plot.plotWidth-dims[0] + 10, plot.plotHeight-dims[1] - 25, output["added_features"][k]["text"], 16, dims[0], 0)
            spm.add(spm_box);
            spm.add(spm_text);
            addFeatures.add(spm)
        } else if (output["added_features"][k]["type"] == "weighted_jaccard") {
            dims = [300, 25]
            wjac = new Kinetic.Group()
            wjac_box = new Kinetic.Rect({
                x: plot.plotWidth-dims[0],
                y: plot.plotHeight-dims[1],
                width: dims[0],
                height: dims[1],
                opacity: 0.8,
                stroke: "#000",
                fill: "#fff",
                strokeWidth: 1,
                shadowBlur: 4,
                shadowOffset: [3, 3],
                cornerRadius: 3
            })
            wjac_text = canvas_text(plot.plotWidth-dims[0] + 10, plot.plotHeight-dims[1] + 5, output["added_features"][k]["text"], 16, dims[0], 0)
            wjac.add(wjac_box);
            wjac.add(wjac_text);
            addFeatures.add(wjac);
        }
        
    }

    this.legend.legendLayer.add(this.customLegendGroup);
    this.dataGroup.add(gridGroup);
    this.dataGroup.add(addFeatures);
    this.dataGroup.add(points);
    this.dynamicLayer.add(this.dataGroup);
    this.trackCanvas.draw();
}

ScatterPlot.prototype.show_hide_category = function (node) {
    if (this.category_dict[node["id"]]["show"] == true) {
        //tick_mark = this.trackCanvas.find("#check_" + node["id"])[0];
        this.category_dict[node["id"]]["tick"].hide();
        this.category_dict[node["id"]]["show"] = false;
        this.category_dict[node["id"]]["points"].hide()
        this.trackCanvas.draw();
    } else {
        //tick_mark = this.trackCanvas.find("#check_" + node["id"])[0];
        this.category_dict[node["id"]]["tick"].show();
        this.category_dict[node["id"]]["show"] = true;
        this.category_dict[node["id"]]["points"].show()
        this.trackCanvas.draw();
    }
    
}

ScatterPlot.prototype.show_hide_legend = function () {
    if (!this.legend.legendLayer_shown) {
        this.legend.legendLayer.show();
        this.trackCanvas.draw();
        this.legend.legendLayer_shown = true;  
    } else {
        this.legend.legendLayer_shown = false;
        this.legend.legendLayer.hide();
        this.trackCanvas.draw();
    }
}

ScatterPlot.prototype.drag = function (box_id) {
    if (!this.is_drag) {
        $("#" + box_id).toggleClass('btn-default btn-success');
        jQuery("#"+ this.canvasId).css("cursor", "move");
        this.is_drag = true;
        this.trackCanvas.setDraggable(true);
    } else {
        $("#" + box_id).toggleClass('btn-success btn-default');
        jQuery("#"+ this.canvasId).css("cursor", "default");
        this.is_drag = false;
        this.trackCanvas.setDraggable(false);
    }
}

ScatterPlot.prototype.zoom_in = function (box_id) {
    if (!this.is_zoom_in) {
        $("#" + box_id).toggleClass('btn-default btn-success');
        jQuery("#"+ this.canvasId).css("cursor", "zoom-in");
        this.is_zoom_in = true;
    } else {
        $("#" + box_id).toggleClass('btn-success btn-default');
        jQuery("#"+ this.canvasId).css("cursor", "default");
        this.is_zoom_in = false;
    }
   
}


ScatterPlot.prototype.zoom_out = function (box_id) {
    if (!this.is_zoom_out) {
        $("#" + box_id).toggleClass('btn-default btn-success');
        jQuery("#"+ this.canvasId).css("cursor", "zoom-out");
        this.is_zoom_out = true;
    } else {
        $("#" + box_id).toggleClass('btn-success btn-default');
        jQuery("#"+ this.canvasId).css("cursor", "default");
        this.is_zoom_out = false;
    }
    
}

ScatterPlot.prototype.show_hide_selection_box = function (box_id) {
    if (!this.boxLayer_shown) {
          this.selection_layer = generate_selection_box(this);
          this.trackCanvas.add(this.selection_layer);
          this.trackCanvas.draw();
          jQuery("#"+ this.canvasId).css("cursor", "crosshair");
          this.boxLayer_shown = true;
          $("#" + box_id).toggleClass('btn-default btn-success');
      } else {
          this.boxLayer_shown = false;
          this.selection_layer.destroy();
          this.trackCanvas.draw();
          jQuery("#"+ this.canvasId).css("cursor", "default");
          $("#" + box_id).toggleClass('btn-success btn-default');
      }
}

ScatterPlot.prototype.update_slider = function (min_val, max_val) {
    $("#dthval-0-"+ this.plot_type).text(min_val);
    $("#dthval-1-"+ this.plot_type).text(max_val);
    plot_type = this.plot_type
    $("#depth-widget-" + this.plot_type).slider({
        min: min_val,
        max: max_val,
        step: 1,
        values: [min_val, max_val],
        slide: function(event, ui) {
            for (var i = 0; i < ui.values.length; ++i) {
                //$("input.sliderValue[data-index=" + i + "]").val(ui.values[i]);
                $("#dthval-" + i + "-" + plot_type).text(ui.values[i]);
                $("#dthval_" + i +"_in_" + plot_type).val(ui.values[i]);
            }
        }
    });
    /*$("input.sliderValue").change(function() {
        var $this = $(this);
        $("#slider").slider("values", $this.data("index"), $this.val());
        console.log("here")
    });*/
}

ScatterPlot.prototype.retrieve_data = function (form_id, url) {
    var scatterPlot = $(this)[0];
    console.log(jQuery("#" + form_id).serialize());
    jQuery.ajax({
        url: url,
        type: 'POST',
        data: jQuery("#" + form_id).serialize(),
        beforeSend: function(){
            jQuery('.splashScreenExplorer').show();
        },
        complete: function(){
            jQuery('.splashScreenExplorer').hide();
        },
        success: function(response) {     
            output = JSON.parse(response);
            scatterPlot.render(output);
        },
        error: function(error) {
            console.log(error);
        }
    });
}

