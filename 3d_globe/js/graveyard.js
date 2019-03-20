// TRY TO LEAVE POINTS ON THE GLOBE
    /*
    // get all id's
    var circle_id = []
    var to_remove = []
    var circles = svgContainer.selectAll("circle")

    var circs = circles['_groups'][0]
    console.log(circs)

    // remove id's that do not appear in svg
    for (var i = 0; i < circs.length; i++) {
      var item = circs[i].id;
      circle_id.push(item);
    }
  
    var example = svgContainer.selectAll("circle")
                        .filter(function(d) {                            
                            if (!contains.call(circle_id, d.id)){   
                                to_remove.push(d.id)
                                return d
                            }                                
                        })                        
                        .remove();
    
    // also remove this datapoints from clustered data but how?
    console.log('before')
    console.log(clustered_data.length)

    for(var i = 0; i < clustered_data.length; i++){
        if (!contains.call(circle_id, clustered_data[i]['id'].join())){clustered_data.splice(i, 1)};
    }
    console.log('after')
    console.log(clustered_data.length)
    */

    // TIME SPEED UP BELOW
    /*
    if(moving){
        // if nothing happens speed up time
        if (clustered_data.length === 0){ 
            idle_count+=1
            clearInterval(timer)
            timer = setInterval (function() {
                var vals = slider.range()
                slider.range(vals['begin'], vals['end'] + 1) 
            }, SLIDER_SPEED/(idle_count*5)) // go faster
        } else {
        // else go to initial time
            clearInterval(timer)
            idle_count = 0
            timer = setInterval (function() {
                var vals = slider.range()
                slider.range(vals['begin'], vals['end'] + 1) 
            }, SLIDER_SPEED) }
    }
    */