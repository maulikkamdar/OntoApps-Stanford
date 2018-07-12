var stage = new Kinetic.Stage({
    container: 'offsetDiv',
    width: 600,
    height: 400
});

var layer = new Kinetic.Layer();
layer.add(new Kinetic.Rect({
    x:0,
    y:0,
    width:600,
    height:400
}));
stage.add(layer);
var rect, down = false,oPoint, space=false;
layer.on("mousedown", function(e) {
    down = true;
    oPoint = {x:e.x, y:e.y};
    var r = Math.round(Math.random()*255),
        g = Math.round(Math.random()*255),
        b = Math.round(Math.random()*255);
    rect = new Kinetic.Rect({
        x: e.x,
        y: e.y,
        width: 11,
        height: 1,
        fill: 'rgb('+r+','+g+','+b+')',
        stroke: 'black',
        strokeWidth: 4
    });
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
});