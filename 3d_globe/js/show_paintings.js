function painting_gallery(number_windows, div){
    var newWindow =  d3.select("#statsleft").append("div")
    .attr("class", "window")
    .attr("id", div + number_windows)
    .style("opacity", 0)
    .style("float", "left");
    var x = d3.select("#" + div + number_windows).append("div")
        .attr("class", "x")
        .style("opacity", 0)
        .style("pointer-events","visible");
    windowgrab = d3.select("#" + div + number_windows).append("div")
        .attr("class", "windowgrab")
        .style("pointer-events", "visible");
    var statistics = d3.select("#" + div + number_windows).append("div")
        .attr("class", "statistics")
        .style("opacity", 0)
        .style("pointer-events","visible");
    var slidewindow = d3.select("#" + div + number_windows).append("div") 
        .attr("class", "slidewindow")
        .attr("id", 'slidewindow' + number_windows)
        .style("opacity", 0);

    newWindow.transition()        
        .duration(800)      
        .style("opacity", .9);

    var rightresizer = d3.select("#" + div + number_windows).append("div")
        .attr("windownumber", number_windows)
        .attr("class", "rightresize")
        .style("pointer-events","visible");
    var downresizer = d3.select("#" + div + number_windows).append("div")
        .attr("windownumber", number_windows)
        .attr("class", "downresize")
        .style("pointer-events","visible");


    var moveWindow = d3.drag()
        .on('drag', function(){
            console.log("grab")
            x = d3.event.x;
            y = d3.event.y;
            
            newWindow.style("left", x + "px");
            newWindow.style("top",  y + "px");
        }); 

         newWindow.call(moveWindow);

    var windowResizeRight = d3.drag()
        .on('drag', function(){
            console.log("right")
            x = d3.event.x;
            y = d3.event.y;

            x = Math.max(50, x);
            y = Math.max(50, y);
            
            newWindow.style("width", x + "px");
            newWindow.style("height", y + "px");
        }); 
        
    var windowResizeDown = d3.drag()
        .on('drag', function(){
            console.log("down")
            x = d3.event.x;
            y = d3.event.y;

            x = Math.max(50, x);
            y = Math.max(50, y);
            
            newWindow.style("width", x + "px");
            newWindow.style("height", y + "px");
        });    
    
    rightresizer.call(windowResizeRight);
    downresizer.call(windowResizeDown);

    statistics.transition()
        .duration(200)      
        .style("opacity", 1)
        .style("left", (newWindow.width + 20) + "px")
        .style("top", (newWindow.height - 10) + "px");

    slidewindow.transition()
        .duration(200)      
        .style("opacity", 1)
        .style("left", (newWindow.width + 20) + "px")
        .style("top", (newWindow.height - 10) + "px");



    x.transition()
        .duration(200)
        .style("opacity", 1)
        .style("left", (newWindow.width + 10) + "px")     
        .style("top", 10 + "px");
        
    x.on("click", function(){
        if(div == "window"){
            d3.select("#" + div + number_windows)
            .transition().duration(1000)
            .style("opacity", 0).remove(); 
            slides
                .transition().duration(1000)
                .style("opacity", 0);
            }
        else{
            d3.select("#" + div + number_details_painting)
                .transition().duration(1000)
                .style("opacity", 0)
                .remove();
            d3.select("div.window")
                .style("z-index", 1)
                .transition().duration(1000)
                .style("opacity", 0.9);
        }
        });

    return statistics;
}

// When clicked, new window will open. All divs within this window is defined here
function open_stats_painting(cluster, data, number_windows, div) {
    
    statistics = painting_gallery(number_windows, div);
  
        
    // slidewindow.on("mouseover", svgContainer.on('.zoom', null), console.log("isfjlfesijl"))
    // .on("mouseleave", 
    //     console.log("iijfes"),
    //     zoom = d3.zoom() // Init zoom again
    //         .scaleExtent([1, 8])
    //         .on("zoom", zoomed),
    //     svgContainer.call(zoom)
    // );

    var text = "In this part of the world, there was only " + cluster.id.length  + " rare painting and it has the style: " + cluster.sub + "."
    + "<br /> <br />" + "This painting emerged in the year " + cluster.start_date + "."
    ;
    if(cluster.id.length > 1){
        text = "In this part of the world, there were " + cluster.id.length + " paintings and has the style: " + cluster.sub + "." 
        + "<br /> <br />" + "The first painting emerged in the year " + cluster.start_date + " and the last painting emerged in the year " + cluster.end_date + "."
    }

    statistics.html(text);

    var paintings = retreive_paintings(data, cluster.id);

    // Weird bug of not updating the images the first time
    for(var i = 0; i < 2; i++){
        slides = add_paintings(paintings, "#slidewindow" + number_windows)
    }
    
    slides.on("click", function(painting){
        number_details_painting +=1;
        d3.select("#" + div + number_windows)
            .transition().duration(1000)
            .style("opacity", 0)
            .style("z-index", -1)
        details_painting(painting);
    }); 
    
  }


  function details_painting(painting, div){
    
    statistics = painting_gallery(number_details_painting, "details")
    statistics.html("This painting was made by " + painting.artist_full_name + " in " + painting.date +  " and was named " + "'" + painting.artwork_name + "'" +                    
                    "<p /> <img src= " + painting.image_url + " width= '500px' height = '500px' ></img> ");
    
  }

//=========================================== Painting images START

  // Add the paintings src inside image
  function add_paintings(paintings_list, div){

    var slides = d3.select(div)
        .selectAll("img")
        .data(paintings_list);

    slides.enter()
        .append("img") 
        .attr("class", "slide"); 

    slides.attr("src", function(d){ return d.image_url;})
        .attr("style", "float:left")
        .style("pointer-events","visible");
    
    slides.style("opacity", 0) //start invisible
        .transition().duration(500) //schedule a transition to last 1000ms
        .delay(function(d,i){return i*500;})
        .style("opacity", 1); 

    return slides;
  }


  // Create subset of the paintings (is now 50 percent of total)
 function subset_paintings(cluster, data){
    var paintings_id = []; 
    var subset_amount =  Math.floor(cluster.id.length / 100 * 50) // Take half the ID's
     
    // Transfer all paintings to new array
     for(var i = 0; i < subset_amount; i++){
         paintings_id.push(cluster.id[i]);
     }

     paintings_list = retreive_paintings(data, paintings_id);
    
    return paintings_list;
 } 

 // Filtering paintings to get the correct one
function retreive_paintings(data,paintings_id){
    var paintings_list = [];
    paintings_id.forEach(function(id){
        paintings_list.push(data.filter(function(d){
            return d.omni_id === id;
        })[0]);
    });

    return paintings_list;
}
//=========================================== Painting images END
