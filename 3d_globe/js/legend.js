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