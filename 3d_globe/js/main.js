var width = 1000;
var height = 800;
var centered;

legendRectSize = 18;
legendSpacing = 4;

var show = 'style';
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
var YEAR_STEP = 5
var LONGLAT_STEP = 0.2

// for migration:
var show_migration = false;
var oldest;

// legend globals
var selected_subs = [];
var subs_present = [];
var clicked = {};


var svgContainer = d3.select("#globe").append("svg")
    .attr("height", height)
    .attr("width", width);
var svgStatistics = d3.select("#stats").append("svg")
    .attr("height", 200)
    .attr("width", 750);
var distributionstats =  d3.select("#statsright").append("div")
.attr("class", "widget")
.style("width", 400)
.style("height", 400)
.style("opacity", 1);

var globalstats =  d3.select("#statsright").append("div")
.attr("class", "widget")
.style("width", 400)
.style("height", 400)
.style("opacity", 1);

var svgColors = d3.select("#legend")
    .append("svg")
    .attr("width", 1764)
    .attr("height", 75);

var is2d = false; //check if 2d or 3d for play button
var clustered_data;
var all_data;

// media/style checkbox
var style_box = document.getElementById('option-1');
document.getElementById('option-1').checked = true;
var media_box = document.getElementById('option-2');
document.getElementById('option-2').checked = false;

////////////////
// Create map //
////////////////

// Create map
var projection = d3.geoOrthographic().translate([width/2, height/4]).scale(350).center([0,30]);

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

///////////////////////////
/// Set globe behaviour ///
///////////////////////////

var rotation_timer = d3.timer(function() {
    rotateglobe();
});

window.rotation_timer = rotation_timer
var drag = callglobedrag();

////////////////////////////////////////////////////////////
////// container, div and star stuff for slider plot ///////
////////////////////////////////////////////////////////////

var symbolGenerator = d3.symbol()
    .type(d3.symbolStar)
    .size(80);
var star = symbolGenerator();
var star_div = d3.select("#slider-plot-container")
    .append('svg')
    .attr('width', 1025)
    .attr('height', 150);
var gstar =  star_div.append("g")
    .attr("transform", "translate(10, 10)");
var star_xScale = d3.scaleQuantize()
    .domain([0, 2020])
    .range(d3.range(0, 1010, 1));

var star_yScale = d3.scaleLinear()
    .range([0, 100]);



//////////////////////////
//// SLIDER BEHAVIOUR ////
//////////////////////////

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
var all_categories = {}

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
// of each sub class, collect the first time that it occured
var schools_data = [];var styles_data = [];var media_data = [];
//////////////////////////////////////////////
///// LOAD DATA AND SHOW IT ACCORDINGLY //////
//////////////////////////////////////////////

d3.csv("omni_locations.csv")
    .then(function(data){

        all_data = data
        all_data = all_data.filter(function(d){
            return d.media != "Unknown" && d.style != "Unknown";
        })
        
        
        // initialize things to show
        
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
        
        d3.select("#migrationflow")
            .on("click", function(d){
                if (show_migration == false){
                    show_migration = true;
                    document.getElementById("migrationflow").children[0].style.display = "none" 
                    update_visuals(year_interval, data, show, projection);
                }
                else {
                    show_migration = false;
                    gArrows.selectAll("#arrow").remove()    
                    document.getElementById("migrationflow").children[0].style.display = "block"                        
                }
            });
        
        document.getElementById("legendCheckbox").checked = true;
        // Reselect all elements of the legend when clicking on the checkbox
        d3.select("#legendCheckbox").on("click", function(){
            
            // Make all bars selected again
            svgColors.selectAll("#legendbar").style("opacity", 1)
            
            selected_subs = []
            
            // For each sub present in the map at the moment, make them visible again
            subs_present.forEach(function(subs){
                identifyer = subs
                identifyer = identifyer.replace(/[^a-zA-Z0-9 \s !?]+/g, '')
                identifyer = identifyer.replace(/\s/g, '')
                birth_identifyer = "birthstars" + identifyer
                identifyer = "a" + identifyer
                gPins.selectAll("#" + identifyer).style("opacity", 0.55)
                gPins.selectAll("#" + birth_identifyer).style("opacity", 1)
                    /*.on("mouseover", function(element){
                        
                        // Retrieve tooltips again
                        tooltip.transition()        
                                .duration(200)      
                                .style("opacity", .9)
                                .style("left", (d3.event.pageX +20) + "px")     
                                .style("top", (d3.event.pageY - 28) + "px")
                                .style("z-index", 1);
                    })*/
            })
        })
        
        
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
             if (is_globe){
                 new_projection = d3.geoNaturalEarth1().translate([width/2, height/4]).scale(250).center([0,30])
                 update(new_projection, [0, 30], translation = false)
                 
                 projection = new_projection
                 
                 path = d3.geoPath().projection(projection);
                 setTimeout(function(){ g.selectAll("path")
                     .transition()
                     .duration(20)
                     .ease(d3.easeLinear)
                     .attr("d", path(world))
                     .attr("fill", "#06304e")
                     .attr("stroke", "#001320"); }, 990);
                 water.attr("d", path);

                 svgContainer.selectAll("circle").transition().duration(200) // Will remove all previous circles when update is initiated
                    .style("opacity", .1)
                    .attr("r", 0)
                    .remove();

                gArrows.selectAll("#arrow").transition().duration(200) // Will remove all previous circles when update is initiated
                    .style("opacity", .1)
                    .remove();

                setTimeout(function(){update_visuals(year_interval, data, show, projection)}
                    , 1000)

                /*
                 // Update circles correct positions
                 svgContainer.selectAll("circle")
                    .attr("transform", function(d) {
                        var proj = projection([
                            parseInt(d["long"]),
                            parseInt(d["lat"])])
                        return "translate(" + [proj[0] - d["width"], proj[1] - d["height"]]
                         + ")";
                    });
                    */
            }

            
            is_globe = false;            
        })
        // .style("opacity", 0);

        d3.select("#threemap")
        .style("opacity", 1)
        .on("click", function(d){
            svgContainer.on('.zoom', null);
            zoom = d3.zoom()
                .scaleExtent([1, 8])
                .on("zoom", zoomed);
            is2d = false;
            drag = callglobedrag();
            if (!is_globe){
            new_projection = d3.geoOrthographic().translate([width/2, height/4]).scale(350).center([0,30])
            zoom.transform(svgContainer, d3.zoomIdentity.translate(0,0).scale(1)); // Set back to center position
            update(new_projection, [0, 30], translation = true)
            projection = new_projection
            path = d3.geoPath().projection(projection);
            setTimeout(function(){ g.selectAll("path")
                 .transition()
                 .duration(45)
                 .ease(d3.easeLinear)
                 .attr("d", path(world))
                 .attr("fill", "#06304e")
                 .attr("stroke", "#001320"); }, 990);
            water.attr("d", path); // Add water again

            svgContainer.selectAll("circle").transition().duration(200) // Will remove all previous circles when update is initiated
                    .style("opacity", .1)
                    .attr("r", 0)
                    .remove();

            gArrows.selectAll("#arrow").transition().duration(200) // Will remove all previous circles when update is initiated
                    .style("opacity", .1)
                    .remove();

            setTimeout(function(){update_visuals(year_interval, data, show, projection)}
                , 1000)
            }

            is_globe = true;            
       
        });
        d3.select("#map_control_zoom_in")
            .on("click", function(d){
                zoom.scaleBy(svgContainer, 1.3);
                zoom = d3.zoom()
                .scaleExtent([1, 8])
                .on("zoom", zoomed);
                
            })

        d3.select("#map_control_zoom_out")
            .on("click", function(d){
                zoom.scaleBy(svgContainer, 1 / 1.3);
                zoom = d3.zoom()
                    .scaleExtent([1, 8])
                    .on("zoom", zoomed);
            })

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
            moving = pauseResumeButton();
            if(moving){
                playButton
                .on("click", function() {
                    rotation_timer.stop();
                    pauseResumeButton();
            })
            }
        }
        
        
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


        // sort the arrays on date, such that colors can be based on time order
        styles_data.sort(function(x, y){
            return d3.ascending(x.first, y.first);
        })
        schools_data.sort(function(x, y){
            return d3.ascending(x.first, y.first);
        })
        media_data.sort(function(x, y){
            return d3.ascending(x.first, y.first);
        })

        // get ordered sub catagories
        var all_styles = styles_data.map(function(d) { return d.sub })
        var all_schools = schools_data.map(function(d) { return d.sub })
        var all_media = media_data.map(function(d) { return d.sub })
        all_categories['style'] = all_styles
        all_categories['media'] = all_media


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

        // LEGEND
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

        // make the data needed for the slider chart
        styles_slider_data = []; media_slider_data = []; school_slider_data = [];
        d3.nest()
            .key(function(d) { return year_binner(d['date']); })
            .rollup(function(v) { 
                styles_slider_data.push({
                year: d3.min(v, function(d) { return +d.date; }), 
                data: d3.map(v, function(d) { return d.style; }).keys(), 
                // birth: d3.map(v, function(d) { return d.style; }), 
                }) 
                media_slider_data.push({
                year: d3.min(v, function(d) { return +d.date; }), 
                data: d3.map(v, function(d) { return d.media; }).keys(), 
                }) 
                school_slider_data.push({
                year: d3.min(v, function(d) { return +d.date; }), 
                data: d3.map(v, function(d) { return d.school; }).keys(), 
                }) 
        }).map(data);

        update_slider_plot(styles_slider_data, styles_data, color, show, year_interval)
        clustered_data = update_visuals(year_interval, all_data, show, projection)

        slider.onChange(function(newRange){
            d3.select("#range-label").text(newRange.begin + " - " + newRange.end);
            year_interval = [newRange.begin, newRange.end]
            update_visuals(year_interval, all_data, show, projection)
            //console.log(show)

            // update navbar
            nav_bar(clustered_data, color, show)        


            update_chart(clustered_data,year_interval, color, show);   

            // required for keeping track of current time period
            // very ugly if statement but for now
            if (show==='style'){ update_slider_plot(styles_slider_data, styles_data, color, show, year_interval) }
            else if (show==='school'){ update_slider_plot(school_slider_data, schools_data, color, show, year_interval) }
            else if (show==='media'){ update_slider_plot(media_slider_data, media_data, color, show, year_interval) }
            // update_slider_plot(styles_slider_data, styles_data, color, show, year_interval)         
        });
    
        //var legend = show_legend(all_styles, styles_colors, data, show, show_migration, century)

        // style_box.on("click", function(d){
        //     console.log('hi')
        // })

        
});


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



// THIS FUNCTION IS REQUIRED FOR DELETING NODES CORRECTLY
var contains = function(needle) {
    // Per spec, the way to identify NaN is that it is not equal to itself
    var findNaN = needle !== needle;
    var indexOf;

    if(!findNaN && typeof Array.prototype.indexOf === 'function') {
        indexOf = Array.prototype.indexOf;
    } else {
        indexOf = function(needle) {
            var i = -1, index = -1;

            for(i = 0; i < this.length; i++) {
                var item = this[i];

                if((findNaN && item !== item) || item === needle) {
                    index = i;
                    break;
                }
            }

            return index;
        };
    }

    return indexOf.call(this, needle) > -1;
};

function changeStyle(element){
    // check if element clicked is style
    if (element.id == 'option-1'){
        show = 'style'
    }
    else if (element.id == 'option-2'){
        show = 'media'
    }

    update_slider_plot(media_slider_data, media_data, color, show, year_interval)
    update_visuals(year_interval, all_data, show, projection)
    nav_bar(clustered_data, color, show)
    update_chart(clustered_data,year_interval, color, show);   
    if (show==='style'){ update_slider_plot(styles_slider_data, styles_data, color, show, year_interval) }
    else if (show==='school'){ update_slider_plot(school_slider_data, schools_data, color, show, year_interval) }
    else if (show==='media'){ update_slider_plot(media_slider_data, media_data, color, show, year_interval) }


}
