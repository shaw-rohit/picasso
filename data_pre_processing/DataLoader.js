
var width = 1500;
var height = 750;

var century = 0;

var svgContainer = d3.select("body").append("svg")
										.attr("height", height)
										.attr("width", width);

  // Simple
var sample = [0, 0.005, 0.01, 0.015, 0.02, 0.025];
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

		for (var i = 0; i < all_styles.length; i++){
			color['style'][all_styles[i]] = d3.interpolateWarm(i/all_styles.length)
		}

		for (var i = 0; i < all_schools.length; i++){
			color['school'][all_schools[i]] = d3.interpolateViridis(i/all_schools.length)
		}

		for (var i = 0; i < all_media.length; i++){
			color['media'][all_media[i]] = d3.interpolateViridis(i/all_media.length)
		}

		// initialize things to show
		var show = 'style'
		var century = [0,1]

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
		});

		d3.select("#school")
		.on("click", function(d){
			show = 'school'
			update_visuals(century,data,show)
		});

		d3.select("#media")
		.on("click", function(d){
			show = 'media'
			update_visuals(century,data,show)
		});
});

function update_visuals(century, data, show){

	// extract the centuries to show
	var high_century = Math.round(Math.max.apply(null, century))
	var low_century = Math.round(Math.min.apply(null, century))

	// convert coordinates, take max and set that to 0-1500 for longitude
	// and 0-750 for latitude
	//dbp_lat, dbp_long

	svgContainer.selectAll("circle")
	.remove();

	// load style part of data
	data.forEach(function(d){
		// works except for the fact that 1700 will be 17th century
		// use year and slider to determine which datapoints have to be plotted
		if ((Math.ceil((d['date']+1) /100)) < high_century && (Math.ceil((d['date']+1) /100)) > low_century){

			// convert lng and lat to coordinates
			if (d["dbp_long"] != "N\\A"){
				svgContainer.append("circle")
					.attr("cx", (Math.abs(d["dbp_long"])+10)*5)
					.attr("cy", (Math.abs(d["dbp_lat"])+10)*5)
					.attr("r",3)
					.attr("fill", color[show][d[show]])					
			}
		}

	});
};
