

function update_visuals(year, data, show, projection){

    // extract the centuries to show
    var filtered_data = [];
    // var opacity;

    // convert coordinates, take max and set that to 0-1500 for longitude
    // and 0-750 for latitude
    //dbp_lat, dbp_long
    
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
   
    clustered_data = cluster_data(filtered_data, show);
    if (show_migration == true){
        //var migration = retrieve_migration(filtered_data, show, 'baroque')
        selected_subs.forEach(function(element){
            console.log(element)
            var migration = retrieve_migration_cluster(clustered_data, element)
            draw_cluster_flow(migration[1], migration[0], color[show][element])
            oldest = migration[0]
        })
        
        //draw_migration_flow(migration[1], migration[0])
    }

    svgContainer.selectAll("circle").transition().duration(200) // Will remove all previous circles when update is initiated
        .style("opacity", .1)
        .attr("r", 0)
        .remove();

    // get all active clusters that contain a birth and plot them as stars
    current_births = styles_data.map(function(d){ return clustered_data.filter(function(v){return (d.sub===v.sub && year_binner(v.start_date)===year_binner(d.first))}) })
    current_births = current_births.filter(function(d){return d.length>0 })
    window.hoi = current_births
    window.color = color


    gPins.selectAll('#birth_stars').remove();
    
    var starsup = gPins.selectAll('.birth_star').data(current_births);
    var starsdown = gPins.selectAll('.birth_star').data(current_births);
    starsup.enter().append('rect','.birth_star')
        .attr('class','birth_starz')
        .attr("id", "birth_stars")
        .attr('stroke', function(d) { return color[show][d[0].sub]})
        .attr('stroke-width', 2)
        .attr('width', function(d) {return 15*(Math.log(d[0]['id'].length)+1);})  
        .attr('height', function(d) {return 15*(Math.log(d[0]['id'].length)+1);})  
    //     .attr("d", d3.symbol().type(d3.symbolStar))
    //     .attr('size', 100);
        // // set starting coordinates based on projection location
        .attr("transform", function(d) {
        var proj = projection([
            parseInt(d[0]["long"] ),
            parseInt(d[0]["lat"])])
        return "translate(" + [proj[0] - 8*(Math.log(d[0]['id'].length)+1), proj[1]- 8*(Math.log(d[0]['id'].length)+1)]
         + ")";
        });

    // starsdown.enter().append('rect','.birth_star')
    //     .attr('class','birth_starz')
    //     .attr("id", "birth_stars")
    //     .attr('stroke', function(d) { return color[show][d[0].sub]})
    //     .attr('stroke-width', 2)
    //     .attr('width', 50) 
    //     .attr('height', 50)
    //     .style("fill", "none")
    //     // .rotate(-45)
    // //     .attr("d", d3.symbol().type(d3.symbolStar))
    // //     .attr('size', 100);
    //     // // set starting coordinates based on projection location
    //     .attr("transform", function(d) {
    //     var proj = projection([
    //         parseInt(d[0]["long"]),
    //         parseInt(d[0]["lat"])])
    //     return "translate(" + [proj[0], proj[1]]
    //      + ")rotate(-10)";
    //     });
        
    

    // TODO? REMOVE STYLE FROM SUBSET IF NO LONGER WITHIN TIMELINE

    
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
            return distance > Math.PI/2 ? 'none' : color[show][d['sub']];
        })
      .transition()
      .attr("id", function(d) {
          str = d['sub']
          str = str.replace(/[^a-zA-Z0-9\s!?]+/g, '')
          str = str.replace(/\s/g, '')
          str = "a" + str
          return str
          
    })
      .attr("r", function(d) {return 3*(Math.log(d['id'].length)+1);})   
      .style("opacity", function(d){
        
        if (selected_subs.length < 1){
            return 0.55
        }
        else if (!selected_subs.includes(d['sub'])){
            return 0;
        }
        else{ return 0.55}
      })
      .duration(400)
      .attr("transform", function(d) {
        var proj = projection([
            parseInt(d["long"]),
            parseInt(d["lat"])])
        return "translate(" + [proj[0] - d["width"], proj[1] - d["height"]]
         + ")";
        });

    // subs_present.forEach(function(element){
    //     if (!selected_subs.includes(element)){

    //         identifyer = element
    //         identifyer = identifyer.replace(/[^a-zA-Z0-9 \s !?]+/g, '');
    //         identifyer = identifyer.replace(/\s/g, '');
    //         gPins.selectAll("#" + identifyer).style("opacity", 0)
    //             .on("mouseover", function(element){
    //                 element.selectAll(".tooltip").style("opacity", 0)
    //             })
    //     } else {
            
    //         identifyer = element
    //         identifyer = identifyer.replace(/[^a-zA-Z0-9 \s !?]+/g, '');
    //         identifyer = identifyer.replace(/\s/g, '');
    //         gPins.selectAll("#" + identifyer).style("opacity", 0.55)
    //     }
    // })
          
    return clustered_data;
};

function update_slider_plot(data, meta_data, colors, show, years){
    /*  

    data: {year: year, data: [all sub classes in this years]}

    meta_data: {sub: subclass, first: year of 'birth'}


    */

    // adjust scale to highest amount of paintings 
    star_yScale.domain(  [0,
                    d3.max(data, d => d.data.length)] );

    // stars plot
    var stars = gstar.selectAll('path').data(meta_data);

    stars.enter()
        .append('path')
        .attr('fill', function(d) { return colors[show][d.sub]})
        .attr('stroke', function(d) { return colors[show][d.sub]})
        .attr('transform', function(d) {
            return 'translate(' + star_xScale(year_binner(d.first))  + ', 0)';
        })
        .attr("d", d3.symbol().type(d3.symbolStar))
        .attr('size', 80)

  //       d3.symbol().type(d3.symbolStar)
  // .size(80);
        // .attr('d', star);

    stars.exit().remove();
    stars.transition().duration(250)
        .attr('fill', function(d) { return colors[show][d.sub]})
        .attr('stroke', function(d) { return colors[show][d.sub]})
        .attr('transform', function(d) {
            return 'translate(' + star_xScale(year_binner(d.first))  + ', 0)';
        })
    
    // bar plot
    var bars = gstar.selectAll("rect").data(data);
    bars.enter()
        .append('rect')
        .attr('fill', 'white')
        .attr('x', function (d) { return star_xScale(year_binner(d.year)) ; })
        .attr("width", 5.0)
        .attr("y", function(d) { return 140-star_yScale(d.data.length); })
        .attr("height", function(d) { return star_yScale(d.data.length); }); // find barheight
    
    bars.exit().remove();
    bars.transition().duration(250)
        .attr("y", function(d) { return 140-star_yScale(d.data.length); })
        .attr("height", function(d) { return star_yScale(d.data.length); });

    // gstar.selectAll("line").remove()
    var lines = gstar.selectAll("line").data(years);
    lines.enter()
        .append('line')
        .attr("x1", function(d){return star_xScale(d)})
        .attr("x2", function(d){return star_xScale(d)})
        .attr("y1", 260)
        .attr("y2", 20)
        .attr("stroke", "yellow")
        .attr('stroke-width', 2);


    lines.exit().remove();
    lines.transition().duration(250)
        .attr("x1", function(d){return star_xScale(d)})
        .attr("x2", function(d){return star_xScale(d)});


                  
};
