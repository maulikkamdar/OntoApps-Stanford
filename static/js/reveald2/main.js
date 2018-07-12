// first we need to create a stage
function generate_class(text, id, x, y, expanded){
    var classWidth = expanded ? 300: 200;
    var classHeight = expanded ? 300: 50; // compute this height/width automatically
    var yadj = 20;
    var xadj = 20

    //console.log([classWidth, classHeight, id, x, y])
    var complexText = new Konva.Text({
        x: x,
        y: y,
        text: text,
        fontSize: 24,
        fontFamily: 'Courier',
        fontStyle: 'bold',
        fill: '#555',
        ellipsis: true,
        width: classWidth - 50,
        height: classHeight,
        padding: 10,
        align: 'left',
        wrap: 'none',
        ellipsis: true /// modify this for expanded
    });

    var dim = 20
    /* Change this to "expand" icon <->*/
    var renderedPoints = [x - dim/2 + classWidth - xadj, y + yadj,  
                            x + dim/2 + classWidth - xadj, y + yadj, 
                            x + classWidth - xadj, y + yadj, 
                            x + classWidth - xadj, y - dim/2 + yadj, 
                            x + classWidth - xadj, y + dim/2 + yadj]
    var cros = new Konva.Line({
                        points: renderedPoints,
                        stroke: 'black',
                        closed: false,
                        strokeWidth: 5,
                        alpha: 0.5
                    });

    var crosRect = new Konva.Rect({
        x: x - dim/2 - 2.5 + classWidth - xadj,
        y: y + yadj - dim/2 - 2.5,
        width: dim + 5,
        height: dim + 5,
        fill: '#E0FFFF',
        stroke: '#000',
        strokeWidth: 1,
        shadowColor: 'black',
        shadowBlur: 3,
        shadowOffset: [3, 3],
        shadowOpacity: 0.5,
        alpha: 0.5,
    });


    var rect = new Konva.Rect({
        x: x,
        y: y,
        width: classWidth,
        id: id,
        height: complexText.getHeight(),
        fill: 'white',
        stroke: '#333',
        strokeWidth: 1,
        shadowColor: 'black',
        shadowBlur: 10,
        shadowOffset: [10, 10],
        shadowOpacity: 0.5,
        cornerRadius: 10
    });
    //rect.fillEnabled(true);

    rect.on('mouseover', function(evt) {
        document.body.style.cursor = 'pointer';
        var node = evt.target.attrs;
        nid = node["id"];
        console.log(nid)
        classInfoBlobBox.setAbsolutePosition({"x": evt.evt.layerX + 5, "y": evt.evt.layerY + 5});
        classInfoBlobBox.setOpacity(1);
        classInfoBlobBox.setZIndex(10);          
        classInfoBlob.setText(classInfo);
        classInfoBlob.setAbsolutePosition({"x": evt.evt.layerX + 5, "y": evt.evt.layerY + 5});
        classInfoBlob.setOpacity(1);
        classInfoBlob.setZIndex(10);
        classInfoBlobBox.setHeight(plot.classInfoBlob.getHeight());
        hoverLayer.draw();
    });
    rect.on('mouseout', function(evt) {
        document.body.style.cursor = 'default';  
    });
    rect.on('click', function(evt) {
        var node = evt.target.attrs;
        console.log(node)
    });

    var classGroup = new Konva.Group()
    classGroup.add(rect)
    if (!expanded) {
        classGroup.add(crosRect)
        classGroup.add(cros)
    }
    classGroup.add(complexText)
    return classGroup;
}

function generate_dset_group(text, max_x, max_y, min_x, min_y) {
    dsetWidth = (max_x - min_x + 1) * ASPECT_RATIO_WIDTH  // remove +1 here
    dsetHeight = (max_y - min_y + 1) * ASPECT_RATIO_HEIGHT
    console.log(dsetWidth)
    console.log(max_y - min_y)
    var rect = new Konva.Rect({
        x: min_x * ASPECT_RATIO_WIDTH-SPACE_MOD,
        y: min_y * ASPECT_RATIO_HEIGHT-SPACE_MOD,
        width: dsetWidth,
        height: dsetHeight,
        fill: '#C5EAFD',
        stroke: '#333',
        strokeWidth: 1,
        shadowColor: 'black',
        shadowBlur: 10,
        shadowOffset: [10, 10],
        shadowOpacity: 0.5,
        cornerRadius: 10
    });
    
    var dsetGroup = new Konva.Group();
    dsetGroup.add(rect)
    return dsetGroup;
}


var width = 0.95*window.innerWidth;
var height = 950;
var ASPECT_RATIO_HEIGHT = 100;
var ASPECT_RATIO_WIDTH = 250;
var SPACE_MOD = 25;
var dsetList = {}
var dsetGroup = {}

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

var stage = ui.stage = new Konva.Stage({
  container: 'canvasArea',   // id of container <div>
  width: width,
  height: height
});

// then create layer
var dynamicLayer = new Konva.Layer({
    width: width,
    x: 0,
    draggable: true,
});

var hoverLayer = new Kinetic.Layer({});

// create our shape
var circle = new Konva.Circle({
  x: stage.getWidth() / 2,
  y: stage.getHeight() / 2,
  radius: 70,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 4
});

stage.add(dynamicLayer);
stage.add(hoverLayer);


jQuery("#dsetaccordion").html("");
jQuery.ajax({
    url: '/reveald2/get_dset_groups',
    beforeSend: function(){
        jQuery('.splashScreenExplorer').show();
    },
    complete: function(){
        jQuery('.splashScreenExplorer').hide();
    },
    success: function(response) {
        output = JSON.parse(response);
        dsetList = output;
        console.log(output);
        for (k in output) {
            acc_id = k + "_card";
            acc_id_c = acc_id + "_check";
            fdset_list = "";
            for (m in output[k]) {
                fdset_list += '<input class="form-check-input dsetcheck" type="checkbox" value="" id="' + m + '_card_check"> &nbsp;&nbsp;&nbsp;' + m + "<br>";
            }
            dsetHtml = '<div class="card" text-align="left"><div class="card-header" id="headingOne"><h5 class="mb-0"><button class="btn btn-link" data-toggle="collapse" data-target="#' + acc_id +'" aria-expanded="true" aria-controls="' +acc_id+'">' + 
                        '<b><input class="form-check-input dsetcheck" type="checkbox" value="" id="' + acc_id_c + '"> &nbsp;&nbsp;&nbsp;' + 
                        k + '</b></button></h5></div><div id=' + acc_id + ' class="collapse show" aria-labelledby="headingOne" data-parent="#accordion">' +
                        '<div class="card-body">' + fdset_list + '</div></div></div>';
            jQuery("#dsetaccordion").append(dsetHtml);
        }
        /*for (k in dsetList){
            for (m in dsetList[k]) {
                console.log(m);
                plot_schema(m);
            }
        }*/
    },
    error: function(error) {
        console.log(error);
    }
  });


function plot_schema(dset_id) {
    gr = new Konva.Group({"id": dset_id});
    dynamicLayer.add(gr);
    jQuery.ajax({
        url: '/reveald2/get_dset_graph',
        type: 'POST',
        data: {"dset": dset_id},
        beforeSend: function(){
            jQuery('.splashScreenExplorer').show();
        },
        complete: function(){
            jQuery('.splashScreenExplorer').hide();
        },
        success: function(response) {
            output = JSON.parse(response);
            console.log(output["dims"])
            dset_block = generate_dset_group(dset_id, output["dims"]["max_x"], output["dims"]["max_y"], output["dims"]["min_x"], output["dims"]["min_y"])
            gr.add(dset_block)
            for (k in output["nodes"]){
                class_v = generate_class(output["nodes"][k]["refL1"], k, output["nodes"][k]["pos"][0]*ASPECT_RATIO_WIDTH, output["nodes"][k]["pos"][1]*ASPECT_RATIO_HEIGHT)
                gr.add(class_v);
            }
            dynamicLayer.draw();
        },
        error: function(error) {
            console.log(error);
        }
    });
    dsetGroup[dset_id] = gr
    dynamicLayer.scale({x: 0.25, y: 0.25});
    dynamicLayer.draw();
}


plot_schema("Bio2rdf-Drugbank")

