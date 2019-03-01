
var width = 1500;
var height = 750;

legendRectSize = 18;
legendSpacing = 4;

var century = 0;

var show_migration = true;
var svgContainer = d3.select("body").append("svg")
										.attr("height", height)
										.attr("width", width);

// Create map
var projection = d3.geoMercator()//.translate([width/2, height/2]).scale(2200).center([0,40]);
var zoom = d3.zoom()
.scaleExtent([1, 8])
.on("zoom", zoomed);
var path = d3.geoPath().projection(projection);

var g = svgContainer.append("g"); //For map
var gPins = svgContainer.append("g"); //For pins on map (new abstract layer)
var gArrows = svgContainer.append("g"); // For arrows of migration

var url = "http://enjalot.github.io/wwsd/data/world/world-110m.geojson";
var data_url = "http://enjalot.github.io/wwsd/data/world/ne_50m_populated_places_simple.geojson";

svgContainer.call(zoom)
Promise.all([d3.json(url), d3.json(data_url)]).then(function(data) {
	var world = data[0];
	var places = data[1];

	g.append("path")
	.attr("d", path(world))
	.attr("fill", "lightgray")
	.attr("stroke", "white");
});


// set centuries
var centuries = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21]

// Range
var sliderRange = d3
.sliderBottom()
.min(d3.min(centuries))
.max(d3.max(centuries))
.width(600)
.tickFormat(d3.format(',d'))
.ticks(centuries.length)
.default([0, 1])
.fill('#2196f3');

var gRange = d3
.select('div#slider-range')
.append('svg')
.attr('width', 1000)
.attr('height', 100)
.append('g')
.attr('transform', 'translate(30,30)');

gRange.call(sliderRange);

d3.select('p#value-range').text(
sliderRange
  .value()
  .map(d3.format(',d'))
  .join('-')
);


var color = {'school': {}, 'style': {}, 'media':{}}

d3.csv("output.csv")
	.then(function(data){

		let all_schools_set = new Set()
		let all_styles_set = new Set()
		let all_media_set = new Set()

		// LOAD DATA 
		// and show style
		data.forEach(function(d) {

			d.style = d.style
			d.date = +d.date
			d.school = d.school

			//get all unique items
			all_schools_set.add(d.school)
			all_styles_set.add(d.style)
			all_media_set.add(d["media"])

		});

		// set up colorpallette for every style? 
		var all_styles = Array.from(all_styles_set)
		var all_schools = Array.from(all_schools_set)
		var all_media = Array.from(all_media_set)
        
        var styles_colors = [];
        var schools_colors = [];
        var media_colors = [];

		for (var i = 0; i < all_styles.length; i++){
			color['style'][all_styles[i]] = d3.interpolateWarm(i/all_styles.length)
            styles_colors.push(d3.interpolateWarm(i/all_styles.length))
		}

		for (var i = 0; i < all_schools.length; i++){
			color['school'][all_schools[i]] = d3.interpolateViridis(i/all_schools.length)
            schools_colors.push(d3.interpolateViridis(i/all_schools.length))
		}

		for (var i = 0; i < all_media.length; i++){
			color['media'][all_media[i]] = d3.interpolateViridis(i/all_media.length)
            media_colors.push(d3.interpolateViridis(i/all_media.length))
		}

		// initialize things to show
		var show = 'style'
		var century = [0,1]
		
		var legend = show_legend(all_styles, styles_colors, data, show, show_migration, century)

		sliderRange
			.on('onchange', val => {
	      d3.select('p#value-range').text(val.map(d3.format(',d')).join('-'));
	      century = val
	      update_visuals(century, data, show)
          legend = update_legend(all_styles, styles_colors, legend, data, show, show_migration, century)
	    });
        
        
		// on button press, only show button id and try to filter by year
		d3.select("#style")
		.on("click", function(d){
			show = 'style'
			update_visuals(century,data,show)
            legend = update_legend(all_styles, styles_colors, legend, data, show, show_migration, century)
		});

		d3.select("#school")
		.on("click", function(d){
			show = 'school'
			update_visuals(century,data,show)
            legend = update_legend(all_schools, schools_colors, legend, data, show, show_migration, century)
		});

		d3.select("#media")
		.on("click", function(d){
			show = 'media'
			update_visuals(century,data,show)
            legend = update_legend(all_media, media_colors, legend, data, show, show_migration, century)
		});

		
});


// Function what happens when zooming
// TODO: Create transitions for smooth zooming
function zoomed() {
	g.attr("transform", d3.event.transform)
    gPins.attr("transform", d3.event.transform)
    gArrows.attr("transform", d3.event.transform)
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



function update_visuals(century, data, show){

	// extract the centuries to show
	var high_century = Math.round(Math.max.apply(null, century))
	var low_century = Math.round(Math.min.apply(null, century))

	// convert coordinates, take max and set that to 0-1500 for longitude
	// and 0-750 for latitude
	//dbp_lat, dbp_long

	// TODO REMOVE THE PINS CORRECTLY
	svgContainer.selectAll("circle").remove();

	var filtered_data = []
	// load style part of data
	data.forEach(function(d){
		// works except for the fact that 1700 will be 17th century
		// use year and slider to determine which datapoints have to be plotted
		if ((Math.ceil((d['date']+1) /100)) < high_century && (Math.ceil((d['date']+1) /100)) > low_century){

			// convert lng and lat to coordinates
			if (d["dbp_long"] != "N\\A"){
				//svgContainer.append("circle")
				//	.attr("cx", (Math.abs(d["dbp_long"])+10)*5)
				//	.attr("cy", (Math.abs(d["dbp_lat"])+10)*5)
				//	.attr("r",3)

				// add datapoint to filtered_data
				filtered_data.push(d)
			}
		}
	});

			
	// insert filtered data into world map
    gPins.selectAll(".pin")
      .data(filtered_data)
      .enter().append("circle", ".pin")
      .attr("r", 3)
      .attr("fill", function(d) {return color[show][d[show]];})	
      .attr("transform", function(d) {
        return "translate(" + projection([
          d["dbp_long"],
          d["dbp_lat"]
        ]) + ")";
	});
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
            
            var origin = projection([oldest.dbp_long, oldest.dbp_lat])
            var dest = projection([d.dbp_long, d.dbp_lat])
            
            
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

