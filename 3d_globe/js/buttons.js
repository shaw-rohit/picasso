function pauseResumeButton(){
    if (moving) {
        moving = false;
        clearInterval(timer);

        document.getElementById("play-button").children[0].style.display = "block"
        
    } 
    else {
        if(!is2d){
            rotation_timer.restart(function(){
                rotateglobe();
            });
        }
        //d3.select(".play-button").attr("hidden", true);
        document.getElementById("play-button").children[0].style.display = "none"
        //playButton.attr("class", "pause-button");

        // check if it is starting or not
        if (starting){
            timer = setInterval (function() {
                slider.range(parseInt(checkpoints[check_i]), 
                    parseInt(checkpoints[check_i + 1]))
                check_i += 1

                if (check_i == checkpoints.length-1){
                    starting = false
                    clearInterval(timer)
                }
        }, SLIDER_SPEED)  
            moving= true
        }
        else {
            // make sure that the interval is based on the amount of data
            timer = setInterval (function() {
                // get old slider values
                var vals = slider.range()
                console.log(vals)
                slider.range(vals['begin'], vals['end'] + 1)           
            }, SLIDER_SPEED)    
        moving = true;
        }    
    }
    return moving;
}