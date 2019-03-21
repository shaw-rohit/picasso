
var origin_binner = d3.scaleQuantize()
        .domain([100,2025])
        .range(d3.range(100, 2025, 1));
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
            if ((d['date'] >= year[0] &&
                (d['date']) <= year[1])){
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

    //retrieve all styles shown right now
    var current_styles_set = new Set()
    clustered_data.forEach(function(d){
        current_styles_set.add(d.sub)
    })

    var current_styles = [];
    current_styles_set.forEach(v => current_styles.push(v));

    if (show_migration == true){
        // remove all previous arrows
        gArrows.selectAll("#arrow").remove()
        //var migration = retrieve_migration(filtered_data, show, 'baroque')
        selected_subs.forEach(function(element){
            //console.log(element)
            var migration = retrieve_migration_cluster(clustered_data, element)
            if(migration.length>0){
            draw_cluster_flow(migration[1], migration[0], color[show][element])
            oldest = migration[0]}
        })

        // show all migrations if nothin is selected
        if (selected_subs.length<1){
            current_styles.forEach(function(element){
            var migration = retrieve_migration_cluster(clustered_data, element)
            if(migration.length>0){
            draw_cluster_flow(migration[1], migration[0], color[show][element])
            oldest = migration[0]}})
        }
        
        //draw_migration_flow(migration[1], migration[0])
    }

    svgContainer.selectAll("circle").transition().duration(200) // Will remove all previous circles when update is initiated
        .style("opacity", .1)
        .attr("r", 0)
        .remove();

    // get all active clusters that contain a birth and plot them as stars
    if (show === 'style'){current_births = styles_data.map(function(d){ return clustered_data.filter(function(v){return (d.sub===v.sub && +v.start_date===d.first)}) })}
    else if (show === 'media'){current_births = media_data.map(function(d){ return clustered_data.filter(function(v){return (d.sub===v.sub && +v.start_date===d.first)}) })}

    current_births = current_births.filter(function(d){return d.length>0 })
    window.current_births = current_births
    window.clustered_data = clustered_data
    
    //console.log(current_births)


    gPins.selectAll('.birthstarz').remove();
    
    var starsup = gPins.selectAll('.birth_star').data(current_births);
    var starsdown = gPins.selectAll('.birth_star').data(current_births);
    starsup.enter().append('rect','.birth_star')
        .attr('class','birthstarz')
        .attr("id", function(d){
            
            cur_birth = d[0]['sub'];
            cur_birth = cur_birth.replace(/[^a-zA-Z0-9 \s !?]+/g, '')
            cur_birth = cur_birth.replace(/\s/g, '')
            cur_birth = "birthstars" + cur_birth
            
            return cur_birth
        } )
        .attr("stroke", function(d) {
            if (selected_subs.length < 1){
                var circle = [parseInt(d[0]["long"]),
                parseInt(d[0]["lat"])];
                var rotate = projection.rotate(); // antipode of actual rotational center.
                var center = [-rotate[0], -rotate[1]]
                var distance = d3.geoDistance(circle,center);
                return distance > Math.PI/2 ? 'none' : color[show][d[0].sub];    
            }
            else if (selected_subs.includes(d[0].sub)){
                var circle = [parseInt(d[0]["long"]),
                parseInt(d[0]["lat"])];
                var rotate = projection.rotate(); // antipode of actual rotational center.
                var center = [-rotate[0], -rotate[1]]
                var distance = d3.geoDistance(circle,center);
                return distance > Math.PI/2 ? 'none' : color[show][d[0].sub];
            }
            else {
                return 'none'
            }            
        })
        .attr('stroke-width', function(d) {
            if (selected_subs.length < 1){
                return 2
            }
            else if (selected_subs.includes(d[0].sub)){
                return 2
            }
            else {
                return 0
            }
        })
        .style('fill', 'none')
        .attr('width', function(d) {return 15*(Math.log(d[0]['id'].length+1)+1);})  
        .attr('height', function(d) {return 15*(Math.log(d[0]['id'].length+1)+1);})  
    //     .attr("d", d3.symbol().type(d3.symbolStar))
    //     .attr('size', 100);
        // // set starting coordinates based on projection location
        .attr("transform", function(d) {
        var proj = projection([
            parseInt(d[0]["long"] ),
            parseInt(d[0]["lat"])])
        return "translate(" + [proj[0] - 14*(Math.log(d[0]['id'].length)+1), proj[1]- 14*(Math.log(d[0]['id'].length)+1)]
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
            if (selected_subs.length < 1 || selected_subs.includes(cluster['sub'])){
                tooltip.transition()        
                .duration(200)
                .attr("id", function(){
                    subs = cluster.sub
                    subs = subs.replace(/[^a-zA-Z0-9 \s !?]+/g, '')
                    subs = subs.replace(/\s/g, '')
                    subs = "tt" + subs
                    
                    console.log(subs)
                    
                    return subs
                })
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
            }

        })
        .on("mouseout", function(d) {
            if (selected_subs.length < 1){
                tooltip.transition()        
                .duration(500)      
                .style("opacity", 0)
                .style("z-index", -1);
            }
            else if (selected_subs.includes(d['sub'])){
                tooltip.transition()        
                .duration(500)      
                .style("opacity", 0)
                .style("z-index", -1);
            }           
        })
        .on("click", function(cluster){
            if (selected_subs.length < 1 || selected_subs.includes(cluster['sub'])){
                open_stats_painting(cluster, data, number_windows, "window");
                number_windows += 1;
            }
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

    star_xScale.domain( [0, 2019])

    var turf = []
    // stars plot
    var stars = gstar.selectAll('.rectie').data(meta_data);
    stars.enter()
        .append('rect', ".rectoe")
        .attr('class','rectie')
        .attr('stroke-width',2)
        .attr("id", "rectie")
        .style('fill', 'none')
        .attr('width', 10)
        .attr('height',10)
        .attr('stroke', function(d) { 
            turf.push(origin_binner(d.first));
            return colors[show][d.sub]})
        .attr('transform', function(d) {
            var turfs = turf.filter(function(v){return origin_binner(d.first)===origin_binner(v)});
            return 'translate(' + star_xScale(origin_binner(d.first))  + ', ' + turfs.length*10 + ')';
        })

    window.turf = turf



    stars.exit().remove();
    stars.transition().duration(250)
        .attr('stroke', function(d) { 
            turf.push(origin_binner(d.first));
            return colors[show][d.sub]})
        .attr('transform', function(d) {
            var turfs = turf.filter(function(v){return origin_binner(d.first)===origin_binner(v)});
            return 'translate(' + star_xScale(origin_binner(d.first))  + ', ' + turfs.length*10 + ')';
        })
    
    // bar plot
    var bars = gstar.selectAll(".recto").data(data);
    bars.enter()
        .append('rect', '.rectosourus')
        .attr('class','recto')
        .attr("id", "recto")
        .attr('fill', 'white')        
        .attr('x', function (d) { return star_xScale(year_binner(d.year)) ; })
        .attr("width", 5.0)
        .attr("y", function(d) { return 110-star_yScale(d.data.length); })
        .attr("height", function(d) { return star_yScale(d.data.length); }); // find barheight
    
    bars.exit().remove();
    bars.transition().duration(250)
        .attr("y", function(d) { return 110-star_yScale(d.data.length); })
        .attr("height", function(d) { return star_yScale(d.data.length); });

    
    // gstar.selectAll("line").remove()
    var lines = gstar.selectAll("line").data(years);
    lines.enter()
        .append('line')
        .attr("x1", function(d){return star_xScale(d)})
        .attr("x2", function(d){return star_xScale(d)})
        .attr("y1", 220)
        .attr("y2", 20)
        .attr("stroke", "yellow")
        .attr('stroke-width', 2);


    lines.exit().remove();
    lines.transition().duration(250)
        .attr("x1", function(d){return star_xScale(d)})
        .attr("x2", function(d){return star_xScale(d)});

    var barchartheight  = 250 - chartmargin.top  - chartmargin.bottom
    console.log(chartheight)
    gstar.selectAll('#xaxis').remove()
    gstar.append("g")
      .attr("id", "xaxis")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + barchartheight + ")")
      .call(d3.axisBottom(star_xScale))



                  
};
