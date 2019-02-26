
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
var path = d3.geoPath().projection(projection);

var g = svgContainer.append("g");

var url = "http://enjalot.github.io/wwsd/data/world/world-110m.geojson";
var data_url = "http://enjalot.github.io/wwsd/data/world/ne_50m_populated_places_simple.geojson";

Promise.all([d3.json(url), d3.json(data_url)]).then(function(data) {
      var world = data[0];
      var places = data[1];
      
      svgContainer.append("path")
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
		
		var legend = show_legend(all_styles, styles_colors)

		sliderRange
			.on('onchange', val => {
	      d3.select('p#value-range').text(val.map(d3.format(',d')).join('-'));
	      century = val
	      update_visuals(century, data, show)
	    });

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
    
    // Add text to legend
    legend.append('text')                                
        .attr('x', legendRectSize + legendSpacing)       
        .attr('y', legendRectSize - legendSpacing)       
		.text(function(d) { return d; }); 
		
		return legend
};


function update_legend(data_set, colors, legend){

	// Remove old legend
	legend.remove()
	 
	// Create new legend
	legend = show_legend(data_set, colors)
	
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
    svgContainer.selectAll(".pin")
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

	// show new legend
	
};
