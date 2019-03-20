function pauseResumeButton(){
    if (moving) {
        moving = false;
        clearInterval(timer);

        // remove pause button
        document.getElementById("play-button").children[0].style.display = "block"       
    } 
    else {        
        if(!is2d){       // && show_migration == false     
            rotation_timer.restart(function(){
                rotateglobe();
            });
        }

        // remove play button
        document.getElementById("play-button").children[0].style.display = "none"

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
                slider.range(vals['begin']+10, vals['end'] + 10)           
            }, SLIDER_SPEED)    
        moving = true;
        }    
    }
    return moving;
}