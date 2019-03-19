var knob = $('.knob');
var angle = 0;
var minangle = 0;
var maxangle = 270;

function moveKnob(direction) {

  if(direction == 'up') {
    if((angle + 2) <= maxangle) {
      angle = angle + 2;
      setAngle();
    }
  }

  else if(direction == 'down') {
    if((angle - 2) >= minangle) {
      angle = angle - 2;
      setAngle();
    }
  }

}

function setAngle() {

  // rotate knob
  knob.css({
    '-moz-transform':'rotate('+angle+'deg)',
    '-webkit-transform':'rotate('+angle+'deg)',
    '-o-transform':'rotate('+angle+'deg)',
    '-ms-transform':'rotate('+angle+'deg)',
    'transform':'rotate('+angle+'deg)'
  });

  // highlight ticks
  var activeTicks = (Math.round(angle / 10) + 1);
  $('.tick').removeClass('activetick');
  $('.tick').slice(0,activeTicks).addClass('activetick');

  // update value in text
  var pc = Math.round((angle/270)*2019);
  $('.current-value').text(pc);
  years.value = pc;

}

// mousewheel event - firefox
knob.bind('DOMMouseScroll', function(e){
  if(e.originalEvent.detail > 0) {
    moveKnob('down');
  } else {
    moveKnob('up');
  }
  return false;
});

// mousewheel event - ie, safari, opera
knob.bind('mousewheel', function(e){
  if(e.originalEvent.wheelDelta < 0) {
    moveKnob('down');
  } else {
    moveKnob('up');
  }
  return false;
});
