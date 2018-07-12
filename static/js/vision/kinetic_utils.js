function generate_selection_box(plot_obj) {
    var layer = new Kinetic.Layer();
    layer.add(new Kinetic.Rect({
        x:0,
        y:0,
        width:plot_obj.width,
        height:plot_obj.height
    }));

    var rect, down = false, oPoint, space=false;

    layer.on("mousedown", function(e) {
        down = true;
        oPoint = originalPoint = {x:e.evt.layerX, y:e.evt.layerY};
        if (rect) {rect.destroy()}
        rect = new Kinetic.Rect({
            x: e.evt.layerX,
            y: e.evt.layerY,
            width: 0,
            height: 0,
            fill: '#fff',
            stroke: 'blue',
            strokeWidth: 2,
            dash: [10, 5],
        });
        rect.fillEnabled(false);
        layer.add(rect);
    });
    window.onkeyup = function(evt) {
        if (evt.keyCode == 32) {
          space = false;
        }
    };
    window.onkeydown = function(evt) {
        if (evt.keyCode == 32) {
          space = true;
        }
    };
    layer.on("mousemove", function(e) {
        if (!down) return;
        e.x = e.evt.layerX;
        e.y = e.evt.layerY;
        var p = rect.attrs,
            w = e.x - p.x,
            h = e.y - p.y;
        if (space){
            w = rect.attrs.width;
            h = rect.attrs.height;
            var dX = e.x - (p.x + w),
                dY = e.y - (p.y + h);
            
            oPoint.x += dX;
            oPoint.y += dY;
            
            rect.setX(p.x + dX);
            rect.setY(p.y + dY);
        }
        else{
            if (e.shiftKey){
                var d = Math.sqrt(Math.pow(e.x-p.x,2)+Math.pow(e.y-p.y,2));
                w = h = d * Math.sin(Math.PI/4);
            }
            if(e.altKey){
                rect.setX(oPoint.x - w/2);
                rect.setY(oPoint.y - h/2);
            }
            else{
                rect.setX(oPoint.x);
                rect.setY(oPoint.y);
            }
        }
        rect.setWidth(w);
        rect.setHeight(h);
        layer.draw();
    });

    layer.on("mouseup", function(e) {
        down = false;
        console.log(rect.attrs);
        ymin = rect.attrs["y"];
        ymax = rect.attrs["y"] + rect.attrs["height"];
        xmin = rect.attrs["x"];
        xmax = rect.attrs["x"] + rect.attrs["width"];
        term_list = "";
        for (k in plot_obj.point_pos_dict) {
            kparts = k.split(":-:");
            x = kparts[0];
            y = kparts[1];
            if (x > xmin && x < xmax) {
                if (y > ymin && y < ymax) {
                    term_list += plot_obj.point_pos_dict[k] + ":^:";
                    //tparts = plot_obj.point_pos_dict[k].split(":^:");
                    //for (m in tparts) {term_list.push(tparts[m])};
                }
            }
        }
        
        plotGraph(term_list);
        if(rect.attrs.width===0 && rect.attrs.height===0){
            console.debug('removed');
            rect.remove();
            layer.draw();
        }
    });

    return layer;
}

function get_axis_group(width, height, offsetW, offsetH, minW, minH) {
    var axisLines = new Kinetic.Group();

    var yAxis = new Kinetic.Line({
        points: [offsetW, minH, offsetW, height - offsetH],
        stroke: 'black',
        strokeWidth: 1,
        lineJoin: 'round',
        opacity: 1
    });

    var xAxis = new Kinetic.Line({
        points: [offsetW, height - offsetH, width - minW, height - offsetH],
        stroke: 'black',
        strokeWidth: 1,
        lineJoin: 'round',
        opacity: 1
    });

    axisLines.add(yAxis);
    axisLines.add(xAxis);
    return axisLines;
}

var Legend = function (width) {
    this.legendBox_width = width;
}

Legend.prototype.gen_legend_box = function (plotWidth, plotHeight, offsetW, offsetH, minW, minH) {
    this.legendLayer = new Kinetic.Layer();
    this.legendLayer_shown = false;
    this.leg_start_x = plotWidth - this.legendBox_width + offsetW - minW
    this.leg_start_y = 20
    var legendBox = new Kinetic.Rect({
        x: this.leg_start_x,
        y: this.leg_start_y,
        width: this.legendBox_width,
        height: plotHeight - minH - 10,
        fill: "#ffffff",
        stroke: "#000000",
        strokeWidth: 1,
        opacity: 0.8
    });
    this.legendLayer.add(legendBox);
}


function zoom_in() {
    /*layer.on("click",function(ev){
        var d=document.getElementById('photoCnvs');         
        var cnvsPos=getPos(d);

        var R={  //(canvas space)
            x: ev.pageX,
            y: ev.pageY
        };

        var off0=this.getPosition();
        var scl0=this.getScale().x;
        var w=stageM.getWidth();
        var h=stageM.getHeight();

        var zP = {
            x: R.x-cnvsPos.x,
            y: R.y-cnvsPos.y                
        }

        var xA={
            x:(R.x-off0.x-cnvsPos.x)/scl0,
            y:(R.y-off0.y-cnvsPos.y)/scl0
        }
        var sclf=scl0*1.10;
        this.setScale(sclf);
        var newR={
            x: zP.x-sclf*xA.x,
            y: zP.y-sclf*xA.y*/
}
