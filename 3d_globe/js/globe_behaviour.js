//////////////////////
/// GLOBE ROTATION ///
//////////////////////

function rotateglobe(){
    var dt = Date.now() - time;
    projection.rotate([rotate[0] + velocity[0] * dt, 0]); // yaw and pitch
    svgContainer.selectAll("path").attr("d", path(world));
    water.attr("d", path);

    svgContainer.selectAll("circle")
        .attr("transform", function(d) {
            var proj = projection([
                parseInt(d["long"]),
                parseInt(d["lat"])])
            return "translate(" + [proj[0] - d["width"], proj[1] - d["height"]]
             + ")"});
             

    svgContainer.selectAll("circle")
        .attr("fill", function(d) {
            var circle = [parseInt(d["long"]),
            parseInt(d["lat"])];
            var rotate = projection.rotate(); // antipode of actual rotational center.
            var center = [-rotate[0], -rotate[1]]
            var distance = d3.geoDistance(circle,center);
            
        return distance > Math.PI/2 ? 'none' : color[show][d['sub']];
    });

}

///////////////////////////////
/// CLICK TO DRAG BEHAVIOUR ///
///////////////////////////////

function callglobedrag(){
    drag = d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended);

    svgContainer.call(drag);

    return drag;
}

function dragstarted(){
    console.log("start")
    svgContainer.on(zoom, null);
    rotation_timer.stop();
    gpos0 = projection.invert(d3.mouse(this));
    o0 = projection.rotate();

    svgContainer.selectAll("#world")
             .datum({type: "Point", coordinates: gpos0})
             .attr("class", "point")
             .attr("d", path(world)); 
}

function dragged(){
    console.log("dragged")
    var gpos1 = projection.invert(d3.mouse(this));

    o0 = projection.rotate();

    var o1 = eulerAngles(gpos0, gpos1, o0);
    projection.rotate(o1);

    svgContainer.selectAll(".point")
            .datum({type: "Point", coordinates: gpos1});
    svgContainer.selectAll("#world").attr("d", path(world));

    svgContainer.selectAll("circle")
        .attr("transform", function(d) {
            var proj = projection([
                parseInt(d["long"]),
                parseInt(d["lat"])])
            return "translate(" + [proj[0] - d["width"], proj[1] - d["height"]]
             + ")"});

    svgContainer.selectAll("circle")
        .attr("fill", function(d) {
            var circle = [parseInt(d["long"]),
            parseInt(d["lat"])];
            var rotate = projection.rotate(); // antipode of actual rotational center.
            var center = [-rotate[0], -rotate[1]]
            var distance = d3.geoDistance(circle,center);
            
        return distance > Math.PI/2 ? 'none' : color[show][d['sub']];
    });
}

function dragended(){
    zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);
    svgContainer.call(zoom) //Use zoom
        rotation_timer.restart(function(elapsed) {
        // rotateglobe(); // TODO: Get correct coordinates and pass them to function.
    });
    console.log("end")

}

///////////////////////
////      ZOOM     ////
///////////////////////

// Function what happens when zooming
// changes bin size of spacial clustering
// TODO: Create transitions for smooth zooming
function zoomed() {
    zoom = d3.event.transform;
    zoom_level = zoom["k"];
    g.attr("transform", d3.event.transform)
    gPins.attr("transform", d3.event.transform)
    gArrows.attr("transform", d3.event.transform)
    long_binner.range(d3.range(-180, 180, LONGLAT_STEP/zoom_level))
    lat_binner.range(d3.range(-90, 90, LONGLAT_STEP/zoom_level))
    water.attr("transform", d3.event.transform)
}

