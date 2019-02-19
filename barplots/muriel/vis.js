

// Reference to http://bl.ocks.org/williaster/10ef968ccfdc71c30ef8

// canvas dims
var width = 900;
var height = 700;
var margin = { top: 200, right: 50, bottom: 70, left: 50 };
var barwidth  = width - margin.left - margin.right;
var barheight = height - margin.top  - margin.bottom;


// preprocess the data by renaming the months and convert into numerical
var months = [" ", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function preprocess(d) {
      var processed = {
        year: +d.year,
        month: months[+d.month],
        day: d.day,
        // assuming this page, it is in 0.1 degress http://projects.knmi.nl/klimatologie/uurgegevens/selectie.cgi
        temperature: +d.temperature/10.0, 
      }
      return processed;
}


d3.csv('meteo.csv', function (err, csv_data) {
	// returns a nested dict {year: {month: average ... } ... }
	var nested = d3.nest()
		.key(function(d) { return d.year; })
		.key(function(d) { return d.month; })
		.rollup(function(values) { return d3.mean(values, function(d) {return d.temperature; }) })
		.map(csv_data.map(preprocess));

	// also fill a dict as {year: max}
	var max_list = {};
	var min_list = {};
	nested.values().forEach(function(element, i) {max_list[nested.keys()[i]] = d3.max(element.values()), 
												  min_list[nested.keys()[i]] = d3.min(element.values())});

	// collect all data needed for the axis scales 
	var years_ = csv_data.map(function(d){return d.year;});
	var years = d3.set(years_).values();
	var current_year = +years[0];
	var first_year = +years[0];
	var last_year = +years[years.length - 1];
	var this_years_data = nested['$'+current_year];

	var draw = function(){

	    var xScale = d3.scaleBand()
	        .rangeRound([0, barwidth])
	        .padding(0.1);

	    var yScale = d3.scaleLinear()
	        .range([0, barheight]);

	     // create canvas
	    var canvas = d3.select("body")
	      .append("svg")
	        .attr("width",  width)
	        .attr("height", height)	   

	    // xaxis is shifted according to margins 
	    var xAxis_ = d3.axisBottom(xScale);
	    var xAxisShift = barheight + margin.top;
	    var xAxis = canvas.append("g")
	        .attr("transform", "translate(" + margin.left + "," + xAxisShift + ")")
	        .call(xAxis_);

	    window.xScale = xScale
	    // yaxis is shifted according to margins 
	    var yAxis_ = d3.axisLeft(yScale);
	    var yAxis = canvas.append("g")
	        .call(yAxis_)
	        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	    xAxis.append("text");
	    yAxis.append("text");

	    // link each temperature to a color
		var color_range = d3.scaleLinear()
						.range(['blue','red'])
	       
	    var update = function(data, year) {
	    	// to handle cases of years with less than 12 months
			months = data.map(function(d) { return d.key; });
		
			// rescale the y axis according to maximum value
			// and minimim, - 1 to give some extra space 
			yScale.domain( [ max_list[year], min_list[year]- 1] );
			yAxis.call(yAxis_)
				.selectAll("text")	
		        .style("text-anchor", "end")
		        .attr("dx", "-.8em")
		        .attr("dy", ".15em")

			// rescale the x axis according to number of month
			xScale.domain( months );
			xAxis.call(xAxis_)
				.selectAll("text")	
		        .style("text-anchor", "end")
		        .attr("dx", "-.8em")
		        .attr("dy", ".15em")
		        .style("font-size", "10px")
		        .attr("transform", "rotate(-65)");

		    color_range.domain([ min_list[year], max_list[year]]);

			// specify the static properties of the text above the bars
			var temperature_text = canvas.selectAll(".temperature_text").data(data);
		    temperature_text.enter()
		    .append("text")
				.attr("class", "temperature_text")
				.attr("text-anchor", "middle")
    			.attr("font-size", "14px")
    			.attr("fill", "black")
			    .attr("x", function(d) { return margin.left+ xScale(d.key) + xScale.bandwidth()/2; })
			    .attr("y", function(d) { return yScale(d.value) + margin.top; })
			    .text(function(d) { return parseFloat(d.value).toFixed(2)});

			// specify the static properties of the bars
			var bars = canvas.selectAll(".bar").data(data);
		    bars.enter()
		    .append("rect")
				.attr("class", "bar")
				.attr("x", function(d) { return xScale(d.key); })
				.attr("width", xScale.bandwidth())
				.attr("y", function(d) { return yScale(d.value); })
				.attr("height", function(d) { return barheight - yScale(d.value); })
				.attr('fill', function(d) {return color_range(d.value);})
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			
			// specify the static properties of the title
			var title = canvas.selectAll(".title_text").data([year]);
			title.enter()
			.append("text")
				.attr("class", "title_text")
    			.attr("font-size", "28px")
    			.attr("fill", "black")
    			.attr("x", width/4)
    			.attr("y", margin.top/2)
    			.text(function(d) { return 'Average monthly temperature in the year ' + d});

    		// remove the DOMS to enable transitions
			temperature_text.exit().remove();
			bars.exit().remove();
			title.exit().remove();
				
			// here specify the properties that change, the speed of the change
			temperature_text.transition().duration(250)
				.attr("x", function(d) { return margin.left+ xScale(d.key) + xScale.bandwidth()/2; })
			    .attr("y", function(d) { return yScale(d.value) + margin.top; })
			    .text(function(d) { return parseFloat(d.value).toFixed(2)});
	        
	        bars.transition().duration(250)
	            .attr("y", function(d) { return yScale(d.value); })
	            .attr("height", function(d) { return barheight - yScale(d.value); })
			
			title.transition().duration(200)
				.text(function(d) { return 'Average monthly temperature in the year ' + d});
	    };

	    // initialize the graph
		// this_years_data = nested['$'+current_year];
	   	update(this_years_data.entries(), current_year)

	    function backInTime() {
	    	if (current_year > first_year){
	    		current_year -= 1;
	    		this_years_data = nested['$'+current_year]
	    		update(this_years_data.entries(), current_year)
	    }}

		function forwardInTime() {
			if (current_year < last_year){
				current_year += 1;
				this_years_data = nested['$'+current_year]
				update(this_years_data.entries(), current_year)
		}}

		// ajax library, I really tried to do it with d3.select(window).on("keydown", function()
		// but it did not work
		Mousetrap.bind('left', function(e, n) { backInTime(); });
		Mousetrap.bind('right', function(e, n) { forwardInTime(); });


	}

	draw()
});





