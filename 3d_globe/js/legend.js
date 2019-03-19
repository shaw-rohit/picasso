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

function nav_bar(data_used, color, show){
    
    subs_present = []
    colors_present = []
    
    data_used.forEach(function(element){
        if (!subs_present.includes(element.sub)){
            subs_present.push(element.sub)
        }
        
        if (!colors_present.includes(color[show][element.sub])){
            colors_present.push(color[show][element.sub])
        }
    })

    
    // Remove any existing legend    
    svgColors.selectAll("#legendbar").remove()
    d3.select("#legend").selectAll("#hover").remove()
    d3.select("#legend").selectAll("#clicked").remove()
    
    // Add tooltips for mouseover
    var div_subs = d3.select("#legend").append("div")
        .attr("class", "tooltip_colors")
        .attr("id", "hover")
        .style("opacity", 0);
    
    // Add tooltips for on click
    var div_subs_click = d3.select("#legend").append("div")
        .attr("id", "clicked")
        .attr("class", "tooltip_colors_click")
        .style("opacity", 0);
    
    // Create a colorscale for the legend, according to what is shown on map
    var colorScale = d3.scaleOrdinal()
        .domain(subs_present)
        .range(colors_present);
    
    // Store which elements in the legend are clicked on
    //selected_subs = [];
    
    // Initiate variable for placing of the individual bars
    var spacing = 0;
    
    var is_clicked = false;
    // Create individual bars
    svgColors.selectAll("rect")
        .data(colorScale.domain())
        .enter()
        .append("rect")
        .attr("id", "legendbar")
        .attr('width', function(d){
            
            // Create spacing according to amount of elements
            spacing = 1764/subs_present.length
            return spacing
        })                    
        .attr('height', 20)
        .attr("x", function(d){
            
            // Assign x coordinate according to amount of elements
            return subs_present.indexOf(d) * spacing
        })
        .attr("y", 30)
        .attr("fill", colorScale )
        // set opacity of selected subs
        .attr("opacity", function(d){            
                if (selected_subs.length<1){
                    return 1
                }
                else if (selected_subs.includes(d)){
                    return 1
                } else {
                    return 0.3
                }                     
        })
        .on("mouseover", function(d){
            
            // Show tooltips with title of each bar
            div_subs.transition()		
                .duration(200)		
                .style("opacity", .9);
            div_subs.html(d)	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            
            // Remove tooltips when not hovering
            div_subs.transition()		
                .duration(500)		
                .style("opacity", 0);	
        })
        .on("click", function(d){

            if (clicked[d] == true){
                clicked[d] = false;
                // Add selected to list of selected elements
                selected_subs.splice(selected_subs.indexOf(d),1);
            }
            else {
                clicked[d] = true;
                selected_subs.push(d)
            }

            // Show selected elements
            svgColors.selectAll("rect").style("opacity", function(d){ 
                if (selected_subs.length<1){
                    return 1
                }               
                else if (selected_subs.includes(d)){
                    return 1
                } else {
                    return 0.3
                }                     
            });

            subs_present.forEach(function(element){
                if (selected_subs.length < 1){
                    
                    identifyer = element
                    identifyer = identifyer.replace(/[^a-zA-Z0-9 \s !?]+/g, '')
                    identifyer = identifyer.replace(/\s/g, '')
                    identifyer = "a" + identifyer
                    
                    gPins.selectAll("#" + identifyer).style("opacity", 0.55)
                }
                else if (!selected_subs.includes(element)){
                    
                    // Get ID for pins
                    identifyer = element
                    identifyer = identifyer.replace(/[^a-zA-Z0-9 \s !?]+/g, '')
                    identifyer = identifyer.replace(/\s/g, '')
                    identifyer = "a" + identifyer
                    
                    // Remove all pins that are not of the selected legend elements
                    gPins.selectAll("#" + identifyer).style("opacity", 0)
                        .on("mouseover", function(element){
                            
                            // Hide tooltips
                            element.selectAll(".tooltip").style("opacity", 0)
                        })
                } else {                    
                    // Show pings of later-on selected elements of the legend
                    identifyer = element
                    identifyer = identifyer.replace(/[^a-zA-Z0-9 \s !?]+/g, '');
                    identifyer = identifyer.replace(/\s/g, '');
                    identifyer = "a" + identifyer
                    gPins.selectAll("#" + identifyer).style("opacity", 0.55)
                    
                }
            })
            
            // Show tooltip, keep showing
            div_subs_click.transition()		
                .duration(200)		
                .style("opacity", .9);
            div_subs_click.html(d)	
                .style("left", (d3.event.pageX) + "px")		
                .style("top", (d3.event.pageY - 28) + "px");
                
            // Remove mouseover tooltip when clicked on
            div_subs.transition()		
                .duration(20)		
                .style("opacity", 0);	
            
            })

    return selected_subs
}
