/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		5 June 2012
	Purpose:	Create time and age plots
*/

// build the time x axis
	var years_for_axis = [],
		ordinal_to_years = {};
	year_list.map(function(y) {
		years_for_axis.push(y.year_name);
		ordinal_to_years[y.year_name] = parseInt(y.year_viz);
	})
	var year_x_scale = d3.scale.ordinal().domain(years_for_axis).rangePoints([0, 200], 1),
		year_x_axis = d3.svg.axis().scale(year_x_scale)
			.orient('bottom').tickSize(5);


// build the age x axis
	var ages_for_axis = [],
		ages_to_ordinal = {},
		ordinal_to_ages = {};
	age_list.filter(function(a) {
		return parseInt(a.age_plot);
	}).map(function(a) {
		ages_for_axis.push(a.age_axis);
		ages_to_ordinal[a.age_viz] = a.age_axis;
		ordinal_to_ages[a.age_axis] = parseInt(a.age_viz);
	});
	var age_x_scale = d3.scale.ordinal().domain(ages_for_axis).rangePoints([0, 425], 1),
		age_x_axis = d3.svg.axis().scale(age_x_scale)
			.orient('bottom').tickSize(5);

// placeholders
	var year_y_scales = {},
		year_y_axes = {},
		year_y_labels = {},
		age_y_axes = {},
		age_y_labels = {},
		age_y_scales = {},
		ta_titles = {},
		ta_subtitles = {}
		ta_subtitles2 = {},
		age_points = {},
		age_lines = {},
		year_points = {},
		year_lines = {};

// functions to change settings when clicking on the plot
	function change_age_ta(new_age, c) {
		change_age(new_age, c);
	}
	function change_time_ta(new_year, c) {
		change_year(new_year, c);
	}


// loop through canvases
	canvas_data.forEach(function(canvas) {
		var c = canvas.canvas;
		
	// select the g for this chart
		var g = d3.select('#time_age_' + c);
	
	// add the time plot
		var tp = g.append('g')
			.attr('transform', 'translate(-10, 0)');
	
	// add the x axis for the time plot
		tp.append('g')
			.attr('transform', 'translate(50,320)')
			.attr('class', 'time axis')
			.call(year_x_axis);
	
	// add the age plot
		var ap = g.append('g')
			.attr('transform', 'translate(250, 0)');
	
	// add the x axis for the age plot
		ap.append('g')
			.attr('transform', 'translate(50,320)')
			.attr('class', 'age axis')
			.call(age_x_axis);
	
	// add the y axis for time
		year_y_scales[c] = d3.scale.linear().range([320, 80]);
		year_y_axes[c] = d3.svg.axis().scale(year_y_scales[c]).orient('left').tickSize(5);
		year_y_labels[c] = tp.append('g')
			.attr('transform', 'translate(50, 0)')
			.attr('class', 'y axis')
			.call(year_y_axes[c]);
	
	// add the y axis for age
		age_y_scales[c] = d3.scale.linear().range([320, 80]);
		age_y_axes[c] = d3.svg.axis().scale(age_y_scales[c]).orient('left').tickSize(5);
		age_y_labels[c] = ap.append('g')
			.attr('transform', 'translate(50, 0)')
			.attr('class', 'y axis')
			.call(age_y_axes[c]);
	
	// add x axis titles
		ap.append('text')
			.attr('dx', 212+50)
			.attr('dy', 360)
			.style('fill', '#555')
			.style('font-weight', 'bold')
			.text('Age');
		tp.append('text')
			.attr('dx', 100+50)
			.attr('dy', 360)
			.style('fill', '#555')
			.style('font-weight', 'bold')
			.text('Year');
	
	// overall title
		ta_titles[c] = g.append('text')
			.attr('dx', 375)
			.attr('dy', 20)
			.style('fill', '#555')
			.style('font-weight', 'bold')
			.style('font-size', '18px')
			.text(lookups['geo'][settings['geo_' + c]].name);
		ta_subtitles[c] = g.append('text')
			.attr('dx', 375)
			.attr('dy', 40)
			.style('fill', '#555')
			.style('font-weight', 'bold')
			.style('font-size', '16px')
			.text(lookups['cause'][settings['cause_' + c]].cause_name);
		ta_subtitles2[c] = g.append('text')
			.attr('dx', 375)
			.attr('dy', 60)
			.style('fill', '#555')
			.style('font-weight', 'bold')
			.style('font-size', '14px')
			.text(metric_list.filter(function(d) { return settings['metric_' + c] == d.val; })[0].short + unit_list[settings['unit_' + c]]);
	
	// add age points and lines in the requisite positions
		var ap_plot = ap.append('g').attr('transform', 'translate(50, 0)');
		age_lines[c] = ap_plot.selectAll()
			.data(ages_for_axis)
		  .enter().append('line')
		  	.attr('x1', function(d) {
		  		return age_x_scale(d)
		  	})
		  	.attr('x2', function(d) {
		  		return age_x_scale(d)
		  	})
		  	.attr('y1', 320)
		  	.attr('y2', 320)
		  	.style('stroke', '#555')
		  	.style('stroke-width', '2px');
		age_points[c] = ap_plot.selectAll()
			.data(ages_for_axis)
		  .enter().append('circle')
			.attr('class', 'ta_point')
		  	.attr('cx', function(d) {
		  		 return age_x_scale(d);
		  	})
		  	.attr('cy', 320)
		  	.attr('r', 3)
		  	.attr('onclick', function(d) {
		  		return 'change_age_ta(' + lookups['age_from_short'][d].age_viz + ',' + c + ');'
		  	});
	
	// add time points and lines in the requisite positions
		var tp_plot = tp.append('g').attr('transform', 'translate(50, 0)');
		year_lines[c] = tp_plot.selectAll()
			.data(years_for_axis)
		  .enter().append('line')
		  	.attr('x1', function(d) {
		  		return year_x_scale(d)
		  	})
		  	.attr('x2', function(d) {
		  		return year_x_scale(d)
		  	})
		  	.attr('y1', 320)
		  	.attr('y2', 320)
		  	.style('stroke', '#555')
		  	.style('stroke-width', '2px');
		year_points[c] = tp_plot.selectAll()
			.data(years_for_axis)
		  .enter().append('circle')
		  	.attr('class', 'ta_point')
		  	.attr('cx', function(d) {
		  		 return year_x_scale(d);
		  	})
		  	.attr('cy', 320)
		  	.attr('r', 3)
		  	.attr('onclick', function(d) {
		  		return 'change_time_ta(' + lookups['year_from_name'][d].year_viz + ',' + c + ');'
		  	});
	});
	
// refresh the plots
	function refresh_time_age(c) {
		
	// find the parameters for this plot
		var cause = settings['cause_' + c],
			sex = settings['sex_' + c],
			year = settings['year_' + c],
			age = settings['age_' + c],
			metric = settings['metric_' + c],
			unit = settings['unit_' + c],
			geo = settings['geo_' + c],
			chart = settings['chart_' + c];
	
	// update the plot if it's displayed
		if (chart_visibility['time_age_' + c]) {
			
		// load in the data if it hasn't been already
			if (settings['chart_1'] == 'map' || settings['chart_2'] == 'map') retrieve_map_data(cause, sex, metric);
			else retrieve_treemap_data(geo, sex, metric);
		
		// make arrays of the data
			var time_age_data = {};
			age_list.map(function(a) {
				year_list.map(function(y) {
					time_age_data[a.age_viz + '_' + y.year_viz] = retrieve_uncertainty(geo, sex, cause, y.year_viz, a.age_viz, metric, unit);
				});
			});
		
		// find max value for age plot
			var age_vals = [];
			ages_for_axis.map(function(a) {
				age_vals.push(time_age_data[lookups['age_from_short'][a].age_viz + '_' + year][2]);
			});
			var age_y_max = d3.max(age_vals);
		
		// find max value for year plot
			var year_vals = [];
			years_for_axis.map(function(y) {
				year_vals.push(time_age_data[age + '_' + lookups['year_from_name'][y].year_viz][2]);
			});
			var year_y_max = d3.max(year_vals);
		
		// update the scales
			age_y_scales[c].domain([0, age_y_max]);
			age_y_axes[c].scale(age_y_scales[c]).tickFormat(tick_formatter(age_y_max, settings['unit_' + c]));
			age_y_labels[c].transition().duration(1000).call(age_y_axes[c]);
			year_y_scales[c].domain([0, year_y_max])
			year_y_axes[c].scale(year_y_scales[c]).tickFormat(tick_formatter(year_y_max, settings['unit_' + c]));
			year_y_labels[c].transition().duration(1000).call(year_y_axes[c]);
			
		// update the titles
			ta_titles[c].text(lookups['geo'][settings['geo_' + c]].name);
			ta_subtitles[c].text(lookups['cause'][settings['cause_' + c]].cause_name);
			ta_subtitles2[c].text(lookups.metric_labels[settings['metric_' + c]] + lookups.unit_labels[settings['unit_' + c]]);
			
		// update the age plot
			age_points[c].transition().duration(1000)
				.attr('cy', function(a) {
					return age_y_scales[c](time_age_data[lookups['age_from_short'][a].age_viz + '_' + year][0]);
				});
			age_lines[c].transition().duration(1000)
				.attr('y1', function(a) {
					return age_y_scales[c](time_age_data[lookups['age_from_short'][a].age_viz + '_' + year][1]);
				})
				.attr('y2', function(a) {
					return age_y_scales[c](time_age_data[lookups['age_from_short'][a].age_viz + '_' + year][2]);
				});
		
		// update the time plot
			year_points[c].transition().duration(1000)
				.attr('cy', function(y) {
					return year_y_scales[c](time_age_data[age + '_' + lookups['year_from_name'][y].year_viz][0]);
				});
			year_lines[c].transition().duration(1000)
				.attr('y1', function(y) {
					return year_y_scales[c](time_age_data[age + '_' + lookups['year_from_name'][y].year_viz][1]);
				})
				.attr('y2', function(y) {
					return year_y_scales[c](time_age_data[age + '_' + lookups['year_from_name'][y].year_viz][2]);
				});
			
		}
		
	}
