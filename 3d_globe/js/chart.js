const chartsvg     = d3.select(".widget").append("svg")
                    .attr("width", 600)
                    .attr("height", 450);
      chartmargin  = {top: 20, right: 20, bottom: 30, left: 50},
      chartwidth   = 600 - chartmargin.left - chartmargin.right,
      chartheight  = 450 - chartmargin.top  - chartmargin.bottom,
      chartx       = d3.scaleBand().rangeRound([0, chartwidth]).padding(0.2),
      charty       = d3.scaleLinear().rangeRound([chartheight, 0]),
      gChart       = chartsvg.append("g")
                   .attr("transform", `translate(${chartmargin.left},${chartmargin.top})`);




function create_chart(){

}

function update_chart(clustereddata, currentdate, colors, show){
  d3.select(".widget").selectAll("g > *").remove() //TODO: Create transition in creating new chart
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

var filteramount = groupstyle.filter(function(d){
  return Number(d.totalpaintings) > 3;
});


  chartx.domain(filteramount.map(function(d){
    return d.style;
  }));
  charty.domain([0, d3.max(filteramount, function(d){
      return d.totalpaintings})]);


  var bars = gChart.selectAll(".bar")
  .data(filteramount, function(d){
    return + d.style;
  });  
  bars.exit();
  bars.enter()
  .append("rect")
  .attr("class", "bar")
  .attr("x", d => chartx(d.style))
  .attr("y", function(d){
    return charty(d.totalpaintings);
  })
  .attr("fill", function(d) {
    console.log(colors[show][d['values'][0]['sub']])
    return colors[show][d['values'][0]['sub']]})
  .attr("width", chartx.bandwidth())
  .attr("height",function(d){  
      return chartheight - charty(d.totalpaintings) 
    })
   


bars.transition()
    .duration(600)
    .ease(d3.easeLinear)
    .attr("y", function(d){
      return charty(d.totalpaintings);
    })
    .attr("fill", function(d) {return colors[show][d['values'][0]['sub']]}) 
    .attr("height",function(d){  
      return chartheight - charty(d.totalpaintings) 
    })
    

  gChart.append("g")
      .attr("transform", "translate(0," + chartheight + ")")
      .call(d3.axisBottom(chartx))
      .append("text")
      .attr("fill", "#000")
      .attr("y", 20)
      .attr("x", 450)
      .attr("dy", "1em")
      .text("Months")

   
  gChart.append("g")
      .attr("class", "axis axis-y")
      .call(d3.axisLeft(charty).ticks(10).tickSize(8))
  
  
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