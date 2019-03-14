var width = 1500;
var height = 750;
var centered;

legendRectSize = 18;
legendSpacing = 4;

// default speed of the sider in 1000*seconds per year
SLIDER_SPEED = 1000;

// the amount of years nothing has happend
idle_count = 0;

var century = 0;

var is_globe = true;

// zoom and drag parameters
var zoom_level = 0
var sensitivity = 0.25
var maxElevation = 45
var time = Date.now()
    rotate = [10, -10] 
    velocity = [.003, -.001];

// years and locations are binned to prevent clutter
var YEAR_STEP = 3
var LONGLAT_STEP = 0.2

var show_migration = true;
var svgContainer = d3.select("body").append("svg")
                                        .attr("height", height)
                                        .attr("width", width);

var is2d = false; //check if 2d or 3d for play button

////////////////
// Create map //
////////////////

// Create map
var projection = d3.geoOrthographic().translate([width/2, height/4]).scale(350).center([0,40]);


var zoom = d3.zoom()
.scaleExtent([1, 8])
.on("zoom", zoomed);
var path = d3.geoPath().projection(projection);

var water = svgContainer.append("path")
    .datum({type: "Sphere"})
    .attr("id" , "water")
    .attr("fill", "#001320")
    .attr("d", path);

var g = svgContainer.append("g")//For map
var gPins = svgContainer.select("g"); //For pins on map (new abstract layer)
var gArrows = svgContainer.append("g"); // For arrows of migration
var tooltip = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0)
    .style("z-index", 1);

var number_windows = 1; // Initial number of windows
var number_details_painting = 0;

var url = "http://enjalot.github.io/wwsd/data/world/world-110m.geojson";
var data_url = "http://enjalot.github.io/wwsd/data/world/ne_50m_populated_places_simple.geojson";


var world;
Promise.all([d3.json(url), d3.json(data_url)]).then(function(data) {
    world = data[0];
    var places = data[1];

    g.append("path")
    .attr("d", path(world))
    .attr("id" , "world")
    .attr("fill", "#06304e")
    .attr("stroke", "#001320");

});

var rotation_timer = d3.timer(function() {
    rotateglobe();
});

window.rotation_timer = rotation_timer

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
            
        return distance > Math.PI/2 ? 'none' : color['style'][d['sub']];
    });

      ///////////////// HIER G PINS AANPASSEN //////////////////////
}

var drag = callglobedrag();

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
            
        return distance > Math.PI/2 ? 'none' : color['style'][d['sub']];
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


//////////////////
// REST OF CODE //
//////////////////

// hard code centuries and years 
//TODO: softcode
var centuries = d3.range(0, 22, 1);
var years = d3.range(100, 2020, 1);

// Variables for play/pause button
var moving = false;
var playButton = d3.select("#play-button");
playButton.attr("margin-left", "200px")
var playAuto = true;

// set year + slider start
year_interval = [0, 250]

// filter slider
var slider = createD3RangeSlider(0, d3.max(years), "#slider-container")
slider.range(year_interval[0], year_interval[1]);
d3.select("#range-label").text(year_interval[0] + " - " + year_interval[1])

// variables for starting slideshow
var all_years = []
var checkpoints = [0]
var check_i = 0
var starting = true

// long lat binner with bin size LONGLAT_STEP
// TODO: let bin size depend on zoom level
var lat_binner = d3.scaleQuantize()
    .domain([-90,90])
    .range(d3.range(-90, 90, LONGLAT_STEP));
var long_binner = d3.scaleQuantize()
    .domain([-180,180])
    .range(d3.range(-180, 180, LONGLAT_STEP));

// year binner with bin size is YEAR_STEP
var year_binner = d3.scaleQuantize()
    .domain([100,2025])
    .range(d3.range(100, 2025, YEAR_STEP));

var color = {'school': {}, 'style': {}, 'media':{}}

function pauseResumeButton(){
    if (moving) {
        moving = false;
        clearInterval(timer);
        d3.select(".play-button").attr("hidden", null);
        playButton.attr("class","play-button");
        playButton.attr("class","play-button-outer");
        
    } 
    else {
        if(!is2d){
            rotation_timer.restart(function(){
                rotateglobe();
            });
        }
        d3.select(".play-button").attr("hidden", true);
        playButton.attr("class", "pause-button");

        // check if it is starting or not
        if (starting){
            console.log('hi')
            console.log(checkpoints)
            timer = setInterval (function() {
                slider.range(parseInt(checkpoints[check_i]), 
                    parseInt(checkpoints[check_i + 1]))
                check_i += 1
                console.log(check_i)
                console.log(checkpoints.length)

                if (check_i == checkpoints.length-1){
                    starting = false
                    clearInterval(timer)
                }
        }, SLIDER_SPEED)  
            moving= true
        }
        else {
            // make sure that the interval is based on the amount of data
            timer = setInterval (function() {
                // get old slider values
                var vals = slider.range()
                console.log(vals)
                slider.range(vals['begin'], vals['end'] + 1)           
            }, SLIDER_SPEED)    
        moving = true;
        }    
    }
    return moving;
}

d3.csv("omni_locations.csv")
    .then(function(data){

        // initialize things to show
        var show = 'style'
        var year = 100

        // save all years and get the distribution in centuries
        data.forEach(function(d){
            all_years.push(d['date'])
        });

        // flag each 100 paintings?
        all_years.sort()

        // checkpoints
        for (var i = 0; i < all_years.length; i++){
            if ((i%500) == 0){
                checkpoints.push(all_years[i])
            }
        } 
        checkpoints.push(d3.max(years))


        d3.select("#twomap")
        .style("opacity", 1)
        .on("click", function(d){
            is2d = true;
            svgContainer.on("mousedown.drag", null);
            zoom = d3.zoom()
                .scaleExtent([1, 8])
                .on("zoom", zoomed);
            svgContainer.call(zoom) //Use zoom
             rotation_timer.stop();
             //projection = d3.geoMercator().translate([width/2, height/2]).scale(200).center([0,40])
             new_projection = d3.geoNaturalEarth1().scale(250).center([-60,30])
             //update(new_projection)
             
             projection = new_projection
             
             path = d3.geoPath().projection(projection);
             g.selectAll("path")
                 .transition()
                 .duration(20)
                 .ease(d3.easeLinear)
                 .attr("d", path(world))
                 .attr("fill", "#06304e")
                 .attr("stroke", "#001320");
             water.attr("d", path);

             // Update circles correct positions
             svgContainer.selectAll("circle")
                .attr("transform", function(d) {
                return "translate(" + projection([
                    parseInt(d["long"]),
                    parseInt(d["lat"])
                ]) + ")";
            });
            
        })
        // .style("opacity", 0);

        d3.select("#threemap")
        .style("opacity", 1)
        .on("click", function(d){
            is2d = false;
            svgContainer.on(".zoom", null);
            drag = callglobedrag();
            // rotation_timer = d3.timer(function() {
            //     var dt = Date.now() - time;
            //     projection.rotate([rotate[0] + velocity[0] * dt, 0]);
            //     svgContainer.selectAll("path").attr("d", path(world));
            //     water.attr("d", path);

            // });
                ///////////////// HIER G PINS AANPASSEN //////////////////////

            
            new_projection = d3.geoOrthographic().translate([width/2, height/4]).scale(350).center([0,40])
            //update(new_projection)
            projection = new_projection
            path = d3.geoPath().projection(projection);
            g.selectAll("path")
                .transition()
                .duration(20)
                .ease(d3.easeLinear)
                .attr("d", path(world))
                .attr("fill", "#06304e")
                .attr("stroke", "#001320");

            water.attr("d", path); // Add water again

            svgContainer.selectAll("circle")
            .attr("transform", function(d) {
                return "translate(" + projection([
                    parseInt(d["long"]),
                    parseInt(d["lat"])
                ]) + ")";
            });
        
        });

        if (!playAuto){
            // Play button will add one year per half a second
            playButton
            .on("click", function() {
                if(!is2d){
                    rotation_timer.restart(function(){
                        rotateglobe();
                    });
                }
                pauseResumeButton();
            })
        }
        // Run auto button
        else{
            moving = pauseResumeButton(playButton);
            if(moving){
                playButton
                .on("click", function() {
                    rotation_timer.stop();
                    pauseResumeButton();
            })
            }
        }
        
        // of each sub class, collect the first time that it occured
        var schools_data = [];
        var styles_data = [];
        var media_data = [];
        d3.nest()
            .key(function(d) { return d['school']; })
            .rollup(function(v) { 
                schools_data.push({
                first: d3.min(v, function(d) { return +d.date; }), 
                sub: d3.map(v, function(d) { return d.school; }).keys()[0], 
                }) 
        }).map(data);
        d3.nest()
            .key(function(d) { return d['style']; })
            .rollup(function(v) { 
                styles_data.push({
                first: d3.min(v, function(d) { return +d.date; }), 
                sub: d3.map(v, function(d) { return d.style; }).keys()[0], 
                }) 
        }).map(data);
        d3.nest()
            .key(function(d) { return d['media']; })
            .rollup(function(v) { 
                media_data.push({
                first: d3.min(v, function(d) { return +d.date; }), 
                sub: d3.map(v, function(d) { return d.media; }).keys()[0], 
                }) 
        }).map(data);


        // sort the arrays on date
        styles_data.sort(function(x, y){
            return d3.ascending(x.first, y.first);
        })
        styles_data.sort(function(x, y){
            return d3.ascending(x.first, y.first);
        })
        styles_data.sort(function(x, y){
            return d3.ascending(x.first, y.first);
        })

        var all_styles = styles_data.map(function(d) { return d.sub })
        var all_schools = schools_data.map(function(d) { return d.sub })
        var all_media = media_data.map(function(d) { return d.sub })

        var styles_colors = [];
        var schools_colors = [];
        var media_colors = [];

        
        var offset = 0;
        for (var i = 0; i < all_styles.length; i++){
            color['style'][all_styles[i]] = d3.interpolateRainbow((i+offset)/all_styles.length)
            styles_colors.push(d3.interpolateRainbow((i+offset)/all_styles.length))
            offset+=20
            if(i%5 === 0){offset = 0}
        }
        var offset = 0;
        for (var i = 0; i < all_schools.length; i++){
            color['school'][all_schools[i]] = d3.interpolateRainbow((i+offset)/all_schools.length)
            styles_colors.push(d3.interpolateRainbow((i+offset)/all_schools.length))
            offset+=20
            if(i%5 === 0){offset = 0}
        }
        var offset = 0;
        for (var i = 0; i < all_media.length; i++){
            color['media'][all_media[i]] = d3.interpolateRainbow((i+offset)/all_media.length)
            styles_colors.push(d3.interpolateRainbow((i+offset)/all_media.length))
            offset+=20
            if(i%5 === 0){offset = 0}
        }

        
        // var legend = show_legend(all_styles, styles_colors)

        // this will tigger updates, hence, when a change in value has been detected with transitions
        /*
        sliderFill
            .on('onchange', val => {
            d3.select('p#value-fill').transition()
            .duration(10).style("opacity", 0);
            d3.select('p#value-fill').text(d3.format('d')(val)).transition()
            .style("opacity", 1)
            .transition()
            .delay(5);
            year = val
            update_visuals(year, data, show, projection)
        });
        */

        slider.onChange(function(newRange){
            d3.select("#range-label").text(newRange.begin + " - " + newRange.end);
            year_interval = [newRange.begin, newRange.end]            
            update_visuals(year_interval, data, show, projection)
        });

        //var legend = show_legend(all_styles, styles_colors, data, show, show_migration, century)

        
        // on button press, only show button id and try to filter by year
        d3.select("#style")
        .on("click", function(d){
            show = 'style'
            update_visuals(year,data,show, projection)
            legend = update_legend(all_styles, styles_colors, legend, data, show, show_migration, century)
        });

        d3.select("#school")
        .on("click", function(d){
            show = 'school'
            update_visuals(year,data,show, projection)
            legend = update_legend(all_schools, schools_colors, legend, data, show, show_migration, century)
        });

        d3.select("#media")
        .on("click", function(d){
            show = 'media'
            update_visuals(year,data,show, projection)
            legend = update_legend(all_media, media_colors, legend, data, show, show_migration, century)
        });

        
});

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



function show_legend(data_set, colors, all_data, show, show_migration, century){
    
    //TODO make sure to empty legend when pressing button and fill with new data
    //TODO maybe change legend with slider?
    
    // Create color scale with data and corresponding colors
    var colorScale = d3.scaleOrdinal()
        .domain(data_set)
        .range(colors);
    
    // Initialize legend
    var legend = svgContainer.selectAll('.legend')
        .data(colorScale.domain())
        .enter()
        .append('g')
        .attr('transform', function(d, i) {                     
            var height = legendRectSize/2;
            var horz = 55 * legendRectSize;               
            var vert = i*3 * height;                      
            return 'translate(' + horz + ',' + vert + ')';
        });
    
    // Fill legend bars
    legend.append('rect')                                 
        .attr('width', legendRectSize)                    
        .attr('height', legendRectSize)                   
        .style('fill', colorScale)                       
        .style('stroke', colorScale);

    legend.append("foreignObject")
        .attr("width", 40*legendRectSize)
        .attr("height", 40*legendRectSize)
        .attr('transform', 'translate(-9,-9)')
        .append("xhtml:body")
        .html("<form><input type=checkbox id=check /></form>")
        .on("click", function(d, i){
            console.log(svgContainer.select("#check").node().checked);
            if (svgContainer.select("#check").node().checked == true && show_migration == true){
                    var migration = retrieve_migration(all_data, show, d)
                    if (migration[0].date >= century[0]*100 && migration[0].date <= century[1]*100){
                        draw_migration_flow(migration[1], migration[0])
                    }
            } else {gArrows.selectAll("path").remove()}
        });
    
    // Add text to legend
    legend.append('text')                                
        .attr('x', legendRectSize + legendSpacing)       
        .attr('y', legendRectSize - legendSpacing)       
        .text(function(d) { return d; }); 
        
        return legend
};


function update_legend(data_set, colors, legend, all_data, show, show_migration, century){
    legend.remove() // Remove old legend
    legend = show_legend(data_set, colors, all_data, show, show_migration, century)// Create new legend
    return legend
}

// Define the div for the tooltip
//TODO: remove this and write in html
var div = d3.select("body").append("div")   
    .attr("class", "tooltip")               
    .style("opacity", 0);

function update_visuals(year, data, show, projection){
    // extract the centuries to show
    var filtered_data = [];
    // var opacity;

    // convert coordinates, take max and set that to 0-1500 for longitude
    // and 0-750 for latitude
    //dbp_lat, dbp_long

    // TODO REMOVE THE PINS CORRECTLY --> that have to be removed (in case they are not present on next)
    svgContainer.selectAll("circle").transition().duration(200) // Will remove all previous circles when update is initiated
        .style("opacity", .1)
        .attr("r", 0)
        .remove();

    /*
    // find all events in last 5 steps and adjust opacity
    for(i=0;i<=4;i++){
        
        opacity = 0.8-Math.tanh(i*2)
    */
    // load style part of data
    data.forEach(function(d){
        
        if(d["omni_id"] != ""){
          

            // works except for the fact that 1700 will be 17th century
            // use year and slider to determine which datapoints have to be plotted
            if ((d['date'] > year[0] &&
                (d['date']) < year[1])){
                // convert lng and lat to coordinates
                if (d["long"] != "N\\A"){
                    //svgContainer.append("circle")
                    //  .attr("cx", (Math.abs(d["dbp_long"])+10)*5)
                    //  .attr("cy", (Math.abs(d["dbp_lat"])+10)*5)
                    //  .attr("r",3)
                    
                    
                    // add datapoint to filtered_data
                    filtered_data.push(d)
                }
            }
        }

        
    });

    window.fil = filtered_data;
    clustered_data = cluster_data(filtered_data, show);

    /*
    if(moving){
        // if nothing happens speed up time
        if (clustered_data.length === 0){ 
            idle_count+=1
            clearInterval(timer)
            timer = setInterval (function() {
                var vals = slider.range()
                slider.range(vals['begin'], vals['end'] + 1) 
            }, SLIDER_SPEED/(idle_count*5)) // go faster
        } else {
        // else go to initial time
            clearInterval(timer)
            idle_count = 0
            timer = setInterval (function() {
                var vals = slider.range()
                slider.range(vals['begin'], vals['end'] + 1) 
            }, SLIDER_SPEED) }
    }
    */
    // insert filtered data into world map
    gPins.selectAll(".pin")
        .data(clustered_data)
        .enter().append("circle", ".pin")

        // set starting coordinates based on projection location
        .attr("cx", function(d) {
            var circle = projection([parseInt(d["long"]),
            parseInt(d["lat"])]);
            var rotate = projection.rotate(); // antipode of actual rotational center.
            var center = projection([-rotate[0], -rotate[1]])
            var distance = d3.geoDistance(circle,center);

            // need to save this somewhere
            if (circle[0] > center[0]){
                d["width"] = width
                return width
            }
            else {
                d["width"] = 0
                return 0
            }
        })

        .attr("cy", function(d) {
            var circle = projection([parseInt(d["long"]),
            parseInt(d["lat"])]);
            var rotate = projection.rotate(); // antipode of actual rotational center.
            var center = projection([-rotate[0], -rotate[1]])
            var distance = d3.geoDistance(circle,center);

            // need to save this somewhere
            if (circle[1] > center[1]){
                d["height"] = height
                return height
            }
            else {
                d["height"] = 0
                return 0
            }
        })
        
        .on("mouseover",function(cluster){  
            tooltip.transition()        
            .duration(200)      
            .style("opacity", .9)
            .style("left", (d3.event.pageX +20) + "px")     
            .style("top", (d3.event.pageY - 28) + "px")
            .style("z-index", 1);
            
            tooltip.text("There are a total of " + cluster.id.length + " paintings in the style: " + cluster.sub )
            .style("left", (d3.event.pageX) + "px")     
            .style("top", (d3.event.pageY - 28) + "px")
        
            paintings_list = subset_paintings(cluster, data);
        
            // Change text size according to amount of paintings
            if(paintings_list.length < 2){
                tooltip.style("width", "200px");
            }
            else if(parseInt.length < 4){
                tooltip.style("width", "400px");
            }
            else{
                tooltip.style("width", "800px");
            }
        
            // Weird bug of not updating the images the first time
            for(var i = 0; i < 2; i++){
                slides = add_paintings(paintings_list, ".tooltip");
            }

        })
        .on("mouseout", function() {  
            tooltip.transition()        
            .duration(500)      
            .style("opacity", 0)
            .style("z-index", -1);
        })
        .on("click", function(cluster){
            open_stats_painting(cluster, data, number_windows, "window");
            number_windows += 1;
        }) 

      .attr("fill", function(d) {
        var circle = [parseInt(d["long"]),
            parseInt(d["lat"])];
            var rotate = projection.rotate(); // antipode of actual rotational center.
            var center = [-rotate[0], -rotate[1]]
            var distance = d3.geoDistance(circle,center);
            return distance > Math.PI/2 ? 'none' : color['style'][d['sub']];
        })      
      .transition()
      .attr("r", function(d) {return 4*Math.log(d['id'].length);})   
      .style("opacity", 0.75)
      .duration(400)
      .attr("transform", function(d) {
        var proj = projection([
            parseInt(d["long"]),
            parseInt(d["lat"])])
        return "translate(" + [proj[0] - d["width"], proj[1] - d["height"]]
         + ")";
    });
          
        
};


function painting_gallery(number_windows, div){
    var newWindow =  d3.select("body").append("div")
    .attr("class", "window")
    .attr("id", div + number_windows)
    .style("opacity", 0);
    var x = d3.select("#" + div + number_windows).append("div")
        .attr("class", "x")
        .style("opacity", 0)
        .style("pointer-events","visible");
    windowgrab = d3.select("#" + div + number_windows).append("div")
        .attr("class", "windowgrab")
        .style("pointer-events", "visible");
    var statistics = d3.select("#" + div + number_windows).append("div")
        .attr("class", "statistics")
        .style("opacity", 0)
        .style("pointer-events","visible");
    var slidewindow = d3.select("#" + div + number_windows).append("div") 
        .attr("class", "slidewindow")
        .attr("id", 'slidewindow' + number_windows)
        .style("opacity", 0);

    newWindow.transition()        
        .duration(200)      
        .style("opacity", .9)
        .style("left", (d3.event.pageX / 2) + "px")     
        .style("top", (d3.event.pageY - 200) + "px");

    var rightresizer = d3.select("#" + div + number_windows).append("div")
        .attr("windownumber", number_windows)
        .attr("class", "rightresize")
        .style("pointer-events","visible");
    var downresizer = d3.select("#" + div + number_windows).append("div")
        .attr("windownumber", number_windows)
        .attr("class", "downresize")
        .style("pointer-events","visible");


    var moveWindow = d3.drag()
        .on('drag', function(){
            console.log("grab")
            x = d3.event.x;
            y = d3.event.y;
            
            newWindow.style("left", x + "px");
            newWindow.style("top",  y + "px");
        }); 

         newWindow.call(moveWindow);

    var windowResizeRight = d3.drag()
        .on('drag', function(){
            console.log("right")
            x = d3.event.x;
            y = d3.event.y;

            x = Math.max(50, x);
            y = Math.max(50, y);
            
            newWindow.style("width", x + "px");
            newWindow.style("height", y + "px");
        }); 
        
    var windowResizeDown = d3.drag()
        .on('drag', function(){
            console.log("down")
            x = d3.event.x;
            y = d3.event.y;

            x = Math.max(50, x);
            y = Math.max(50, y);
            
            newWindow.style("width", x + "px");
            newWindow.style("height", y + "px");
        });    
    
    rightresizer.call(windowResizeRight);
    downresizer.call(windowResizeDown);

    statistics.transition()
        .duration(200)      
        .style("opacity", 1)
        .style("left", (newWindow.width + 20) + "px")
        .style("top", (newWindow.height - 10) + "px");

    slidewindow.transition()
        .duration(200)      
        .style("opacity", 1)
        .style("left", (newWindow.width + 20) + "px")
        .style("top", (newWindow.height - 10) + "px");



    x.transition()
        .duration(200)
        .style("opacity", 1)
        .style("left", (newWindow.width + 10) + "px")     
        .style("top", 10 + "px");
        
    x.on("click", function(){
        if(div == "window"){
            d3.select("#" + div + number_windows)
            .transition().duration(1000)
            .style("opacity", 0).remove(); 
            slides
                .transition().duration(1000)
                .style("opacity", 0);
            }
        else{
            d3.select("#" + div + number_details_painting)
                .transition().duration(1000)
                .style("opacity", 0)
                .remove();
            d3.select("div.window")
                .style("z-index", 1)
                .transition().duration(1000)
                .style("opacity", 0.9);
        }
        });

    return statistics;
}

// When clicked, new window will open. All divs within this window is defined here
function open_stats_painting(cluster, data, number_windows, div) {
    
    statistics = painting_gallery(number_windows, div);
  
        
    // slidewindow.on("mouseover", svgContainer.on('.zoom', null), console.log("isfjlfesijl"))
    // .on("mouseleave", 
    //     console.log("iijfes"),
    //     zoom = d3.zoom() // Init zoom again
    //         .scaleExtent([1, 8])
    //         .on("zoom", zoomed),
    //     svgContainer.call(zoom)
    // );

    statistics.text("ifjofejoifesjoifesjfesoij")

    var paintings = retreive_paintings(data, cluster.id);

    // Weird bug of not updating the images the first time
    for(var i = 0; i < 2; i++){
        slides = add_paintings(paintings, "#slidewindow" + number_windows)
    }
    
    slides.on("click", function(painting){
        number_details_painting +=1;
        d3.select("#" + div + number_windows)
            .transition().duration(1000)
            .style("opacity", 0)
            .style("z-index", -1)
        details_painting(painting);
    });
    
   
    
  }


  function details_painting(painting, div){
    
    statistics = painting_gallery(number_details_painting, "details")
    statistics.html("This painting was made by " + painting.artist_full_name + " in " + painting.date +  " and was named " + "'" + painting.artwork_name + "'" +
                    "<br /> The painting was made in " + painting.city + ": " + painting.country +
                    "<p /> <img src= " + painting.image_url + " width= '500px' height = '500px' ></img> ");
    console.log(painting);
  }

//=========================================== Painting images START

  // Add the paintings src inside image
  function add_paintings(paintings_list, div){

    var slides = d3.select(div)
        .selectAll("img")
        .data(paintings_list);

    slides.enter()
        .append("img") 
        .attr("class", "slide"); 

    slides.attr("src", function(d){ return d.image_url;})
        .attr("style", "float:left")
        .style("pointer-events","visible");;
    
    slides.style("opacity", 0) //start invisible
        .transition().duration(500) //schedule a transition to last 1000ms
        .delay(function(d,i){return i*500;})
        .style("opacity", 1); 

    return slides;
  }


  // Create subset of the paintings (is now 50 percent of total)
 function subset_paintings(cluster, data){
    var paintings_id = []; 
    var subset_amount =  Math.floor(cluster.id.length / 100 * 50) // Take half the ID's
     
    // Transfer all paintings to new array
     for(var i = 0; i < subset_amount; i++){
         paintings_id.push(cluster.id[i]);
     }

     paintings_list = retreive_paintings(data, paintings_id);
    
    return paintings_list;
 } 

 // Filtering paintings to get the correct one
function retreive_paintings(data,paintings_id){
    var paintings_list = [];
    paintings_id.forEach(function(id){
        paintings_list.push(data.filter(function(d){
            return d.omni_id === id;
        })[0]);
    });

    return paintings_list;
}
//=========================================== Painting images END


function cluster_data(data, show){

    /*
     * INPUT: 
     * dataset -- dataset for this time block
     * show -- either style, school or media
     * 
     * OUTPUT: 
     * clustered_data -- the clustered data

     example of cluster:
​​    end_date: 1459
​​    id: Array [ "27464", "29084" ]
    mean_lat: 46.7323875
​​    mean_long: -117.0001651
​​    start_date: 1459
​​    style: "early renaissance"
    */

    clustered_data = [];


    var nested_data  = d3.nest()
      .key(function(d) { return d[show]; }) // cluster on subclass
      .key(function(d) { return long_binner(d['long']); }) // cluster on cordinates
      .key(function(d) { return lat_binner(d['lat']); })
      .rollup(function(v) { 
        clustered_data.push({
        id: d3.map(v, function(d) { return d.omni_id; }).keys(), 
        start_date: d3.min(v, function(d) { return d.date; }), 
        end_date: d3.max(v, function(d) { return d.date; }), 
        lat: d3.mean(v, function(d) { return d.lat; }),
        long: d3.mean(v, function(d) { return d.long; }),
        sub: d3.map(v, function(d) { return d[show]; }).keys()[0], 
        }) 
        ;}) 
      .map(data);


    window.clustered_data = clustered_data

    return clustered_data
};

function draw_migration_flow(migration_data, oldest){
    /*
     * INPUT:
     * migration_data -- all other artworks with same show and subcategory as oldest
     * oldest -- oldest artwork with specified show and subcategory
    */
    
    // Remove existing arrows
    gArrows.selectAll("path").remove()
    
    // Create new arrows
    svgContainer.append("path")
        .data(migration_data)
        .attr("class", "path")
        .attr("d", path);
        
    var arrows = gArrows.selectAll('path.datamaps-arc').data(migration_data)
    
    arrows.enter()
        .append('path')
        .attr('class','arc')
        .attr('d', function(d) {
            
            var origin = projection([oldest.long, oldest.lat])
            var dest = projection([d.long, d.lat])
            
            
            var mid = [ (origin[0] + dest[0]) / 2, (origin[1] + dest[1]) / 2];
            
            //define handle points for Bezier curves. Higher values for curveoffset will generate more pronounced curves.
            var curveoffset = 20,
                midcurve = [mid[0]+curveoffset, mid[1]-curveoffset]
    
            // the scalar variable is used to scale the curve's derivative into a unit vector 
            scalar = Math.sqrt(Math.pow(dest[0],2) - 2*dest[0]*midcurve[0]+Math.pow(midcurve[0],2)+Math.pow(dest[1],2)-2*dest[1]*midcurve[1]+Math.pow(midcurve[1],2));
        
            // define the arrowpoint: the destination, minus a scaled tangent vector, minus an orthogonal vector scaled to the datum.trade variable
            arrowpoint = [ 
                dest[0] - ( 0.5*(dest[0]-midcurve[0]) - (dest[1]-midcurve[1]) ) / scalar , 
                dest[1] - ( 0.5*(dest[1]-midcurve[1]) - (-dest[0]+midcurve[0]) ) / scalar
                //dest[1] - ( 0.5*datum.trade*(dest[1]-midcurve[1]) - datum.trade*(-dest[0]+midcurve[0]) ) / scalar
            ];

            // move cursor to origin
            return "M" + origin[0] + ',' + origin[1] 
            // smooth curve to offset midpoint
                + "S" + midcurve[0] + "," + midcurve[1]
            //smooth curve to destination   
                + "," + dest[0] + "," + dest[1]
            //straight line to arrowhead point
                + "L" + arrowpoint[0] + "," + arrowpoint[1] 
            // straight line towards original curve along scaled orthogonal vector (creates notched arrow head)
                + "l" + (0.3*(-dest[1]+midcurve[1])/scalar) + "," + (0.3*(dest[0]-midcurve[0])/scalar)
                //+ "l" + (0.3*datum.trade*(-dest[1]+midcurve[1])/scalar) + "," + (0.3*datum.trade*(dest[0]-midcurve[0])/scalar)
                // smooth curve to midpoint 
                + "S" + (midcurve[0]) + "," + (midcurve[1]) 
                //smooth curve to origin    
                + "," + origin[0] + "," + origin[1]
            
        })
    //arrows.attr("fill", String(color[show][oldest[show]]))
    arrows.exit()
        .transition()
        .style('opacity', 0)
        .remove();
    
};

function retrieve_migration(dataset, show, sub){
    
    /*
     * INPUT: 
     * dataset -- complete dataset
     * show -- either style, school or media
     * sub -- which category of show to choose for migration data
     * 
     * OUTPUT: 
     * oldest -- oldest artwork for specified show and sub
     * all_others -- all other artworks for the specified show and sub
    */
    
    // Store oldest artwork
    var oldest = {}
    minimal = 3000
    
    // Retrieve oldest artwork 
    dataset.forEach(function(d){
        if (d[show] == sub && d.date < minimal){
            minimal = d.date
            oldest = d
        }
    })
    
    // Retrieve all other artworks with similar style, school or media
    all_others = []
    dataset.forEach(function(d){
            if (d[show] == sub && d.artwork_name != oldest.artwork_name){
                all_others.push(d)
            }
        });
    
    return [oldest, all_others]
    
};

function update(switch_to, center, translation) {
    
  svgContainer.selectAll("#world").transition()
      .duration(1000).ease(d3.easeLinear)
      .attrTween("d", projectionTween(projection, projection = switch_to, center, translation))

//   svgContainer.selectAll("#water").transition()
//       .duration(1000).ease(d3.easeLinear)
//       .attrTween("d", projectionTween(projection, projection = switch_to))

}

function projectionTween(projection0, projection1, center, translation) {
    
  return function(d) {
    var t = 0;
    if (translation){
        var projection = d3.geoProjection(project)
            .scale(1)
            .translate([width/2, height/4])
            .center(center)
    } else {
        var projection = d3.geoProjection(project)
            .scale(1)
            .center(center)
    }
    
    var path = d3.geoPath(projection);
    
    function project(lambda, phi) {
      lambda *= 180 / Math.PI, phi *= 180 / Math.PI;
      var p0 = projection0([lambda, phi]), p1 = projection1([lambda, phi]);
      return [(1 - t) * p0[0] + t * p1[0], (1 - t) * -p0[1] + t * -p1[1]];
    }
    
    return function(_) {
        
      t = _;
      return path(world);
    };
    
  };
}
