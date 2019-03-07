// filter slider
var sliderFill = d3
.sliderBottom()
.min(d3.min(years))
.max(d3.max(years))
.width(900)
.tickFormat(d3.format('d'))
.ticks(centuries.length)
.default(0.015)
.fill('#2196f3')

var gFill = d3
.select('div#slider-fill')
.append('svg')
.attr('width', 1000)
.attr('height', 100)
.append('g')
.attr('transform', 'translate(30,30)');

gFill.call(sliderFill);
d3.select('p#value-fill').text(d3.format('d')(sliderFill.value()));