var shapes_lib = []
var uniStroke = "#000000"

shapes_lib["circle"] = function (x, y, dim, fill, stroke, alpha, filled) {
    //this can return filled circles and transparent ones
    radius = dim/2;
    stroke = filled ? uniStroke : stroke;
    var circ = new Kinetic.Circle({
                    radius: radius,
                    fill: fill,
                    stroke: stroke,
                    strokeWidth: 1,
                    x: x,
                    y: y,
                    opacity: alpha
                });
    circ.fillEnabled(filled);
    return circ;
}

shapes_lib["rectangle"] = function (x, y, width, height, fill, stroke, alpha, filled) {
    //this can return filled rects and transparent ones
    stroke = filled ? uniStroke : stroke;
    var rect = new Kinetic.Rect({
                x: x-width/2,
                y: y-height/2,
                width: width,
                height: height,
                fill: fill,
                stroke: stroke,
                opacity: alpha,
                strokeWidth: 1
            });
    rect.fillEnabled(filled);
    return rect;
}

shapes_lib["ellipse_base"] = function (x, y, int_radius, out_radius, fill, stroke, alpha, filled) {
    stroke = filled ? uniStroke : stroke;
    var ell = new Kinetic.Ellipse({
                x: x,
                y: y,
                radius: {
                    x: int_radius,
                    y: out_radius
                },
                fill: fill,
                stroke: stroke,
                opacity: alpha,
                strokeWidth: 1
            });
    ell.fillEnabled(filled);
    return ell;
}

shapes_lib["triangle"] = function (x, y, bound_dim, fill, stroke, alpha, filled) {
    // this can return filled equilateral triangles or transparent ones #use Grey shading
    stroke = filled ? uniStroke : stroke;
    dim = bound_dim/Math.sqrt(3);
    renderedPoints = [x+dim*Math.cos(Math.PI/6), y+dim*Math.sin(Math.PI/6),
                        x+dim*Math.cos(5*Math.PI/6), y+dim*Math.sin(5*Math.PI/6),
                        x+dim*Math.cos(3*Math.PI/2), y+dim*Math.sin(3*Math.PI/2)]   
    var trian = new Kinetic.Line({
                        points: renderedPoints,
                        stroke: stroke,
                        fill: fill,
                        closed: true,
                        strokeWidth: 1,
                        opacity: alpha,
                        lineJoin: 'round'
                    });
    trian.fillEnabled(filled);
    return trian;
}

shapes_lib["inv_triangle"] = function (x, y, bound_dim, fill, stroke, alpha, filled) {
    // this can return filled equilateral triangles or transparent ones #use Grey shading
    stroke = filled ? uniStroke : stroke;
    dim = bound_dim/Math.sqrt(3);
    renderedPoints = [x+dim*Math.cos(Math.PI/2), y+dim*Math.sin(Math.PI/2),
                        x+dim*Math.cos(7*Math.PI/6), y+dim*Math.sin(7*Math.PI/6),
                        x+dim*Math.cos(11*Math.PI/6), y+dim*Math.sin(11*Math.PI/6)]
    var trian = new Kinetic.Line({
                        points: renderedPoints,
                        stroke: stroke,
                        fill: fill,
                        closed: true,
                        strokeWidth: 1,
                        opacity: alpha,
                        lineJoin: 'round'
                    });
    trian.fillEnabled(filled);
    return trian;
}

shapes_lib["cross"] = function (x, y, dim, fill, stroke, alpha) {
    renderedPoints = [x-dim/2, y, 
                        x+dim/2, y,
                        x, y,
                        x, y-dim/2,
                        x, y+dim/2]
    var cros = new Kinetic.Line({
                        points: renderedPoints,
                        stroke: stroke,
                        closed: false,
                        strokeWidth: 2,
                        opacity: alpha,
                        lineJoin: 'round'
                    });
    return cros;
}

shapes_lib["ang_cross"] = function (x, y, bound_dim, fill, stroke, alpha) {
    dim = bound_dim/Math.sqrt(2);
    renderedPoints = [x+dim*Math.cos(Math.PI/4), y+dim*Math.sin(Math.PI/4), 
                        x+dim*Math.cos(5*Math.PI/4), y+dim*Math.sin(5*Math.PI/4),
                        x, y,
                        x+dim*Math.cos(3*Math.PI/4), y+dim*Math.sin(3*Math.PI/4),
                        x+dim*Math.cos(7*Math.PI/4), y+dim*Math.sin(7*Math.PI/4)]
    var ang_cros = new Kinetic.Line({
                        points: renderedPoints,
                        stroke: stroke,
                        closed: false,
                        strokeWidth: 2,
                        opacity: alpha,
                        lineJoin: 'round'
                    });
    return ang_cros;
}

shapes_lib["diamond"] = function (x, y, bound_dim, fill, stroke, alpha, filled) {
    stroke = filled ? uniStroke : stroke;
    dim = bound_dim/2;
    renderedPoints = [x+dim*Math.cos(0), y+dim*Math.sin(0), 
                        x+dim*Math.cos(Math.PI/2), y+dim*Math.sin(Math.PI/2),
                        x+dim*Math.cos(Math.PI), y+dim*Math.sin(Math.PI),
                        x+dim*Math.cos(3*Math.PI/2), y+dim*Math.sin(3*Math.PI/2),
                        x+dim*Math.cos(2*Math.PI), y+dim*Math.sin(2*Math.PI)]
    var diamond = new Kinetic.Line({
                        points: renderedPoints,
                        fill: fill,
                        stroke: stroke,
                        closed: true,
                        strokeWidth: 1,
                        opacity: alpha,
                        lineJoin: 'round'
                    });
    diamond.fillEnabled(filled);
    return diamond;
}

shapes_lib["asterisk"] = function (x, y, dim, fill, stroke, alpha) {
    ast = new Kinetic.Group();
    cros = shapes_lib["cross"](x, y, dim, fill, stroke, alpha);
    ang_cros = shapes_lib["ang_cross"](x, y, dim, fill, stroke, alpha);
    ast.add(cros);
    ast.add(ang_cros);
    return ast;
}

shapes_lib["circle_cross"] = function (x, y, dim, fill, stroke, alpha) {
    circ_cros = new Kinetic.Group();
    circ = shapes_lib["circle"](x, y, dim, fill, stroke, alpha, false);
    cros = shapes_lib["cross"](x, y, dim, fill, stroke, alpha);
    circ_cros.add(circ);
    circ_cros.add(cros);
    return circ_cros;
}

shapes_lib["circle_x"] = function (x, y, dim, fill, stroke, alpha) {
    circ_x = new Kinetic.Group();
    circ = shapes_lib["circle"](x, y, dim, fill, stroke, alpha, false);
    cros = shapes_lib["ang_cross"](x, y, dim, fill, stroke, alpha);
    circ_x.add(circ);
    circ_x.add(cros);
    return circ_x;
}

shapes_lib["star"] = function (x, y, dim, fill, stroke, alpha) {
    star = new Kinetic.Group();
    trian = shapes_lib["triangle"](x, y, dim, fill, stroke, alpha, false);
    inv_trian = shapes_lib["inv_triangle"](x, y, dim, fill, stroke, alpha, false);
    star.add(trian);
    star.add(inv_trian);
    return star;
}

shapes_lib["square"] = function (x, y, dim, fill, stroke, alpha, filled) {
    square = shapes_lib["rectangle"](x, y, dim, dim, fill, stroke, alpha, filled);
    return square;
}

shapes_lib["ellipse"] = function (x, y, dim, fill, stroke, alpha) {
    ell = shapes_lib["ellipse_base"](x, y, dim/2, dim/5, fill, stroke, alpha, true);
    return ell;
}

shapes_lib["square_cross"] = function (x, y, dim, fill, stroke, alpha) {
    sq_cros = new Kinetic.Group();
    square = shapes_lib["rectangle"](x, y, dim, dim, fill, stroke, alpha, false);
    cros = shapes_lib["cross"](x, y, dim, fill, stroke, alpha);
    sq_cros.add(square);
    sq_cros.add(cros);
    return sq_cros;
}

shapes_lib["square_x"] = function (x, y, dim, fill, stroke, alpha) {
    sq_cros = new Kinetic.Group();
    square = shapes_lib["rectangle"](x, y, dim, dim, fill, stroke, alpha, false);
    cros = shapes_lib["ang_cross"](x, y, dim, fill, stroke, alpha);
    sq_cros.add(square);
    sq_cros.add(cros);
    return sq_cros;
}

shapes_lib["diamond_cross"] = function (x, y, dim, fill, stroke, alpha) {
    sq_cros = new Kinetic.Group();
    diam = shapes_lib["diamond"](x, y, dim, fill, stroke, alpha, false);
    cros = shapes_lib["cross"](x, y, dim, fill, stroke, alpha);
    sq_cros.add(diam);
    sq_cros.add(cros);
    return sq_cros;
}

shapes_lib["diamond_x"] = function (x, y, dim, fill, stroke, alpha) {
    sq_cros = new Kinetic.Group();
    diam = shapes_lib["diamond"](x, y, dim, fill, stroke, alpha, false);
    cros = shapes_lib["ang_cross"](x, y, dim, fill, stroke, alpha);
    sq_cros.add(diam);
    sq_cros.add(cros);
    return sq_cros;
}

shapes_lib["illuminati"] = function (x, y, dim, fill, stroke, alpha) {
    // this can be filled also?
    ill = new Kinetic.Group();
    square = shapes_lib["square"](x, y, dim, fill, stroke, alpha, false);
    renderedPoints = [x, y-dim/2,
                        x-dim/2, y+dim/2,
                        x+dim/2, y+dim/2]
    var trian = new Kinetic.Line({
                        points: renderedPoints,
                        stroke: stroke,
                        fill: fill,
                        closed: true,
                        strokeWidth: 1,
                        opacity: alpha,
                        lineJoin: 'round'
                    });
    trian.fillEnabled(false);
    ill.add(square);
    ill.add(trian);
    return ill;
}

shapes_lib["hallows"] = function (x, y, dim, fill, stroke, alpha) {
    hallow = new Kinetic.Group();
    trian = shapes_lib["triangle"](x, y, dim, fill, stroke, alpha, false);
    circ = shapes_lib["circle"](x, y, dim/Math.sqrt(3), fill, stroke, alpha, false);
    hallow.add(trian);
    hallow.add(circ);
    return hallow;
}

shapes_lib["square_circle"] = function (x, y, dim, fill, stroke, alpha) {
    sq_circ = new Kinetic.Group();
    square = shapes_lib['square'](x, y, dim, fill, stroke, alpha, false);
    circ = shapes_lib["circle"](x, y, dim/Math.sqrt(2), fill, stroke, alpha, false);
    sq_circ.add(square);
    sq_circ.add(circ)
    return sq_circ;
}

shapes_lib["diamond_circle"] = function (x, y, dim, fill, stroke, alpha) {
    diam_circ = new Kinetic.Group();
    square = shapes_lib["diamond"](x, y, dim, fill, stroke, alpha, false);
    circ = shapes_lib["circle"](x, y, dim/Math.sqrt(2), fill, stroke, alpha, false);
    diam_circ.add(square);
    diam_circ.add(circ)
    return diam_circ;
}

shapes_lib["pentagon"] = function (x, y, dim, fill, stroke, alpha, filled) {
    stroke = filled ? uniStroke : stroke;
    radius = dim/2;
    pent = new Kinetic.RegularPolygon({
                x: x,
                y: y,
                fill: fill,
                radius: radius,
                sides: 5,
                stroke: stroke,
                strokeWidth: 1,
                opacity: alpha
            });
    pent.fillEnabled(filled);
    return pent;
}

shapes_lib["octagon"] = function (x, y, dim, fill, stroke, alpha, filled) {
    radius = dim/2;
    stroke = filled ? uniStroke : stroke;
    oct = new Kinetic.RegularPolygon({
                x: x,
                y: y,
                fill: fill,
                radius: radius,
                sides: 8,
                stroke: stroke,
                strokeWidth: 1,
                opacity: alpha
            });
    oct.fillEnabled(filled);
    return oct;
}

shapes_lib["tick"] = function (x, y, dim, fill, stroke, alpha, filled) {
    margin = 3;
    renderedPoints = [x-dim/2+margin, y-dim/2+margin,
                        x-dim/2+margin, y+dim/2-margin,
                        x+dim/2-margin, y-dim/2+margin];
    tick = new Kinetic.Line({
        points: renderedPoints,
        fill: fill,
        stroke: stroke,
        closed: false,
        strokeWidth: 2,
        opacity: alpha
    })
    return tick;
}

function canvas_text(x, y, text, font_size, text_width, padding, id) {
    var text = new Kinetic.Text({
        x: x,
        y: y,
        text: text,
        fontSize: font_size,
        fontFamily: 'Calibri',
        fill: '#000',
        width: text_width,
        padding: padding
    });
    if (id) {text.id(id);}
    return text;
}

function sample_shape_generator() {
    points = new Kinetic.Group();
    circ = circle(100, 120, 30, "#ff0000", "#000000", 0.8, false);
    rect = rectangle(20, 20, 200, 100, "#ff0000", "#000000", 1, false)
    ell = ellipse(100, 120, 100, 200, "#0000ff", "#000000", 0.5, false);
    diam = circle(100, 100, 20, "#cccccc", "#000000", 0.8, false);
    trian = triangle(500, 500, 40, "#4f133a", "#000", 0.6, true);
    inv_trian = inverted_triangle(200, 390, 49, "#453535", "#453535", 0.6, true)
    oct = shapes_lib["octagon"](300, 300, 20, "#ff0000", "#000000", 1, true);
    points.add(oct);
    points.add(rect);
    points.add(circ);
    points.add(ell);
    points.add(diam);
    points.add(trian);
    points.add(inv_trian);
    return points
}
