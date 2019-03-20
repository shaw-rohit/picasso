function draw_migration_flow(migration_data, oldest){
    /*
     * INPUT:
     * migration_data -- all other artworks with same show and subcategory as oldest
     * oldest -- oldest artwork with specified show and subcategory
    */
    
    // Stop rotation
    rotation_timer.stop()
    
    // Remove existing arrows
    gArrows.selectAll("#arrow").remove()
    
    // Create new arrows
    /*
    gArrows.append("path")
        .data(migration_data)
        .attr("class", "path")
        .attr("d", path);
    */
        
    var arrows = gArrows.selectAll('path.datamaps-arc').data(migration_data)
    
    arrows.enter()
        .append('path')
        .attr('class','arc')
        .attr("id", "arrow")
        .attr('d', function(d) {
            
            var origin = projection([oldest.long, oldest.lat])
            var dest = projection([d.long, d.lat])
            
            
            var mid = [ (origin[0] + dest[0]) / 2, (origin[1] + dest[1]) / 2];
            
            //define handle points for Bezier curves. Higher values for curveoffset will generate more pronounced curves.
            var curveoffset = 20,
                midcurve = [mid[0]+curveoffset, mid[1]-curveoffset]
    
            // the scalar variable is used to scale the curve's derivative into a unit vector 
            scalar = Math.sqrt(Math.pow(dest[0],2) - 2*dest[0]*midcurve[0]+Math.pow(midcurve[0],2)+Math.pow(dest[1],2)-2*dest[1]*midcurve[1]+Math.pow(midcurve[1],2));
        
            // define the arrowpoint: the destination, minus a scaled tangent vector, minus an orthogonal vector scaled to the datum.trade variable
            arrowpoint = [ 
                dest[0] - ( 0.5*(dest[0]-midcurve[0]) - (dest[1]-midcurve[1]) ) / scalar , 
                dest[1] - ( 0.5*(dest[1]-midcurve[1]) - (-dest[0]+midcurve[0]) ) / scalar
                //dest[1] - ( 0.5*datum.trade*(dest[1]-midcurve[1]) - datum.trade*(-dest[0]+midcurve[0]) ) / scalar
            ];

            // move cursor to origin
            return "M" + origin[0] + ',' + origin[1] 
            // smooth curve to offset midpoint
                + "S" + midcurve[0] + "," + midcurve[1]
            //smooth curve to destination   
                + "," + dest[0] + "," + dest[1]
            //straight line to arrowhead point
                + "L" + arrowpoint[0] + "," + arrowpoint[1] 
            // straight line towards original curve along scaled orthogonal vector (creates notched arrow head)
                + "l" + (0.3*(-dest[1]+midcurve[1])/scalar) + "," + (0.3*(dest[0]-midcurve[0])/scalar)
                //+ "l" + (0.3*datum.trade*(-dest[1]+midcurve[1])/scalar) + "," + (0.3*datum.trade*(dest[0]-midcurve[0])/scalar)
                // smooth curve to midpoint 
                + "S" + (midcurve[0]) + "," + (midcurve[1]) 
                //smooth curve to origin    
                + "," + origin[0] + "," + origin[1]
            
        })
    //arrows.attr("fill", String(color[show][oldest[show]]))
    arrows.exit()
        .transition()
        .style('opacity', 0)
        .remove();
    
};

function retrieve_migration(dataset, show, sub){
    
    /*
     * INPUT: 
     * dataset -- complete dataset
     * show -- either style, school or media
     * sub -- which category of show to choose for migration data
     * 
     * OUTPUT: 
     * oldest -- oldest artwork for specified show and sub
     * all_others -- all other artworks for the specified show and sub
    */
    
    // Store oldest artwork
    var oldest = {}
    minimal = 3000
    
    // Retrieve oldest artwork 
    dataset.forEach(function(d){
        if (d[show] == sub && d.date < minimal){
            minimal = d.date
            oldest = d
        }
    })
    
    // Retrieve all other artworks with similar style, school or media
    all_others = []
    dataset.forEach(function(d){
            if (d[show] == sub && d.artwork_name != oldest.artwork_name){
                all_others.push(d)
            }
        });
    
    return [oldest, all_others]
    
};

function retrieve_migration_cluster(dataset, sub){
    
    /*
     * INPUT: 
     * dataset -- complete dataset
     * show -- either style, school or media
     * sub -- which category of show to choose for migration data
     * 
     * OUTPUT: 
     * oldest -- oldest artwork for specified show and sub
     * all_others -- all other artworks for the specified show and sub
    */
    
    // Store oldest cluster
    var oldest = {}
    minimal = 3000
    
    // Retrieve oldest artwork 
    dataset.forEach(function(d){
        if (d.sub == sub && parseInt(d.start_date) < minimal){
            minimal = parseInt(d.start_date)
            oldest = d
        }
    })
    
    
    
    // Retrieve all other artworks with similar style, school or media
    all_others = []
    dataset.forEach(function(d){
            if (d.sub == sub && d.id != oldest.id){
                all_others.push(d)
            }
        });
    
    return [oldest, all_others]
    
};

function draw_cluster_flow(migration_data, oldest, color){
    /*
     * INPUT:
     * migration_data -- all other artworks with same show and subcategory as oldest
     * oldest -- oldest artwork with specified show and subcategory
    */
    
    // Stop rotation
    //rotation_timer.stop()
    
    // Remove existing arrows
    //gArrows.selectAll("#arrow").remove()
    
    // Create new arrows
    var arrows = gArrows.selectAll('path.datamaps-arc').data(migration_data)
    
    arrows.enter()
        .append('path')
        .attr('class','arc')
        .attr("id", "arrow")
        .attr('d', function(d) {
            
            var origin = projection([oldest.long, oldest.lat])
            d['origin'] = [oldest.long, oldest.lat]
            var dest = projection([d.long, d.lat])
            
            
            var mid = [ (origin[0] + dest[0]) / 2, (origin[1] + dest[1]) / 2];
            
            //define handle points for Bezier curves. Higher values for curveoffset will generate more pronounced curves.
            var curveoffset = 20,
                midcurve = [mid[0]+curveoffset, mid[1]-curveoffset]
    
            // the scalar variable is used to scale the curve's derivative into a unit vector 
            scalar = Math.sqrt(Math.pow(dest[0],2) - 2*dest[0]*midcurve[0]+Math.pow(midcurve[0],2)+Math.pow(dest[1],2)-2*dest[1]*midcurve[1]+Math.pow(midcurve[1],2));
        
            // define the arrowpoint: the destination, minus a scaled tangent vector, minus an orthogonal vector scaled to the datum.trade variable
            arrowpoint = [ 
                dest[0] - ( 0.5*(dest[0]-midcurve[0]) - (dest[1]-midcurve[1]) ) / scalar , 
                dest[1] - ( 0.5*(dest[1]-midcurve[1]) - (-dest[0]+midcurve[0]) ) / scalar
                //dest[1] - ( 0.5*datum.trade*(dest[1]-midcurve[1]) - datum.trade*(-dest[0]+midcurve[0]) ) / scalar
            ];

            // move cursor to origin
            return "M" + origin[0] + ',' + origin[1] 
            // smooth curve to offset midpoint
                + "S" + midcurve[0] + "," + midcurve[1]
            //smooth curve to destination   
                + "," + dest[0] + "," + dest[1]
            //straight line to arrowhead point
                + "L" + arrowpoint[0] + "," + arrowpoint[1] 
            // straight line towards original curve along scaled orthogonal vector (creates notched arrow head)
                + "l" + (0.3*(-dest[1]+midcurve[1])/scalar) + "," + (0.3*(dest[0]-midcurve[0])/scalar)
                //+ "l" + (0.3*datum.trade*(-dest[1]+midcurve[1])/scalar) + "," + (0.3*datum.trade*(dest[0]-midcurve[0])/scalar)
                // smooth curve to midpoint 
                + "S" + (midcurve[0]) + "," + (midcurve[1]) 
                //smooth curve to origin    
                + "," + origin[0] + "," + origin[1]
            
        })
        .attr("stroke", 1)
        .attr("fill", color)
        
    arrows.exit()
        .transition()
        .style('opacity', 0)
        .remove();
    
};

