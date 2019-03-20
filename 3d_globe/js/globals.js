var width = 1000;
var height = 750;
var centered;

legendRectSize = 18;
legendSpacing = 4;

// default speed of the sider in 1000*seconds per year
SLIDER_SPEED = 1000;

// the amount of years nothing has happend
idle_count = 0;

var century = 0;

var is_globe = true;

// zoom and drag parameters
var zoom_level = 0
var sensitivity = 0.25
var maxElevation = 45
var time = Date.now()
    rotate = [10, -10] 
    velocity = [.003, -.001];

// years and locations are binned to prevent clutter
var YEAR_STEP = 5
var LONGLAT_STEP = 0.2

var show_migration = true;
