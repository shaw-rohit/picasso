const chartsvg     = d3.select(".widget").append("svg")
                    .attr("width", 600)
                    .attr("height", 580);
      chartmargin  = {top: 100, right: 20, bottom: 30, left: 50},
      chartwidth   = 600 - chartmargin.left - chartmargin.right,
      chartheight  = 450 - chartmargin.top  - chartmargin.bottom,
      chartx       = d3.scaleBand().rangeRound([0, chartwidth]).padding(0.2),
      charty       = d3.scaleLinear().rangeRound([chartheight, 0]),
      gChart       = chartsvg.append("g")
                   .attr("transform", `translate(${chartmargin.left},${chartmargin.top})`);

mouseover_time = 1
var mouse_timer = 0

function make_pings(data, sub){


  gPins.selectAll("#pingie").remove();
  var pings = gPins.selectAll(".ping").data(data);
  
  pings.enter().append("circle", ".ping")
    .attr('class','ping')
    .attr("id", "pingie")

    // set starting coordinates based on projection location
    .attr("cx", function(d) {
        var circle = projection([parseInt(d["long"]),
        parseInt(d["lat"])]);
        var rotate = projection.rotate(); // antipode of actual rotational center.
        var center = projection([-rotate[0], -rotate[1]])
        // var distance = d3.geoDistance(circle,center);

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
        // var distance = d3.geoDistance(circle,center);

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

    .attr("stroke", function(d) {
      if (selected_subs.length < 1){
        var circle = [parseInt(d.long), parseInt(d.lat)];
        var rotate = projection.rotate(); // antipode of actual rotational center.
        var center = [-rotate[0], -rotate[1]]
        var distance = d3.geoDistance(circle,center);
        return distance > Math.PI/2 ? 'none' : color[show][sub];}

      else if (selected_subs.includes(d.sub)){
        var circle = [parseInt(d.long), parseInt(d.lat)];
        var rotate = projection.rotate(); // antipode of actual rotational center.
        var center = [-rotate[0], -rotate[1]]
        var distance = d3.geoDistance(circle,center);
        return distance > Math.PI/2 ? 'none' : color[show][sub];
      }
      else {
        return 'none'
      }
    }).attr('stroke-width', 3)
    .attr("r", function(d) { return (10/mouseover_time)*(Math.log(d.id.length+1)+1)})
    .style("fill", "none")
    .style('stroke-opacity', 0.8) // this does not work somehow
    .attr("transform", function(d) {
      var proj = projection([
            parseInt(d["long"]),
            parseInt(d["lat"])])
        return "translate(" + [proj[0] - d["width"], proj[1] - d["height"]]
         + ")";
    });
    mouseover_time+=1
    if (mouseover_time===5){mouseover_time=1}
    // pings.exit().remove();
    pings.transition().duration(50)
      .attr("r", function(d) { return (10/(mouseover_time+1))*(Math.log(d.id.length+1)+1)})
          
}
  
          
function update_chart(clustereddata, currentdate, colors, show){
  console.log('chart style')
  console.log(show)
  d3.select(".widget").select("g").selectAll("g > *").transition().duration(0).remove() //TODO: Create transition in creating new chart
  d3.selectAll(".charttooltip").transition().duration(0).remove();
  var charttooltip = d3.select("#statsright").select(".widget").append("div").attr("class", "charttooltip");
  //var rainbow = d3.scaleSequential(d3.interpolateRainbow).domain([0,d3.sum(data, d => 1)]);

var groupstyle = d3.nest()
  .key(function(d) { return d.sub; })
  .entries(clustereddata);

groupstyle.forEach(function(d) {
  var totalpaintings = 0;
  d.style = d.key;
  for(var i = 0; i < d.values.length; i++){
    totalpaintings += d.values[i].id.length;
  }
  d.totalpaintings = totalpaintings;
});

var filteramount = groupstyle.sort(function(a, b) {
  return d3.descending(a.totalpaintings,  b.totalpaintings);
}).slice(0, 8);

chartx.domain(filteramount.map(function(d){
  return d.style;
}));

charty.domain([0, d3.max(filteramount, function(d){
  return d.totalpaintings})]);

gChart.append("g")
  .attr("class", "axis axis-y")
  .attr("id", "yaxis")
  .call(d3.axisLeft(charty).ticks(10).tickSize(8))

gChart.append("g")
  .attr("id", "xaxis")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + chartheight + ")")
  .call(d3.axisBottom(chartx))
  .selectAll("text")
  .style("text-anchor", "end")
  .attr("dx", "-.8em")
  .attr("dy", ".15em")
  .attr("transform", "rotate(-30)")


var bars = gChart.selectAll(".bar")
  .data(filteramount)
  .attr("class", "bar")
  .attr("x", function(d){
    console.log("The bars: " + d.style) 
    return chartx(d.style)
  })
  .attr("width", chartx.bandwidth())
bars.exit().remove();
bars.enter()
  .append("rect")
  .attr("class", "bar")
  .attr("x", function(d){
    console.log("The bars: " + d.style) 
    return chartx(d.style)
  })
  .attr("y", function(d){
return charty(d.totalpaintings);
})
.attr("fill", function(d) {
  return colors[show][d['values'][0]['sub']]})
.attr("width", chartx.bandwidth())
.attr("height",function(d){  
  return chartheight - charty(d.totalpaintings) 
})
.on("mouseover", function(d){
  console.log('show right before making the pings')
  console.log(show)
  make_pings(d.values, colors[show][d.key]);
  mouse_timer = setInterval (function() {
      make_pings(d.values, d.key)}, 100);
  charttooltip.transition()		
  .duration(200)		
  .style("opacity", 1)

  charttooltip
  .style("left", (d3.event.pageX) + "px")		
  .style("top", (d3.event.pageY - 28) + "px")
  .html("Style: " + (d.style) + "<br>" + "Total amount: " + (d.totalpaintings));
})
.on("mouseout", function(d){
    clearTimeout(mouse_timer)
    mouseover_time = 1
    gPins.selectAll("#pingie").remove()
    // window.d = d
    charttooltip
      .transition().duration(500)
      .style("opacity", 0);
  })


bars.transition()
  .duration(200)
  .ease(d3.easeLinear)
  .attr("y", function(d){
    return charty(d.totalpaintings);
  })
  .attr("fill", function(d) {return colors[show][d['values'][0]['sub']]}) 
  .attr("height",function(d){  
    return chartheight - charty(d.totalpaintings) 
  })
  
  // gChart.selectAll(".bar")
  //   .data(filteramount)
  //   .enter().append("rect")
  //     .attr("class", "bar")
  //     .attr("x", d => chartx(d.style))
  //     .attr("y", function(d){
  //       return charty(d.totalpaintings);
  //     })
  //     .attr("width", chartx.bandwidth())
  //     .attr("height",function(d){  
  //         return chartheight - charty(d.totalpaintings) 
  //       })
        
  
}