var width = 1500;
var height = 750;

legendRectSize = 18;
legendSpacing = 4;

var century = 0;

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
var centuries = d3.range(0, 22, 1);
var years = d3.range(100, 2019, 1);



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

// d3.select('p#value-range').text(
// sliderRange
//   .value()
//   .map(d3.format(',d'))
//   .join('-')
// );


var color = {'school': {}, 'style': {}, 'media':{}}

d3.csv("omni_locations.csv")
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
		var year = 100
		
		// var legend = show_legend(all_styles, styles_colors)

		sliderFill
			.on('onchange', val => {
			d3.select('p#value-fill').text(d3.format('d')(val));
			year = val
			update_visuals(year, data, show)
	    });

			  // d3.select('p#value-fill').text(d3.format('.2%')(sliderFill.value()));
		// on button press, only show button id and try to filter by year
		d3.select("#style")
		.on("click", function(d){
			show = 'style'
			update_visuals(century,data,show)
            legend = update_legend(all_styles, styles_colors, legend)
		});

		d3.select("#school")
		.on("click", function(d){
			show = 'school'
			update_visuals(century,data,show)
            legend = update_legend(all_schools, schools_colors, legend)
		});

		d3.select("#media")
		.on("click", function(d){
			show = 'media'
			update_visuals(century,data,show)
            legend = update_legend(all_media, media_colors, legend)
		});

});


// Function what happens when zooming
// TODO: Create transitions for smooth zooming
function zoomed() {
	g.attr("transform", d3.event.transform)
    gPins.attr("transform", d3.event.transform)
}

function show_legend(data_set, colors){
    
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
            console.log(svg.select("#check").node().checked);
        });
    
    // Add text to legend
    legend.append('text')                                
        .attr('x', legendRectSize + legendSpacing)       
        .attr('y', legendRectSize - legendSpacing)       
		.text(function(d) { return d; }); 
		
		return legend
};


function update_legend(data_set, colors, legend){
	legend.remove() // Remove old legend
	legend = show_legend(data_set, colors)// Create new legend
	return legend
}



function update_visuals(year, data, show){

	// extract the centuries to show
	var year = Math.round(year)

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
		if (d['date'] == year){
			// convert lng and lat to coordinates
			if (d["long"] != "N\\A"){
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
          d["long"],
          d["lat"]
        ]) + ")";
	});
};

