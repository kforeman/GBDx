/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		18 April 2012
	Purpose:	Make stacked bar graphs of risk factor attributions
*/

// spacing variables
	var risk_top_pad = 10,
		risk_left_pad = 120,
		risk_bottom_pad = 40,
		risk_right_pad = 22;
	
// lookup full risk name based on variable name
	var risk_lookup = {};
	risk_list.forEach(function(r) {
		risk_lookup[r.risk] = { 'short': r.risk_short, 'category': r.risk_level == 1 ? 'summary' : r.risk_parent };
	});

// list of risks inside each category
	var risks_by_cat = {},
		risk_names_by_cat = {};
	risk_list.forEach(function(r) {
		if (r.risk_level == 2) {
			if (typeof risks_by_cat[r.risk_parent] == 'undefined') {
				risks_by_cat[r.risk_parent] = [r.risk];
				risk_names_by_cat[r.risk_parent] = [r.risk_short];
			}
			else {
				risks_by_cat[r.risk_parent].push(r.risk);
				risk_names_by_cat[r.risk_parent].push([r.risk_short]);
			}
		}
		else if (r.risk_level == 1) {
			if (typeof risks_by_cat['summary'] == 'undefined') {
				risks_by_cat['summary'] = [r.risk];
				risk_names_by_cat['summary'] = [r.risk_short];
			}
			else {
				risks_by_cat['summary'].push(r.risk);
				risk_names_by_cat['summary'].push(r.risk_short);
			}
		}
	});

// colors for stacked bars
	sbar_color_lookup = {
		1:	treemap_color_list['A'][6],
		2:	treemap_color_list['A'][4],
		3:	treemap_color_list['A'][2],
		4:	treemap_color_list['B'][6],
		5:	treemap_color_list['B'][4],
		6:	treemap_color_list['B'][2],
		7:	treemap_color_list['C'][6],
		8:	treemap_color_list['C'][2]
	};
	

// list of causes ordered by "color", only including level 2 causes
	var risk_causes = cause_list.filter(function(d) { return parseInt(d.cause_level) == 2; }).sort(function(b,a) { return parseInt(b.cause_color) - parseInt(a.cause_color); });

// placeholder for the variables necesary for each plot
	var risk_y_scale = {},
		risk_y_axis = {},
		risk_y_labels = {},
		risk_x_scale = {},
		risk_x_axis = {},
		risk_x_labels = {},
		risk_x_title = {},
		risk_sbar_data = {},
		risk_bar_thickness = {},
		risk_stack_layout = {},
		risk_sbar_rects = {};

// function to find the risk value in the correct units when given a datum
	function find_risk_sbar_value(d, age, year, geo, sex, unit) {
		if (unit == 'num') return parseFloat(d['mnm_' + age + '_' + year]);
		else if (unit == 'rate') return parseFloat(d['mnm_' + age + '_' + year]) / parseInt(pops[geo][sex]['pop_' + age + '_' + year]) * 100000;
	}

// loop through sections A and B
	AB.forEach(function(c) {
		
	// add a g for this plot
		g = d3.select('#' + c)
		  .append('g')
		  	.attr('id', 'sbar_' + c)
		  	.attr('transform', 'translate(' + (settings['chart_' + c] == 'sbar' ? content_buffer : -1 * content_width) + ',' + content_buffer + ')');
	
	// build the y axis (list of risks)
		risk_y_scale[c] = d3.scale.ordinal().domain(risk_names_by_cat[settings['sbar_cat_' + c]]).rangePoints([risk_top_pad, height/2 - risk_bottom_pad], 1),
		risk_y_axis[c] = d3.svg.axis().scale(risk_y_scale[c])
			.orient('left').tickSize(5);
	
	// figure out appropriate bar thickness
		risk_bar_thickness[c] = d3.round((height/2 - risk_top_pad - risk_bottom_pad) / (risks_by_cat[settings['sbar_cat_' + c]].length + 1) * .8);
	
	// build the x axis
		risk_x_scale[c] = d3.scale.linear().range([0, content_width - risk_right_pad - risk_left_pad]);
		risk_x_axis[c] = d3.svg.axis().scale(risk_x_scale[c])
			.orient('bottom').tickSize(5);
		risk_x_labels[c] = g.append('g')
			.attr('transform', 'translate(' + risk_left_pad + ',' + (height/2 - risk_bottom_pad) + ')')
			.attr('class', 'risk_x axis')
			.call(risk_x_axis[c]);
	
	// add x axis title
		risk_x_title[c] = g.append('text')
			.attr('dx', risk_left_pad + risk_x_scale[c](.5))
			.attr('dy', height/2 - 10)
			.style('fill', '#555')
			.style('font-weight', 'bold')
			.style('font-size', '14px')
			.text(metric_list.filter(function(d) { return settings['metric_' + c] == d.val; })[0].short + unit_list[settings['sbar_unit_' + c]]);
	
	// load in the data for this chart
		risk_sbar_data[c] = retrieve_sbar_rf(settings['geo_' + c], settings['sex_' + c], settings['metric_' + c], settings['sbar_cat_' + c]);
	
	// set the x scale for the plot
		var tmp_max = [];
		year_list.forEach(function(y) {
			risk_sbar_data[c]['totals'].forEach(function(d) {
				tmp_max.push(find_risk_sbar_value(d, settings['age_' + c], y.year_viz, settings['geo_' + c], settings['sex_' + c], settings['sbar_unit_' + c]));
			});
		});
		risk_x_scale[c].domain([0, d3.max(tmp_max)]);
		risk_x_axis[c].scale(risk_x_scale[c])
			.tickFormat(tick_formatter(d3.max(tmp_max)));
		risk_x_labels[c].call(risk_x_axis[c]);
	
	// figure out the stacked bar layout (note that X and Y are swapped because we want it horizontal)
		risk_stack_layout[c] = d3.layout.stack()
			.offset('zero')
			.out(function(d,y0,y) {
				if (typeof d != 'undefined') {
					d.y0 = y0;
					d.y = y;
				}
			})
			.x(function(d) { 
				return typeof d == 'undefined' 
					? 0 
					: risk_y_scale[c](risk_lookup[d.risk]['short']); 
			})
			.y(function(d) { 
				return typeof d == 'undefined' 
					? 0 
					: risk_x_scale[c](find_risk_sbar_value(d, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], settings['sbar_unit_' + c])); 
			});	
	
	// convert the layout'd data into a simple array for plotting
		risk_sbar_data[c]['flat'] = [];
		risk_stack_layout[c](risk_sbar_data[c]['values']).forEach(function(d) {
			d.forEach(function(e) {
				if (typeof e != 'undefined') {
					risk_sbar_data[c]['flat'].push({ 
						cause_risk: e.cause_viz + '_' + e.risk, 
						y: risk_y_scale[c](risk_lookup[e.risk]['short']) - risk_bar_thickness[c]/2, 
						x: e.y0 + risk_left_pad, 
						width: e.y < 0 ? 0 : e.y, 
						height: risk_bar_thickness[c],
						cause_color: lookups['cause'][e.cause_viz].cause_color,
						tooltip: lookups['cause'][e.cause_viz].cause_name + '<br>' + 
							risk_lookup[e.risk].short + ' attributable risk<br>' +
							d3.format(',')(d3.round(find_risk_sbar_value(e, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], 'num'))) + ' ' + metric_list.filter(function(i) { return settings['metric_' + c] == i.val; })[0].short + unit_list['num'] + '<br>' +
							'(' + d3.format(',')(d3.round(find_risk_sbar_value(e, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], 'rate'))) + unit_list['rate'] + ' people)'
					});
				}
			});
		});
	
	// draw rectangles for each bar segment
		risk_sbar_rects[c] = g.selectAll('risk_rects')
			.data(risk_sbar_data[c]['flat'], function(d) { return d.cause_risk; })
		 .enter().append('rect')
			.attr('x', function(d) { return d.x; })
			.attr('y', function(d) { return d.y; })
			.attr('title', function(d) { return d.tooltip; })
			.attr('width', function(d) { return d.width; })
			.attr('height', function(d) { return d.height; })
			.style('fill', function(d) { return sbar_color_lookup[d.cause_color]; })
			.attr('class', 'sbar_rect');
	
	// add tooltips to rectangles
		$('.sbar_rect').poshytip({
				slide: false, 
				followCursor: true, 
				alignTo: 'cursor', 
				showTimeout: 0, 
				hideTimeout: 0, 
				alignX: 'center', 
				alignY: 'inner-bottom', 
				className: 'tip-twitter',
				offsetY: 5
		});
	
	// draw the y axis labels
		risk_y_labels[c] = g.append('g')
			.attr('transform', 'translate(' + risk_left_pad + ',' + 0 + ')')
			.attr('class', 'risk_y axis')
			.call(risk_y_axis[c]);
	});
	
// update the chart
	function refresh_sbar(c) {
	
	// update the y scale
		risk_y_scale[c].domain(risk_names_by_cat[settings['sbar_cat_' + c]]);
		risk_y_axis[c].scale(risk_y_scale[c]);
		risk_y_labels[c].transition().duration(1000).call(risk_y_axis[c]);
		risk_bar_thickness[c] = d3.round((height/2 - risk_top_pad - risk_bottom_pad) / (risks_by_cat[settings['sbar_cat_' + c]].length + 1) * .8);
	
	// update the data
		risk_sbar_data[c] = retrieve_sbar_rf(settings['geo_' + c], settings['sex_' + c], settings['metric_' + c], settings['sbar_cat_' + c]);
	
	// update the x axis
		var tmp_max = [];
		year_list.forEach(function(y) {
			risk_sbar_data[c]['totals'].forEach(function(d) {
				tmp_max.push(find_risk_sbar_value(d, settings['age_' + c], y.year_viz, settings['geo_' + c], settings['sex_' + c], settings['sbar_unit_' + c]));
			});
		});
		risk_x_scale[c].domain([0, d3.max(tmp_max)]);
		risk_x_axis[c].scale(risk_x_scale[c])
			.tickFormat(tick_formatter(d3.max(tmp_max)));
		risk_x_labels[c].transition().duration(1000).call(risk_x_axis[c]);
		risk_x_title[c].text(metric_list.filter(function(d) { return settings['metric_' + c] == d.val; })[0].short + unit_list[settings['sbar_unit_' + c]]);
	
	// update layout function y-lookup
		risk_stack_layout[c]
			.y(function(d) { 
				return typeof d == 'undefined' 
					? 0 
					: risk_x_scale[c](find_risk_sbar_value(d, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], settings['sbar_unit_' + c])); 
			});	
	
	// update the data array
		risk_sbar_data[c]['flat'] = [];
		risk_stack_layout[c](risk_sbar_data[c]['values']).forEach(function(d) {
			d.forEach(function(e) {
				if (typeof e != 'undefined') {
					risk_sbar_data[c]['flat'].push({ 
						cause_risk: e.cause_viz + '_' + e.risk, 
						y: risk_y_scale[c](risk_lookup[e.risk]['short']) - risk_bar_thickness[c]/2, 
						x: e.y0 + risk_left_pad, 
						width: e.y < 0 ? 0 : e.y, 
						height: risk_bar_thickness[c],
						cause_color: lookups['cause'][e.cause_viz].cause_color,
						tooltip: lookups['cause'][e.cause_viz].cause_name + '<br>' + 
							risk_lookup[e.risk].short + ' attributable risk<br>' +
							d3.format(',')(d3.round(find_risk_sbar_value(e, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], 'num'))) + ' ' + metric_list.filter(function(i) { return settings['metric_' + c] == i.val; })[0].short + unit_list['num'] + '<br>' +
							'(' + d3.format(',')(d3.round(find_risk_sbar_value(e, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], 'rate'))) + unit_list['rate'] + ' people)'
					});
				}
			});
		});
	
	// update the rectangles
		// rebind the data
			risk_sbar_rects[c] = risk_sbar_rects[c]
				.data(risk_sbar_data[c]['flat'], function(d) { return d.cause_risk; });
		// insert new rectangles
			risk_sbar_rects[c]
  			  .enter().insert('rect', '.risk_y.axis')
				.attr('x', risk_left_pad)
				.attr('y', function(d) { return d.y; })
				.attr('title', function(d) { return d.tooltip; })
				.attr('width', 0)
				.attr('height', function(d) { return d.height; })
				.style('fill', function(d) { return sbar_color_lookup[d.cause_color]; })
				.attr('class', 'sbar_rect');
		// update existing rectangles
			risk_sbar_rects[c]
				.attr('title', function(d) { return d.tooltip; })
			  .transition().ease('linear').duration(1000)
				.attr('x', function(d) { return d.x; })
				.attr('y', function(d) { return d.y; })
				.attr('width', function(d) { return d.width; })
				.attr('height', function(d) { return d.height; });
		// remove rectangles that no longer exist
			risk_sbar_rects[c]
			  .exit().transition().duration(500).style('opacity', 1e-6).remove();

	// update tooltips
		$('.sbar_rect').poshytip({
				slide: false, 
				followCursor: true, 
				alignTo: 'cursor', 
				showTimeout: 0, 
				hideTimeout: 0, 
				alignX: 'center', 
				alignY: 'inner-bottom', 
				className: 'tip-twitter',
				offsetY: 5
		});
	}
	
	
	
	
