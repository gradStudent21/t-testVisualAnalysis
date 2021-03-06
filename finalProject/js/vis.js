function calcGaussOverlap(d) {
	var perc = 2 * jStat.normal.cdf(-(Math.abs(d))/2, 0, 1);
	perc = d3.round(perc,4) * 100;
	return perc;
}
function calcCL(d) {
	var CL = jStat.normal.cdf((d / Math.sqrt(2)), 0, 1);
	CL = d3.round(CL, 4) * 100;
	return CL;
}
function calcNNT(d) {
	var CER = para.CER / 100;
	var NNT = 1 / (jStat.normal.cdf(d+jStat.normal.inv(CER, 0, 1), 0 ,1)-CER);
	return NNT;

}
var para = {
	cohend: 0.2,
	var_ratio: 1,
	mu1: 0,
	sigma1: 1,
	n1: 10,
	n2: 10,
	CER: 20,
	step: 0.1};
para.sigma2 = para.sigma1*para.var_ratio;
para.mu2 = para.mu1 + para.cohend*para.sigma1;
para.u3 = jStat.normal.cdf(para.cohend, 0, 1);
para.perc = calcGaussOverlap(para.cohend);
para.CL = calcCL(para.cohend);
para.NNT = calcNNT(para.cohend);

var $slider = $("#slider");
if ($slider.length > 0) {
  $slider.slider({
    min: 0,
    max: 3,
    value: para.cohend,
    orientation: "horizontal",
    range: "min",
	animate: "fast",
	step: 0.1,
	change: function(event, ui) {sliderChange(ui.value);},
	slide: function(event, ui) {
		$slider.slider("option", "step", parseFloat(para.step));
		$(".tooltip-inner").text(ui.value);},
	start: function(event, ui) {tooltip.tooltip("show"); $(".tooltip-inner").text(ui.value)},
	stop: function() {tooltip.tooltip("hide")}
	 });
	}

$slider.find(".ui-slider-handle").append("<div class='slide-tooltip'/>");

var tooltip = $(".slide-tooltip").tooltip( {title: $("#slider").slider("value"), trigger: "manual"});


// SETTINGS popover
 $('#slider-settings').popover({
 	placement: "right",
  	content: function() {
      return $("#popover-content").html();
    },
 	html: true
 });

$('.div_settings').on('change','#inputCER',function () {
	if(this.value <= 100 && this.value > 0) {
		para.CER = this.value;
	} else {
			return false;
	}
    para.CER = this.value;
    $(".inputCER").attr("value", this.value);
    sliderChange(para.cohend);

});
$('.div_settings').on('change','#inputCohend',function () {
	if(this.value <= 5 && this.value > 0) {
		var value = this.value;
	} else {
			var value = 5;
	}

    $slider.slider("option", "max", value);
    $(".inputCohend").attr("value", value);

});
$('.div_settings').on('change','#inputStep',function () {
	if(this.value <= 1 && this.value > 0) {
		para.step = this.value;
	} else {
		para.step = 0.1;
	}
	 $(".inputStep").attr("value", para.step);
});



//Click anywhere to remove popover
 $(':not(#anything)').on('click', function (e) {
    $('[data-toggle="popover"]').each(function () {
        //the 'is' for buttons that trigger popups
        //the 'has' for icons within a button that triggers a popup
        if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
            $(".popover").toggleClass("in").remove();
        }
    });
});

// $(':not(#anything)').on('click', function (e) {
// 	$(".popover").toggleClass("in").remove();
// });


$(".inputCER").attr("value", para.CER);
$(".inputCohend").attr("value", $slider.slider("option", "max"));
$(".inputStep").attr("value", para.step);


// plot dimensions
 if(parseInt(d3.select('body').style('width'), 10) < 767) {
	var aspect = 0.5;
	var margin = {top: 40, right: 15, bottom: 20, left: 15};
} else {
	var aspect = 0.4;
	var margin = {top: 40, right: 20, bottom: 30, left: 20};
}

var	w = parseInt(d3.select('#viz').style('width'), 10);
	w = w - margin.left - margin.right;
var	h = aspect*w-margin.top - margin.left;



// x.values
		var x = [];
		for (var i = para.mu1-3*para.sigma1; i <= 5+3*para.sigma2; i += 0.01) {
			x.push(i);
		}


// Generates data
function genData(mu, sigma) {

		var y = [];
		for(var i = 0; i < x.length; i++) {
			y.push(jStat.normal.pdf(x[i], mu, sigma));
		}
		var tmp = [];
			for(var i = 0; i < x.length; i++) {
				tmp.push([x[i], y[i]]);
			}
		var data = {
			data: tmp,
			x: x,
			y: y
		};
	return data;
}

// Data sets
var data1 = genData(para.mu1, para.sigma1),
	data2 = genData(para.mu2, para.sigma2);

// overlap poly
var poly = [];
for(var i = 0; i < data1.data.length; i++) {

	var tmp_y = Math.min(data1.y[i], data2.y[i]),
		tmp_x = data1.x[i];

	var tmp =  [tmp_x,tmp_y];

	poly.push(tmp);
}

// Axes min and max
var x_max = para.mu2+para.sigma2*3
var x_min = para.mu1-para.sigma1*3
var y_max = d3.max([d3.max(data1.y), d3.max(data2.y)]);

// Create scales
var xScale = d3.scale.linear().domain([x_min, x_max]).range([0,w]);
var yScale = d3.scale.linear().domain([0, y_max]).range([0,h]);

// Line function
var line = d3.svg.line()
			.x(function(d) {
			 return	xScale(d[0])

			})
			.y(function(d) {
				return h-yScale(d[1]);
			})

// Append SVG
var svg = d3.select("#viz")
			.append("svg")
			.attr("height", h + margin.top + margin.bottom)
			.attr("width", w + margin.left + margin.right)
			.attr("id", "SVG-container");


var dists = svg.append("g")
				.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
				.attr("clip-path", "url(#clip)");

var g = svg.append("g")
			.attr("transform", "translate(" + margin.left + "," + (margin.top) + ")");
// clip-path
  var clip = svg.append("defs").append("svg:clipPath")
        .attr("id", "clip")
        .append("svg:rect")
        .attr("id", "clip-rect")
        .attr("x", "0")
        .attr("y", "-5")
        .attr("width", w)
        .attr("height", h);

//Define X axis
var xAxis = d3.svg.axis()
				  .scale(xScale)
				  .orient("bottom")
				   .tickSize(5);

var xAx = g.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + (h) + ")")
	.call(xAxis);



// Append dists
var dist1 = dists.append("svg:path")
	.attr("d", line(data1.data))
	.attr("id","dist1");

var dist2 = dists.append("svg:path")
	.attr("d", line(data2.data))
	.attr("id","dist2");
// overlap
var overlap = dists.append("svg:path")
	.attr("d", line(poly))
	.attr("class", "poly");

// mu lines
var mu1_line = g.append("line")
					.attr("id", "mu1")
					.attr("x1", xScale(para.mu1))
					.attr("x2", xScale(para.mu1))
					.attr("y1", yScale(0))
					.attr("y2", yScale(y_max));

var mu2_line = g.append("line")
					.attr("id", "mu2")
					.attr("x1", xScale(para.mu2))
					.attr("x2", xScale(para.mu2))
					.attr("y1", yScale(0))
					.attr("y2", yScale(y_max));



// marker
svg.append("svg:defs").append("marker")
    .attr("id", "marker-start")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 1)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,0L10,-5L10,5");

svg.append("svg:defs").append("marker")
    .attr("id", "marker-end")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 9)
    .attr("refY", 0)
    .attr("markerWidth", 6)
    .attr("markerHeight", 6)
    .attr("orient", "auto")
  .append("path")
    .attr("d", "M0,-5L10,0L0,5");

var mu_connect = g.append("line")
					.attr("id", "mu_connect")
					.attr("marker-start", "url(#marker-start)")
					.attr("marker-end", "url(#marker-end)")
					.attr("x1", xScale(para.mu1))
					.attr("x2", xScale(para.mu2))
					.attr("y1", -7)
					.attr("y2", -7);


var cohend_float = g.append("text")
					.attr("class", "cohen_float")
					.attr("text-anchor", "middle")
					.attr("x", xScale((para.mu1+para.mu2)/2))
					.attr("y", (-20))
					.text("Effect size: "+para.cohend);

// copy text
function changeInterpretText() {
	d3.select("span#cohend")
	.text(d3.round(para.cohend,2));
	d3.select("span#u3")
		.text(d3.round(para.u3*100,0));
	d3.select("span#perc")
		.text(d3.round(para.perc, 0));
	d3.select("span#CL")
		.text(d3.round(para.CL, 0));
	if(para.cohend > 0) {
		d3.select("span#NNT")
			.text(d3.round(para.NNT, 1));
	} else {
		d3.select("span#NNT")
			.text("∞");
	}

	d3.select("span#NNT_percent")
		.text(d3.round((1/para.NNT)*100, 1));
	d3.select("span#paraCER")
		.text(d3.round((para.CER), 1));

}
changeInterpretText();

// change
function reDrawPoly() {
	poly = [];
	for(var i = 0; i < data1.data.length; i++) {

		var tmp_y = Math.min(data1.y[i], data2.y[i]),
			tmp_x = data1.x[i];

		var tmp =  [tmp_x,tmp_y];

		poly.push(tmp);
	}
	poly.unshift([-5,0]);  // fix edges
	poly.push([5,0]);     // fix edges. **Make scalable
	dists.select(".poly")
		.transition()
		.duration(600)
		.attr("d", line(poly));
}

function updateScales() {
	 x_max = para.mu2+para.sigma2*3;
     x_min = para.mu1-para.sigma1*3;
	y_max = d3.max([d3.max(data1.y), d3.max(data2.y)]);

	// Create scales
	xScale.domain([x_min, x_max]);
	yScale.domain([0, y_max]);

	// transform axis
	xAx.transition().call(xAxis);
}

function reDrawDist2(newdata) {
	updateScales();
	 dists.select("#dist2")
		.transition()
		.duration(600)
		.attr("d", line(data2.data));
}
function reDrawDist1(newdata) {
	updateScales();
	 dists.select("#dist1")
		.transition()
		.duration(600)
		.attr("d", line(data1.data));
}
function arcTween(a) {
    var i = d3.interpolate(this._current, a);
    this._current = i(0);
    return function(t) {
        return u3.arc(i(t));
    };
}

function sliderChange(value) {
	  var old_d = para.cohend,
		  old_u3 = para.u3,
		  old_perc = para.perc,
		  old_CL = para.CL,
		  old_NNT = para.NNT;
	  para.cohend = value;
	  para.u3 = jStat.normal.cdf(para.cohend, 0, 1);
	  para.perc = calcGaussOverlap(para.cohend);
	  para.CL = calcCL(para.cohend);
	  para.NNT = calcNNT(para.cohend);
	  para.mu2 = para.mu1 + para.cohend*para.sigma1;
	  data2 = genData(para.mu2,para.sigma2);

		// redraw dist
		reDrawDist1();
		reDrawDist2();
		// redraw poly
		reDrawPoly();

		// update mu lines
		mu1_line.transition()
				.duration(600)
				.attr("x1", xScale(para.mu1))
				.attr("x2", xScale(para.mu1));

		mu2_line.transition()
				.duration(600)
				.attr("x1", xScale(para.mu2))
				.attr("x2", xScale(para.mu2));

		mu_connect.transition()
				.duration(600)
				.attr("x1", xScale(para.mu1))
				.attr("x2", xScale(para.mu2));

		cohend_float
		.transition()
		.duration(500)
		.tween("text", function() {
		  var i = d3.interpolate(old_d, para.cohend);
		  return function(t) {
		    this.textContent = "Effect size: " + d3.round(i(t), 2);
		  }});

		// update copy text
		changeInterpretText();
	};


// resize
$(window).on("resize", resize);

function resize() {
	var aspect = 0.4;
	var margin = {top: 40, right: 20, bottom: 30, left: 20},
 	w = parseInt(d3.select('#viz').style('width'), 10);
	w = w - margin.left - margin.right;
	h = aspect*w-margin.top - margin.left;

	// Scales
	xScale.range([0,w]);
	yScale.range([0,h]);

	// Axis
	xAx.attr("transform", "translate(0," + h + ")")
		.call(xAxis);

	// do the actual resize...
	svg.attr("width", w + margin.left + margin.right)
		.attr("height", h + margin.top + margin.bottom);


	dist1
	.attr("d", line(data1.data));

	dist2
	.attr("d", line(data2.data));
// overlap
	overlap
	.attr("d", line(poly));

// clip path
clip.attr("width", w)
        .attr("height", h);

// mu lines
mu1_line.attr("x1", xScale(para.mu1))
					.attr("x2", xScale(para.mu1))
					.attr("y1", yScale(0))
					.attr("y2", yScale(y_max));

mu2_line.attr("id", "mu2")
					.attr("x1", xScale(para.mu2))
					.attr("x2", xScale(para.mu2))
					.attr("y1", yScale(0))
					.attr("y2", yScale(y_max));
mu_connect.attr("x1", xScale(para.mu1))
					.attr("x2", xScale(para.mu2))
					.attr("y1", -7)
					.attr("y2", -7);


cohend_float.attr("x", xScale((para.mu1+para.mu2)/2))
					.attr("y", (-20));

}
