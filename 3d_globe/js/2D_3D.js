function update(switch_to, center, translation) {
    
  svgContainer.selectAll("#world").transition()
      .duration(1000).ease(d3.easeLinear)
      .attrTween("d", projectionTween(projection, projection = switch_to, center, translation))
}

function projectionTween(projection0, projection1, center, translation) {
    
  return function(d) {
    var t = 0;
    if (translation){
        var projection = d3.geoProjection(project)
            .scale(1)
            .translate([width/2, height/4])
            .center(center)
    } else {
        var projection = d3.geoProjection(project)
            .scale(1)
            .center(center)
    }
    
    var path = d3.geoPath(projection);
    
    function project(lambda, phi) {
      lambda *= 180 / Math.PI, phi *= 180 / Math.PI;
      var p0 = projection0([lambda, phi]), p1 = projection1([lambda, phi]);
      return [(1 - t) * p0[0] + t * p1[0], (1 - t) * -p0[1] + t * -p1[1]];
    }
    
    return function(_) {
        
      t = _;
      return path(world);
    };
    
  };
}