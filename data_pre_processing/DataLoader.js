var width = 1500;
var height = 750;
var centered;

legendRectSize = 18;
legendSpacing = 4;

var century = 0;
var zoom_level = 0
// years and locations are binned to prevent clutter
var YEAR_STEP = 3
var LONGLAT_STEP = 0.2
var YEARS_PER_SECOND = 1000

var show_migration = true;
var svgContainer = d3.select("body").append("svg")
                                        .attr("height", height)
                                        .attr("width", width);

// Create map
var projection = d3.geoMercator().translate([width/2, height/2]).scale(200).center([0,40]);
var zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", zoomed);
var path = d3.geoPath().projection(projection);
var water = svgContainer
    .append("path")
    .datum({type: "Sphere"})
    .attr("class", "water")
    .attr("d", path);
var g = svgContainer.append("g"); //For map
var gPins = svgContainer.append("g"); //For pins on map (new abstract layer)
var gArrows = svgContainer.append("g"); // For arrows of migration
var tooltip = d3.select("body").append("div")   
                    .attr("class", "tooltip")               
                    .style("opacity", 0);
svgContainer.call(zoom) //Use zoom

var url = "http://enjalot.github.io/wwsd/data/world/world-110m.geojson";
var data_url = "http://enjalot.github.io/wwsd/data/world/ne_50m_populated_places_simple.geojson";


Promise.all([d3.json(url), d3.json(data_url)]).then(function(data) {
    var world = data[0];
    var places = data[1];

    g.append("path")
    .attr("d", path(world))
    .attr("fill", "lightgray")
    .attr("stroke", "white");
});


// hard code centuries and years 
//TODO: softcode
var centuries = d3.range(0, 22, 1);
var years = d3.range(100, 2025, 1);

// Variables for play/pause button
var moving = false;
var playButton = d3.select("#play-button");
playButton.attr("margin-left", "200px")
var playAuto = true;

// filter slider
var sliderFill = d3
.sliderBottom()
.min(d3.min(years))
.max(d3.max(years))
.width(900)
.tickFormat(d3.format('d'))
.ticks(centuries.length)
.default(0.015)
.fill('#2196f3')

var gFill = d3
.select('div#slider-fill')
.append('svg')
.attr('width', 1000)
.attr('height', 100)
.append('g')
.attr('transform', 'translate(30,30)');

gFill.call(sliderFill);
d3.select('p#value-fill').text(d3.format('d')(sliderFill.value()));


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
        d3.select(".play-button").attr("hidden", true);
        playButton.attr("class", "pause-button");
        timer = setInterval (function() {
            sliderFill.value(sliderFill.value() + 1) 
        }, YEARS_PER_SECOND);
        
    moving = true;
    }

    return moving;
}

d3.csv("omni_locations.csv")
    .then(function(data){

        // initialize things to show
        var show = 'style'
        var year = 100

        if (!playAuto){
            // Play button will add one year per half a second
            playButton
            .on("click", function() {
                pauseResumeButton();
            })
        }
        // Run auto button
        else{
            moving = pauseResumeButton(playButton);
            if(moving){
                playButton
                .on("click", function() {
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
        sliderFill
            .on('onchange', val => {
            d3.select('p#value-fill').transition()
            .duration(10).style("opacity", 0);
            d3.select('p#value-fill').text(d3.format('d')(val)).transition()
            .style("opacity", 1)
            .transition()
            .delay(5);
            year = val
            update_visuals(year, data, show)
        });

        //var legend = show_legend(all_styles, styles_colors, data, show, show_migration, century)

        
        // on button press, only show button id and try to filter by year
        d3.select("#style")
        .on("click", function(d){
            show = 'style'
            update_visuals(year,data,show)
            legend = update_legend(all_styles, styles_colors, legend, data, show, show_migration, century)
        });

        d3.select("#school")
        .on("click", function(d){
            show = 'school'
            update_visuals(year,data,show)
            legend = update_legend(all_schools, schools_colors, legend, data, show, show_migration, century)
        });

        d3.select("#media")
        .on("click", function(d){
            show = 'media'
            update_visuals(year,data,show)
            legend = update_legend(all_media, media_colors, legend, data, show, show_migration, century)
        });

        
});

// Function what happens when zooming
// changes bin size of spacil clustering
// TODO: Create transitions for smooth zooming
function zoomed() {
    zoom = d3.event.transform;
    zoom_level = zoom["k"];
    water.attr("transform", d3.event.transform);
    g.attr("transform", d3.event.transform);
    gPins.attr("transform", d3.event.transform);
    gArrows.attr("transform", d3.event.transform);
    long_binner.range(d3.range(-180, 180, LONGLAT_STEP/zoom_level));
    lat_binner.range(d3.range(-90, 90, LONGLAT_STEP/zoom_level));
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


function update_visuals(year, data, show){
    // extract the centuries to show
    var year = Math.round(year);
    var filtered_data = [];
    // var opacity;

    // convert coordinates, take max and set that to 0-1500 for longitude
    // and 0-750 for latitude
    //dbp_lat, dbp_long

    // TODO REMOVE THE PINS CORRECTLY
    svgContainer.selectAll("circle").transition().duration(200) // Will remove all previous circles when update is initiated
        .style("opacity", .1)
        .attr("r", 0)
        .remove();

    // find all events in last 5 steps and adjust opacity
    for(i=0;i<=4;i++){
        
        opacity = 0.8-Math.tanh(i*2)
        
        // load style part of data
        data.forEach(function(d){
            
            if(d["omni_id"] != ""){
              

                // works except for the fact that 1700 will be 17th century
                // use year and slider to determine which datapoints have to be plotted
                if (year_binner(d['date']) == year_binner(year)-YEAR_STEP){
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

        clustered_data = cluster_data(filtered_data, show);

        window.clustered_data = clustered_data
        window.filtered_data = filtered_data

        // For testing if transitions work properly, otherwise the transitions will be overwritten when the circles are not removed yet   
        var randomLong = 0;//Math.random();
        var randomLat = 0;//Math.random();
           
        // insert filtered data into world map
        gPins.selectAll(".pin")
            .data(clustered_data)
            .enter().append("circle", ".pin")
            .on("mouseover",function(cluster){  
                tooltip.transition()        
                .duration(200)      
                .style("opacity", .9)
                .style("left", (d3.event.pageX +20) + "px")     
                .style("top", (d3.event.pageY - 28) + "px");
                
                tooltip.text("There are a total of " + cluster.id.length + " paintings in the style: " + cluster.sub )
                .style("left", (d3.event.pageX) + "px")     
                .style("top", (d3.event.pageY - 28) + "px")
            
                paintings_list = subset_paintings(cluster, data);
            
                // Change text size according to amount of paintings
                if(paintings_list.length < 2){
                    tooltip.style("width", "200px");
                }
                else if(parseInt.length < 4){
                    tooltip.style("width", "300px");
                }
                else{
                    tooltip.style("width", "500px");
                }
            
                // Weird bug of not updating the images the first time
                for(var i = 0; i < 2; i++){
                    slides = add_paintings(paintings_list, ".tooltip");
                }

            })
            .on("mouseout", function() {  
                tooltip.transition()        
                .duration(500)      
                .style("opacity", 0);
            })
            .on("click", function(cluster){
                clicked(cluster, data);
            })
         
          .attr("fill", function(d) {return color[show][d['sub']];})    
          .transition()
          .attr("r", function(d) {return 4*Math.log(d['id'].length);})   
          .style("opacity", opacity)
          .duration(400)
          .attr("transform", function(d) {
            return "translate(" + projection([
                parseInt(d["long"]) + randomLong,
                parseInt(d["lat"])  + randomLat
            ]) + ")";
        });

        
      }
};

// When clicked, new window will open. All divs within this window is defined here
function clicked(cluster, data) {
    svgContainer.on('.zoom', null);

    var newWindow =  d3.select("body").append("div")
    .attr("class", "window")
    .style("opacity", 0);
    var x = d3.select("div.window").append("div")
        .attr("class", "x")
        .style("opacity", 0)
        .style("pointer-events","visible");
    var statistics = d3.select("div.window").append("div")
        .attr("class", "statistics")
        .style("opacity", 0)
        .style("pointer-events","visible");
    var slidewindow = d3.select("div.window").append("div") // TODO: transform to window
        .attr("class", "slidewindow")
        .style("opacity", 0);

    newWindow.transition()        
        .duration(200)      
        .style("opacity", .9)
        .style("left", (d3.event.pageX / 2) + "px")     
        .style("top", (d3.event.pageY - 150) + "px");

    var rightresizer = d3.select("div.window").append("div")
        .attr("class", "rightresize")
        .style("pointer-events","visible");
    var downresizer = d3.select("div.window").append("div")
        .attr("class", "downresize")
        .style("pointer-events","visible");

    var windowResizeRight = d3.drag()
        .on('drag', function(){
            console.log("right")
            x = d3.mouse(this.parentNode)[0];
            y = d3.mouse(this.parentNode)[1];

            x = Math.max(50, x);
            y = Math.max(50, y);
            
            newWindow.style("width", x + "px");
            newWindow.style("height", y + "px");
        }); 
        
    var windowResizeDown = d3.drag()
        .on('drag', function(){
            console.log("down")
            x = d3.mouse(this.parentNode)[0];
            y = d3.mouse(this.parentNode)[1];

            x = Math.max(50, x);
            y = Math.max(50, y);
            
            newWindow.style("width", x + "px");
            newWindow.style("height", y + "px");
        });    
    
    
    rightresizer.call(windowResizeRight);
    downresizer.call(windowResizeDown);

    statistics.transition()
        .duration(200)      
        .style("opacity", .9)
        .style("left", (newWindow.width + 20) + "px")
        .style("top", (newWindow.height - 10) + "px");

    slidewindow.transition()
        .duration(200)      
        .style("opacity", .9)
        .style("left", (newWindow.width + 20) + "px")
        .style("top", (newWindow.height - 10) + "px");
        

    statistics.text("ifjofejoifesjoifesjfesoij")

    var paintings = retreive_paintings(data, cluster.id);
    // Weird bug of not updating the images the first time

    for(var i = 0; i < 2; i++){
        slides = add_paintings(paintings, ".slidewindow")
    }
    
    
    x.transition()
        .duration(200)
        .style("opacity", .9)
        .style("left", (newWindow.width + 10) + "px")     
        .style("top", 10 + "px");
        
    x.on("click", function(){
        zoom = d3.zoom() // Init zoom again
            .scaleExtent([1, 8])
            .on("zoom", zoomed);
        svgContainer.call(zoom);
        newWindow
            .transition().duration(1000)
            .style("opacity", 0).remove(); 
            
        slides
            .transition().duration(1000)
            .style("opacity", 0);
        });
    
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
        .attr("style", "float:left");
    
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