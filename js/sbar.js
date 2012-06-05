/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		5 June 2012
	Purpose:	Make stacked bar graphs of risk factor attributions
*/

// spacing variables
	var risk_top_pad = 10,
		risk_left_pad = 125,
		risk_bottom_pad = 40,
		risk_right_pad = 22;
	
// lookup full risk name based on variable name or vice versa
	var risk_lookup = {};
	risk_list.forEach(function(r) {
		risk_lookup[r.risk] = 		{ 'short': r.risk_short, 'category': r.risk_level == 1 ? 'summary' : r.risk_parent, 'risk': r.risk, 'name': r.risk_name };
		risk_lookup[r.risk_short] = { 'short': r.risk_short, 'category': r.risk_level == 1 ? 'summary' : r.risk_parent, 'risk': r.risk, 'name': r.risk_name };
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
				risk_names_by_cat[r.risk_parent].push(r.risk_short);
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
	d3.keys(risk_names_by_cat).forEach(function(r) {
		risk_names_by_cat[r].sort();
	});

// colors for stacked bars
	var sbar_color_lookup = {
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
	var risk_causes = cause_list
		.filter(function(d) { return parseInt(d.cause_level) == 2; })
		.sort(function(b,a) { return parseInt(b.cause_color) - parseInt(a.cause_color); });

// placeholder for the variables necesary for each plot
	var risk_y_scale = {},
		risk_y_domain = {},
		risk_y_axis = {},
		risk_y_labels = {},
		risk_x_scale = {},
		risk_x_axis = {},
		risk_x_labels = {},
		risk_x_title = {},
		risk_sbar_data = {},
		risk_bar_thickness = {},
		risk_stack_layout = {},
		risk_sbar_rects = {},
		risk_back_button = {},
		risk_sbar_label_rects = {};

// function to find the risk value in the correct units when given a datum
	function find_risk_sbar_value(d, age, year, geo, sex, unit, metric) {
		if (unit == 'num') return parseFloat(d['mnm_' + age + '_' + year]);
		else if (unit == 'rate') return parseFloat(d['mnm_' + age + '_' + year]) / parseInt(pops[geo][sex]['pop_' + age + '_' + year]) * 100000;
		else if (unit == 'prop') {
			var tmp = retrieve_map_data('T', sex, metric),
				env = parseFloat(tmp[geo]['mnm_' + age + '_' + year]);
			return parseFloat(d['mnm_' + age + '_' + year]) / env;
		}
	}

// loop through canvases
	canvas_data.forEach(function(canvas) {
		var c = canvas.canvas;
		
	// select the g for this plot
		g = d3.select('#sbar_' + c);

	// load in the data for this chart
		risk_sbar_data[c] = retrieve_sbar_rf(settings['geo_' + c], settings['sex_' + c], settings['metric_' + c], settings['risk_cat_' + c]);
	
	// put the risks in the correct order
		risk_y_domain[c] = [];
		risk_names_by_cat[settings['risk_cat_' + c]].forEach(function(r) {
			risk_y_domain[c].push(r);
		});
		if (settings['sbar_sort_' + c] == 'alpha') risk_y_domain[c].sort();
		else if (settings['sbar_sort_' + c] == 'rank') {
			risk_y_domain[c].sort(function(a,b) {
				return parseFloat(risk_sbar_data[c]['totals'].filter(function(d) { return d.risk == risk_lookup[b].risk; })[0]['mnm_' + settings['age_' + c] + '_' + settings['year_' + c]]) - parseFloat(risk_sbar_data[c]['totals'].filter(function(d) { return d.risk == risk_lookup[a].risk; })[0]['mnm_' + settings['age_' + c] + '_' + settings['year_' + c]]);
			});
		}	
	
	// build the y axis (list of risks)
		risk_y_scale[c] = d3.scale.ordinal().domain(risk_y_domain[c]).rangePoints([risk_top_pad, height * (c == 0 ? 1 : .5) - risk_bottom_pad], 1),
		risk_y_axis[c] = d3.svg.axis().scale(risk_y_scale[c])
			.orient('left').tickSize(5);
	
	// figure out appropriate bar thickness
		risk_bar_thickness[c] = d3.round((height * (c == 0 ? 1 : .5) - risk_top_pad - risk_bottom_pad) / (risk_names_by_cat[settings['risk_cat_' + c]].length + 1) * .8);
	
	// build the x axis
		risk_x_scale[c] = d3.scale.linear().range([0, content_width - risk_right_pad - risk_left_pad]);
		risk_x_axis[c] = d3.svg.axis().scale(risk_x_scale[c])
			.orient('bottom').tickSize(5);
		risk_x_labels[c] = g.append('g')
			.attr('transform', 'translate(' + risk_left_pad + ',' + (height * (c == 0 ? 1 : .5) - risk_bottom_pad) + ')')
			.attr('class', 'risk_x axis')
			.call(risk_x_axis[c]);
	
	// add x axis title
		risk_x_title[c] = g.append('text')
			.attr('dx', risk_left_pad + risk_x_scale[c](.5))
			.attr('dy', height * (c == 0 ? 1 : .5) - 10)
			.style('fill', '#555')
			.style('font-weight', 'bold')
			.style('font-size', '14px')
			.text(lookups.metric_labels[settings['metric_' + c]] + lookups.unit_labels[settings['unit_' + c]]);
	
	// set the x scale for the plot
		var tmp_max = [];
		year_list.forEach(function(y) {
			risk_sbar_data[c]['totals'].forEach(function(d) {
				tmp_max.push(find_risk_sbar_value(d, settings['age_' + c], y.year_viz, settings['geo_' + c], settings['sex_' + c], settings['unit_' + c], settings['metric_' + c]));
			});
		});
		risk_x_scale[c].domain([0, d3.max(tmp_max)]);
		risk_x_axis[c].scale(risk_x_scale[c])
			.tickFormat(tick_formatter(d3.max(tmp_max), settings['unit_' + c]));
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
					: risk_x_scale[c](find_risk_sbar_value(d, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], settings['unit_' + c], settings['metric_' + c])); 
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
							risk_lookup[e.risk].name + ' attributable risk<br>' +
							tick_formatter(find_risk_sbar_value(e, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], 'prop', settings['metric_' + c]), 'prop')(find_risk_sbar_value(e, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], 'prop', settings['metric_' + c])) + ' of total ' + metric_list.filter(function(i) { return settings['metric_' + c] == i.val; })[0].short + '<br>' + 
							d3.format(',')(d3.round(find_risk_sbar_value(e, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], 'num', settings['metric_' + c]))) + ' ' + metric_list.filter(function(i) { return settings['metric_' + c] == i.val; })[0].short + unit_list['num'] + '<br>' +
							'(' + d3.format(',')(d3.round(find_risk_sbar_value(e, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], 'rate', settings['metric_' + c]))) + unit_list['rate'] + ' people)'
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
	
	// draw (invisible) rectangles over the y axis to enable easier mouse interactions
		risk_sbar_label_rects[c] = g.selectAll('risk_label_rects')
			.data(risk_y_domain[c])
		  .enter().append('rect')
			.attr('x', 0)
			.attr('width', risk_left_pad)
			.attr('y', function(d) { return risk_y_scale[c](d) - risk_bar_thickness[c]/2; })
			.attr('height', risk_bar_thickness[c])
			.attr('class', 'risk_label_rect')
			.attr('onclick', function(d) { return settings['risk_cat_' + c] == 'summary' ? 'change_risk_cat("' + risk_lookup[d].risk + '",' + c + ')' : '' })
			.style('cursor', settings['risk_cat_' + c] == 'summary' ? 'pointer' : 'default')
			.attr('title', function(d) { return risk_lookup[d].name; });
	
	// add tooltips to the y axis labels
		$('.risk_label_rect').poshytip({
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
	
	// add a back button to return to the summary
		risk_back_button[c] = g.append('image')
			.attr('xlink:href', 'resources/arrow.png')
			.attr('x', 20)
			.attr('class', 'risk_back_button')
			.attr('y', (height * (c == 0 ? 1 : .5)) - 25)
			.attr('width', 31)
			.attr('height', 13)
			.attr('visibility', settings['risk_cat_' + c] != 'summary' ? 'visible' : 'hidden')
			.attr('onclick', 'change_risk_cat("summary",' + c + ')')
			.attr('title', 'Return to Risk Factor Summary.');
		$('.risk_back_button').poshytip({
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
		
	});
	
// update the chart
	function refresh_sbar(c) {
		if (chart_visibility['sbar_' + c]) { 
	
		// update the data
			risk_sbar_data[c] = retrieve_sbar_rf(settings['geo_' + c], settings['sex_' + c], settings['metric_' + c], settings['risk_cat_' + c]);
		
		// update the y scale
			risk_y_domain[c] = [];
			risk_names_by_cat[settings['risk_cat_' + c]].forEach(function(r) {
				risk_y_domain[c].push(r);
			});
			if (settings['sbar_sort_' + c] == 'alpha') risk_y_domain[c].sort();
			else if (settings['sbar_sort_' + c] == 'rank') {
				risk_y_domain[c].sort(function(a,b) {
					return parseFloat(risk_sbar_data[c]['totals'].filter(function(d) { return d.risk == risk_lookup[b].risk; })[0]['mnm_' + settings['age_' + c] + '_' + settings['year_' + c]]) - parseFloat(risk_sbar_data[c]['totals'].filter(function(d) { return d.risk == risk_lookup[a].risk; })[0]['mnm_' + settings['age_' + c] + '_' + settings['year_' + c]]);
				});
			}
			risk_y_scale[c].domain(risk_y_domain[c]);
			risk_y_axis[c].scale(risk_y_scale[c]);
			risk_y_labels[c].transition().duration(1000).ease('linear').call(risk_y_axis[c]);
			risk_bar_thickness[c] = d3.round((height * (c == 0 ? 1 : .5) - risk_top_pad - risk_bottom_pad) / (risk_names_by_cat[settings['risk_cat_' + c]].length + 1) * .8);
		
		// update the x axis
			var tmp_max = [];
			year_list.forEach(function(y) {
				risk_sbar_data[c]['totals'].forEach(function(d) {
					tmp_max.push(find_risk_sbar_value(d, settings['age_' + c], y.year_viz, settings['geo_' + c], settings['sex_' + c], settings['unit_' + c], settings['metric_' + c]));
				});
			});
			risk_x_scale[c].domain([0, d3.max(tmp_max)]);
			risk_x_axis[c].scale(risk_x_scale[c])
				.tickFormat(tick_formatter(d3.max(tmp_max), settings['unit_' + c]));
			risk_x_labels[c].transition().duration(1000).call(risk_x_axis[c]);
			risk_x_title[c].text(lookups.metric_labels[settings['metric_' + c]] + lookups.unit_labels[settings['unit_' + c]]);
		
		// update layout function y-lookup
			risk_stack_layout[c]
				.y(function(d) { 
					return typeof d == 'undefined' 
						? 0 
						: risk_x_scale[c](find_risk_sbar_value(d, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], settings['unit_' + c], settings['metric_' + c])); 
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
								risk_lookup[e.risk].name + ' attributable risk<br>' +
								tick_formatter(find_risk_sbar_value(e, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], 'prop', settings['metric_' + c]), 'prop')(find_risk_sbar_value(e, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], 'prop', settings['metric_' + c])) + ' of total ' + lookups.metric_labels[settings['metric_' + c]] + '<br>' + 
								d3.format(',')(d3.round(find_risk_sbar_value(e, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], 'num', settings['metric_' + c]))) + ' ' + lookups.metric_labels[settings['metric_' + c]] + lookups.unit_labels.num + '<br>' +
								'(' + d3.format(',')(d3.round(find_risk_sbar_value(e, settings['age_' + c], settings['year_' + c], settings['geo_' + c], settings['sex_' + c], 'rate', settings['metric_' + c]))) + lookups.unit_labels.num + ' people)'
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
			
		// show/hide back button
			risk_back_button[c].attr('visibility', settings['risk_cat_' + c] != 'summary' ? 'visible' : 'hidden');
		
		// update label rectangles
			// remove old rectangles
				risk_sbar_label_rects[c].remove();
			// redraw the rectangles
				risk_sbar_label_rects[c] = d3.select('#sbar_' + c).selectAll('risk_label_rects')
					.data(risk_y_domain[c])
				  .enter().append('rect')
					.attr('x', 0)
					.attr('width', risk_left_pad)
					.attr('y', function(d) { return risk_y_scale[c](d) - risk_bar_thickness[c]/2; })
					.attr('height', risk_bar_thickness[c])
					.attr('class', 'risk_label_rect')
					.attr('onclick', function(d) { return settings['risk_cat_' + c] == 'summary' ? 'change_risk_cat("' + risk_lookup[d].risk + '",' + c + ')' : '' })
					.style('cursor', settings['risk_cat_' + c] == 'summary' ? 'pointer' : 'default')
					.attr('title', function(d) { return risk_lookup[d].name; });
			// redraw tooltips
				$('.risk_label_rect').poshytip({
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
	}
/*
// fill in the legend
	var sbar_legend_entries = [
		{ name: 'HIV & TB', 					color: sbar_color_lookup[1] },
		{ name: 'Predominantly in Children', 	color: sbar_color_lookup[2] },
		{ name: 'Other Communicable', 			color: sbar_color_lookup[3] },
		{ name: 'Cancers', 						color: sbar_color_lookup[4] },
		{ name: 'Other Non-Communicable',		color: sbar_color_lookup[5] },
		{ name: 'Cardiovascular',				color: sbar_color_lookup[6] },
		{ name: 'Unintentional Injuries',		color: sbar_color_lookup[7] },
		{ name: 'Intentional Injuries',			color: sbar_color_lookup[8] }
	]
	var sbar_legend_gs = sbar_legend.selectAll('entries')
		.data(sbar_legend_entries)
	  .enter().append('g')
		.attr('transform', function(d,i) { return 'translate(0, ' + (i * (350/sbar_legend_entries.length)) + ')'; });
	sbar_legend_gs.append('rect')
		.attr('width', 20)
		.attr('height', 20)
		.style('stroke', 'none')
		.style('fill', function(d) { return d.color; });
	sbar_legend_gs.append('text')
		.attr('x', 30)
		.attr('y', 15)
		.text(function(d) { return d.name; })
		.attr('class', 'sbar_legend');
*/