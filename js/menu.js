/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		4 January 2012
	Purpose:	Build lefthand menus for GBD tool
*/

// add an accordion to allow for multiple sets of menus
	accordion = menu.append('div')
		.attr('id', 'accordion');

// add the main menu
	accordion.append('h3')
	  .append('a')
		.attr('href', '#')
		.text('Main Menu');
	main_menu = accordion.append('div')
		.attr('class', 'accordion_section');

// add a treemap menu
	accordion.append('h3')
	  .append('a')
		.attr('href', '#')
		.text('Treemap Settings');
	tree_menu = accordion.append('div')
		.attr('class', 'accordion_section');

// add a map menu
	accordion.append('h3')
	  .append('a')
		.attr('href', '#')
		.text('Map Settings');
	map_menu = accordion.append('div')
		.attr('class', 'accordion_section');

// add a stacked bar RF menu
	accordion.append('h3')
	  .append('a')
		.attr('href', '#')
		.text('Stacked Bar Settings');
	sbar_menu = accordion.append('div')
		.attr('class', 'accordion_section');

// turn it into an accordion
	$('#accordion').accordion({ fillSpace: true });

// fill in the main menu
	var menu_font_size = 14,
		menu_row_height = 50,
		menu_label_width = 50,
		menu_row_buffer = 10,
		menu_control_list = [
			{ val: 'A',		offset: 0	},
			{ val: 'B',		offset: .5 	},
			{ val: 'AB',	offset: .25 }
		],
		update_functions = {};
	menu_entries.filter(function(d) {
		 return d.section == 'main';
	}).map(function(e, i) {
		// a label identifying the menu entry, which toggles sync when clicked
			main_menu.append('div')
			  .append('center')
				.attr('id', 'menu_label_' + e.val)
				.attr('onclick', 'toggle_sync("' + e.val + '")')
				.attr('class', 'menu_label')
				.style('top', ((menu_row_height * (i + .5)) - (menu_font_size / 2) + (i * menu_row_buffer)) + 'px')
				.style('font-size', menu_font_size + 'px')
				.style('line-height', menu_font_size + 'px')
				.style('font-style', settings[e.val + '_sync'] ? 'italic' : 'normal')
				.style('width', menu_label_width + 'px')
				.text(e.label);
		// divs for the controls
			menu_control_list.map(function(f) {
				main_menu.append('div')
					.attr('id', 'menu_control_' + e.val + '_' + f.val)
					.attr('class', 'menu_control')
					.style('top', ((menu_row_height * (i + f.offset)) + (i * menu_row_buffer)) + 'px')
					.style('height', (menu_row_height / 2) + 'px')
					.style('width', (menu_width - menu_label_width) + 'px')
					.style('visibility', ((settings[e.val + '_sync'] && f.val == 'AB') || (!settings[e.val + '_sync'] && f.val != 'AB')) ? 'visible' : 'hidden')
					.style('left', menu_label_width + 'px');
			});
	});

// chart selectors
	menu_control_list.map(function(e) {
		var s = d3.select('#menu_control_chart_' + e.val)
				  .append('select')
					.attr('id', 'chart_select_' + e.val)
					.attr('class', 'chart_select_menu')
					.attr('onchange', 'change_chart("' + e.val + '",this.value)');
		s.selectAll()
		  	.data(chart_list)
	  	  .enter().append('option')
	  	  	.attr('id', function(d) { return 'chart_option_' + e.val + '_' + d.val; })
	  	  	.attr('value', function(d) { return d.val; })
	  	  	.text(function(d) { return d.label; });
	  	$('#chart_option_' + e.val + '_' + settings['chart_' + e.val])[0].selected = true;
	  	$('#chart_select_' + e.val).chosen({ disable_search_threshold: 10 });
	});

// update chart selection
	function change_chart(c, val) {
		// store original value (to know which chart to move out)
			var old_chart = {};
			['A', 'B', 'AB'].map(function(d) {
				old_chart[d] = settings['chart_' + d];	
			})

		// update the settings
			update_settings('chart', c, val);
		
		// if the chart changes, swap em
			['A', 'B'].map(function(d) {			
				if (old_chart[d] != settings['chart_' + d]) {
					
				// slide out the old chart (then reset to starting position)
					d3.select('#' + old_chart[d] + '_' + d)
						.transition()
						.duration(1000)
						.attr('transform', 'translate(' + (content_width + 5) + ',' + content_buffer + ')')
						.transition()
						.delay(1010)
						.duration(1)
						.style('visibility', 'hidden')
						.transition()
						.delay(1020)
						.duration(1)
						.attr('transform', 'translate(' + (-1 * content_width - 5) + ',' + content_buffer + ')')
						.transition()
						.delay(1030)
						.duration(1)
						.style('visibility', 'visible');
				
				// slide in the new chart
					d3.select('#' + settings['chart_' + d] + '_' + d)
						.transition()
						.duration(1000)
						.attr('transform', 'translate(' + content_buffer + ',' + content_buffer + ')')
						
				// make sure they're all up to date
					update_charts(c);
				}
			});
	}
	update_functions['chart'] = change_chart;

// geo selectors
	menu_control_list.map(function(e) {
		var s = d3.select('#menu_control_geo_' + e.val)
				  .append('select')
					.attr('id', 'geo_select_' + e.val)
					.attr('class', 'select_menu')
					.attr('onchange', 'change_geo("' + e.val + '",this.value)');
		s.selectAll()
		  	.data(geo_list)
	  	  .enter().append('option')
	  	  	.attr('id', function(d) { return 'geo_option_' + e.val + '_' + d.code; })
	  	  	.attr('value', function(d) { return d.code; })
	  	  	.text(function(d) { return d.name; })
	  	  	.style('font-weight', function(d) { return (d.code.substr(0,3) == 'SR_' || d.code == 'G' || d.code.substr(0,2) == 'R_' || d.code == 'D0' || d.code == 'D1') ? 'bold' : 'normal'; })
	  	  	.style('margin-left', function(d) { return (d.code.substr(0,3) == 'SR_' || d.code == 'G') ? '0px' : ((d.code.substr(0,2) == 'R_' || d.code == 'D0' || d.code == 'D1') ? '5px' : '10px'); })
	  	$('#geo_option_' + e.val + '_' + settings['geo_' + e.val])[0].selected = true;
	  	$('#geo_select_' + e.val).chosen();
	});

// update geo selection
	function change_geo(c, val) {
		// update the settings
			update_settings('geo', c, val);
		// update the charts
			update_charts(c);
	}
	update_functions['geo'] = change_geo;

// add cause selectors
	menu_control_list.map(function(e) {
		var s = d3.select('#menu_control_cause_' + e.val)
				  .append('select')
					.attr('id', 'cause_select_' + e.val)
					.attr('class', 'select_menu')
					.attr('onchange', 'change_cause("' + e.val + '",this.value)');
		s.selectAll()
		  	.data(cause_list)
	  	  .enter().append('option')
	  	  	.attr('id', function(d) { return 'cause_option_' + e.val + '_' + d.cause_viz; })
	  	  	.attr('value', function(d) { return d.cause_viz; })
	  	  	.text(function(d) { return d.cause == 'Total' ? d.cause_name : d.cause + '. ' + d.cause_name; })
	  	  	.style('font-weight', function(d) { return (d.cause_viz.match(/_/g) == null ? 0 : d.cause_viz.match(/_/g).length) <= 2 ? 'bold' : 'normal'; })
	  	  	.style('margin-left', function(d) { return ((d.cause_viz.match(/_/g) == null ? 0 : d.cause_viz.match(/_/g).length) * 5) + 'px'; })
	  	$('#cause_option_' + e.val + '_' + settings['cause_' + e.val])[0].selected = true;
	  	$('#cause_select_' + e.val).chosen();
	});

// update cause selection
	function change_cause(c, val) {
		// update the settings
			update_settings('cause', c, val);
		// update the charts
			update_charts(c);		
	}
	update_functions['cause'] = change_cause;

// load in list of years
	if (use_mysql) {
		$.ajax({
			url: 'php/year_list.php',
			dataType: 'json',
			async: false,
			success: function(json) {
			// save year list
				year_list = json;
			}
		});
	}
	else {
		$.ajax({
			url: 'data/parameters/year_list.csv',
			dataType: 'text',
			async: false,
			success: function(csv) {
				year_list = d3.csv.parse(csv);
			}
		});	
	}
// create year lookup
	lookups['year'] = {};
	lookups['reverse_year'] = {};
	year_list.map(function(y) {
		lookups['year'][y.year_viz] = y.year_name;
		lookups['reverse_year'][y.year_name] = parseInt(y.year_viz);
	});
// add year sliders
	menu_control_list.map(function(e) {
		var s = d3.select('#menu_control_year_' + e.val);
		s.append('div')
			.attr('id', 'year_slider_' + e.val);
		$('#year_slider_' + e.val).slider({
			min: d3.min(year_list, function(d) { return parseInt(d.year_viz); }),
			max: d3.max(year_list, function(d) { return parseInt(d.year_viz); }),
			animate: true,
			value: settings['year_' + e.val],
			slide: function(event, ui) {
				change_year(e.val, ui.value);
			}
		});
		s.append('div')
		  	.attr('class', 'slider_label')
		  .append('center')
			.attr('id', 'year_label_' + e.val)
			.text(lookups['year'][settings['year_' + e.val]]);
	});

// update year
	function change_year(c, val) {
		// update the settings
			update_settings('year', c, val);
		// update the charts
			update_charts(c);
	}
	update_functions['year'] = change_year;

// load in list of ages
	if (use_mysql) {
		$.ajax({
			url: 'php/age_list.php',
			dataType: 'json',
			async: false,
			success: function(json) {
			// save age list
				age_list = json;
			}
		});	
	}
	else {
		$.ajax({
			url: 'data/parameters/age_list.csv',
			dataType: 'text',
			async: false,
			success: function(csv) {
				age_list = d3.csv.parse(csv);
			}
		});	
	}
// create age lookup
	lookups['age'] = {};
	lookups['reverse_age'] = {};
	age_list.map(function(a) {
		lookups['age'][a.age_viz] = a.age_name;
		lookups['reverse_age'][a.age_axis] = parseInt(a.age_viz);
	});
// add age sliders
	menu_control_list.map(function(e) {
		var s = d3.select('#menu_control_age_' + e.val);
		s.append('div')
			.attr('id', 'age_slider_' + e.val);
		$('#age_slider_' + e.val).slider({
			min: d3.min(age_list, function(d) { return parseInt(d.age_viz); }),
			max: d3.max(age_list, function(d) { return parseInt(d.age_viz); }),
			animate: true,
			value: settings['age_' + e.val],
			slide: function(event, ui) {
				change_age(e.val, ui.value);
			}
		});
		s.append('div')
		  	.attr('class', 'slider_label')
		  .append('center')
			.attr('id', 'age_label_' + e.val)
			.text(lookups['age'][settings['age_' + e.val]]);
	});

// update age
	function change_age(c, val) {
		// update the settings
			update_settings('age', c, val);
		// update the charts
			update_charts(c);
	}
	update_functions['age'] = change_age;

// buttons for sex
	menu_control_list.map(function(e) {
		var s = d3.select('#menu_control_sex_' + e.val)
				  .append('form')
					.attr('id', 'sex_radio_' + e.val);
		[{ val: 'M', name: 'Male' },
		 { val: 'F', name: 'Female' }].map(function(d) {
			 s.append('input')
				.attr('type', 'radio')
				.attr('name', 'sex_radio_' + e.val)
				.attr('class', 'sex_radio_' + e.val)
				.attr('id', 'sex_radio_' + d.val + '_' + e.val)
				.attr('value', d.val)
				.attr(settings['sex_' + e.val] == d.val ? 'checked' : 'ignoreme', 'true');
			s.append('label')
				.attr('for', 'sex_radio_' + d.val + '_' + e.val)
				.text(d.name);
		 });
		 $('#sex_radio_' + e.val).buttonset()
		 	.css('margin-left', '20px')
		 	.change(function() { change_sex(e.val, $('.sex_radio_' + e.val + ':checked').val()); });
	});

// change sexes
	function change_sex(c, val) {
		// update the settings
			update_settings('sex', c, val);
		// update the charts
			update_charts(c);
	}
	update_functions['sex'] = change_sex;

// metric selectors
	menu_control_list.map(function(e) {
		var s = d3.select('#menu_control_metric_' + e.val)
				  .append('select')
					.attr('id', 'metric_select_' + e.val)
					.attr('class', 'metric_select_menu')
					.attr('onchange', 'change_metric("' + e.val + '",this.value)');
		s.selectAll()
		  	.data(metric_list)
	  	  .enter().append('option')
	  	  	.attr('id', function(d) { return 'metric_option_' + e.val + '_' + d.val; })
	  	  	.attr('value', function(d) { return d.val; })
	  	  	.text(function(d) { return d.label; });
	  	$('#metric_option_' + e.val + '_' + settings['metric_' + e.val])[0].selected = true;
	  	$('#metric_select_' + e.val).chosen({ disable_search_threshold: 10 });
	});

// update metrics
	function change_metric(c, val) {
		// update the settings
			update_settings('metric', c, val);
		// update the charts
			update_charts(c);
	}
	update_functions['metric'] = change_metric;

// buttons for units
	menu_control_list.map(function(e) {
		var s = d3.select('#menu_control_unit_' + e.val)
				  .append('form')
					.attr('id', 'unit_radio_' + e.val);
		[{ val: 'num', name: '#' },
		 { val: 'rate', name: 'Rate' },
		 { val: 'prop', name: '%' }].map(function(d) {
			 s.append('input')
				.attr('type', 'radio')
				.attr('name', 'unit_radio_' + e.val)
				.attr('class', 'unit_radio_' + e.val)
				.attr('id', 'unit_radio_' + d.val + '_' + e.val)
				.attr('value', d.val)
				.attr(settings['unit_' + e.val] == d.val ? 'checked' : 'ignoreme', 'true');
			s.append('label')
				.attr('for', 'unit_radio_' + d.val + '_' + e.val)
				.text(d.name);
		 });
		 $('#unit_radio_' + e.val).buttonset()
		 	.css('margin-left', '24px')
		 	.change(function() { change_unit(e.val, $('.unit_radio_' + e.val + ':checked').val()); });
	});

// change units
	function change_unit(c, val) {
		// update the settings
			update_settings('unit', c, val);
		// update the charts
			update_charts(c);
	}
	update_functions['unit'] = change_unit;
	
	
	
	
// bug report button
	main_menu.append('div')
		.style('top', '480px')
		.style('position', 'absolute')
		.style('width', '250px')
  	  .append('center')
	  	.attr('onclick', 'bug_email()')
  		.attr('class', 'bug_report')
	  	.text('Submit Bug Report');
	function bug_email() {
		var mailto = "mailto:kfor@uw.edu?subject=GBDx Bug Report&body=Dear Kyle,%0A%0AI have angered the benevolent GBDx gods in the following ways:%0A[Describe the bug you've encountered here]%0A%0A[Insert screenshot here]%0A%0ACurrent settings:%0A" + JSON.stringify(sort_keys(settings), null, '%0A');
		win = window.open(mailto, 'emailWindow');
		if (win && win.open &&!win.closed) win.close();
	}
	function sort_keys(o) {
 		var sorted = {},
    		key, a = [];
	    for (key in o) if (o.hasOwnProperty(key)) a.push(key);
	    a.sort();
	    for (key = 0; key < a.length; key++) sorted[a[key]] = o[a[key]];
    	return sorted;
	}
	


// fill in the treemap menu
	menu_entries.filter(function(d) {
		 return d.section == 'tree';
	}).map(function(e, i) {
		// a label identifying the menu entry, which toggles sync when clicked
			tree_menu.append('div')
			  .append('center')
				.attr('id', 'menu_label_' + e.val)
				.attr('onclick', 'toggle_sync("' + e.val + '")')
				.attr('class', 'menu_label')
				.style('top', ((menu_row_height * (i + .5)) - (menu_font_size / 2) + (i * menu_row_buffer)) + 'px')
				.style('font-size', menu_font_size + 'px')
				.style('line-height', menu_font_size + 'px')
				.style('font-style', settings[e.val + '_sync'] ? 'italic' : 'normal')
				.style('width', menu_label_width + 'px')
				.text(e.label);
		// divs for the controls
			menu_control_list.map(function(f) {
				tree_menu.append('div')
					.attr('id', 'menu_control_' + e.val + '_' + f.val)
					.attr('class', 'menu_control')
					.style('top', ((menu_row_height * (i + f.offset)) + (i * menu_row_buffer)) + 'px')
					.style('height', (menu_row_height / 2) + 'px')
					.style('width', (menu_width - menu_label_width) + 'px')
					.style('visibility', ((settings[e.val + '_sync'] && f.val == 'AB') || (!settings[e.val + '_sync'] && f.val != 'AB')) ? 'visible' : 'hidden')
					.style('left', menu_label_width + 'px');
			});
	});
	
// add depth selector for treemaps
	max_tree_depth = d3.max(cause_list, function(d) { return d.cause_viz.match(/_/g) ? d.cause_viz.match(/_/g).length + 1 : 0 });
	lookups['tree_depth'] = {};
	d3.range(max_tree_depth - 1).map(function(d) {
		lookups['tree_depth'][d+1] = (d+1);
	});
	menu_control_list.map(function(e) {
		var s = d3.select('#menu_control_tree_depth_' + e.val);
		s.append('div')
			.attr('id', 'tree_depth_slider_' + e.val);
		$('#tree_depth_slider_' + e.val).slider({
			min: 1,
			max: max_tree_depth - 1,
			animate: true,
			value: settings['tree_depth_' + e.val],
			slide: function(event, ui) {
				//change_tree_depth(e.val, ui.value);
				update_settings('tree_depth', e.val, ui.value);
				if (e.val=='AB') {
					refresh_treemap('A');
					refresh_treemap('B');
				}
				else refresh_treemap(e.val);			
			}
		});
		s.append('div')
		  	.attr('class', 'slider_label')
		  .append('center')
			.attr('id', 'tree_depth_label_' + e.val)
			.text(lookups['tree_depth'][settings['tree_depth_' + e.val]]);
	});

// update tree depth
	function change_tree_depth(c, val) {
		// update the settings
			update_settings('tree_depth', c, val);
		// change visibility of treemap layers
			if (c=='AB') {
				refresh_treemap('A');
				refresh_treemap('B');
			}
			else refresh_treemap(c);
			//update_charts(c);
	}
	update_functions['tree_depth'] = change_tree_depth;
	
// treemap color scale selector	
	menu_control_list.map(function(e) {
		var s = d3.select('#menu_control_tree_color_' + e.val)
				  .append('select')
					.attr('id', 'tree_color_select_' + e.val)
					.attr('class', 'tree_color_select_menu')
					.attr('onchange', 'change_tree_color("' + e.val + '",this.value)');
		s.selectAll()
		  	.data(tree_color_options)
	  	  .enter().append('option')
	  	  	.attr('id', function(d) { return 'tree_color_option_' + e.val + '_' + d.val; })
	  	  	.attr('value', function(d) { return d.val; })
	  	  	.text(function(d) { return d.label; });
	  	$('#tree_color_option_' + e.val + '_' + settings['tree_color_' + e.val])[0].selected = true;
	  	$('#tree_color_select_' + e.val).chosen({ disable_search_threshold: 10 });
	});

// update tree colors
	function change_tree_color(c, val) {
		// update the settings
			update_settings('tree_color', c, val);
		// update the charts
			update_charts(c);
	}
	update_functions['tree_color'] = change_tree_color;

// treemap risk selector	
	menu_control_list.map(function(e) {
		var s = d3.select('#menu_control_tree_risk_' + e.val)
				  .append('select')
					.attr('id', 'tree_risk_select_' + e.val)
					.attr('class', 'tree_risk_select_menu')
					.attr('onchange', 'change_tree_risk("' + e.val + '",this.value)');
		s.selectAll()
		  	.data(risk_list)
	  	  .enter().append('option')
	  	  	.attr('id', function(d) { return 'tree_risk_option_' + e.val + '_' + d.risk; })
	  	  	.attr('value', function(d) { return d.risk; })
	  	  	.text(function(d) { return d.risk_name; })
	  	  	.style('font-weight', function(d) { return d.risk_level == 1 ? 'bold' : 'normal'; })
			.style('font-style', function(d) { return d.risk_level == 3 ? 'italic' : 'normal'; })
	  	  	.style('margin-left', function(d) { return ((d.risk_level-1) * 5) + 'px'; });
	  	$('#tree_risk_option_' + e.val + '_' + settings['tree_risk_' + e.val])[0].selected = true;
	  	$('#tree_risk_select_' + e.val).chosen({ disable_search_threshold: 10 });
	});

// update tree risks
	function change_tree_risk(c, val) {
		// update the settings
			update_settings('tree_risk', c, val);
		// update the charts
			update_charts(c);
	}
	update_functions['tree_risk'] = change_tree_risk;
	
	
// fill in the map menu
	menu_entries.filter(function(d) {
		 return d.section == 'map';
	}).map(function(e, i) {
		// a label identifying the menu entry, which toggles sync when clicked
			map_menu.append('div')
			  .append('center')
				.attr('id', 'menu_label_' + e.val)
				.attr('onclick', 'toggle_sync("' + e.val + '")')
				.attr('class', 'menu_label')
				.style('top', ((menu_row_height * (i + .5)) - (menu_font_size / 2) + (i * menu_row_buffer)) + 'px')
				.style('font-size', menu_font_size + 'px')
				.style('line-height', menu_font_size + 'px')
				.style('font-style', settings[e.val + '_sync'] ? 'italic' : 'normal')
				.style('width', menu_label_width + 'px')
				.text(e.label);
		// divs for the controls
			menu_control_list.map(function(f) {
				map_menu.append('div')
					.attr('id', 'menu_control_' + e.val + '_' + f.val)
					.attr('class', 'menu_control')
					.style('top', ((menu_row_height * (i + f.offset)) + (i * menu_row_buffer)) + 'px')
					.style('height', (menu_row_height / 2) + 'px')
					.style('width', (menu_width - menu_label_width) + 'px')
					.style('visibility', ((settings[e.val + '_sync'] && f.val == 'AB') || (!settings[e.val + '_sync'] && f.val != 'AB')) ? 'visible' : 'hidden')
					.style('left', menu_label_width + 'px');
			});
	});

// map level selector	
	menu_control_list.map(function(e) {
		var s = d3.select('#menu_control_map_level_' + e.val)
				  .append('select')
					.attr('id', 'map_level_select_' + e.val)
					.attr('class', 'map_level_select_menu')
					.attr('onchange', 'change_map_level("' + e.val + '",this.value)');
		s.selectAll()
		  	.data(map_level_options)
	  	  .enter().append('option')
	  	  	.attr('id', function(d) { return 'map_level_option_' + e.val + '_' + d.val; })
	  	  	.attr('value', function(d) { return d.val; })
	  	  	.text(function(d) { return d.label; });
	  	$('#map_level_option_' + e.val + '_' + settings['map_level_' + e.val])[0].selected = true;
	  	$('#map_level_select_' + e.val).chosen({ disable_search_threshold: 10 });
	});

// update map level
	function change_map_level(c, val) {
		// update the settings
			update_settings('map_level', c, val);
		// update the charts
			update_charts(c);
	}
	update_functions['map_level'] = change_map_level;


// fill in the sbar menu
	menu_entries.filter(function(d) {
		 return d.section == 'sbar';
	}).map(function(e, i) {
		// a label identifying the menu entry, which toggles sync when clicked
			sbar_menu.append('div')
			  .append('center')
				.attr('id', 'menu_label_' + e.val)
				.attr('onclick', 'toggle_sync("' + e.val + '")')
				.attr('class', 'menu_label')
				.style('top', ((menu_row_height * (i + .5)) - (menu_font_size / 2) + (i * menu_row_buffer)) + 'px')
				.style('font-size', menu_font_size + 'px')
				.style('line-height', menu_font_size + 'px')
				.style('font-style', settings[e.val + '_sync'] ? 'italic' : 'normal')
				.style('width', menu_label_width + 'px')
				.text(e.label);
		// divs for the controls
			menu_control_list.map(function(f) {
				sbar_menu.append('div')
					.attr('id', 'menu_control_' + e.val + '_' + f.val)
					.attr('class', 'menu_control')
					.style('top', ((menu_row_height * (i + f.offset)) + (i * menu_row_buffer)) + 'px')
					.style('height', (menu_row_height / 2) + 'px')
					.style('width', (menu_width - menu_label_width) + 'px')
					.style('visibility', ((settings[e.val + '_sync'] && f.val == 'AB') || (!settings[e.val + '_sync'] && f.val != 'AB')) ? 'visible' : 'hidden')
					.style('left', menu_label_width + 'px');
			});
	});

// update the categories for the risk bars
	function change_sbar_cat(c, val) {
		// update the settings
			update_settings('sbar_cat', c, val);
		// update the charts
			update_charts(c);
	}
	update_functions['sbar_cat'] = change_sbar_cat;

// risk category selector	
	menu_control_list.map(function(e) {
		var s = d3.select('#menu_control_sbar_cat_' + e.val)
				  .append('select')
					.attr('id', 'sbar_cat_select_' + e.val)
					.attr('class', 'sbar_cat_select_menu')
					.attr('onchange', 'change_sbar_cat("' + e.val + '",this.value)');
		s.append('option')
			.attr('id', 'sbar_cat_option_' + e.val + '_summary')
			.attr('value', 'summary')
			.text('Summary (Categories)');
		s.selectAll()
		  	.data(risk_list.filter(function(d) { return d.risk_level == 1; }))
	  	  .enter().append('option')
	  	  	.attr('id', function(d) { return 'sbar_cat_option_' + e.val + '_' + d.risk; })
	  	  	.attr('value', function(d) { return d.risk; })
	  	  	.text(function(d) { return d.risk_name; });
	  	$('#sbar_cat_option_' + e.val + '_' + settings['sbar_cat_' + e.val])[0].selected = true;
	  	$('#sbar_cat_select_' + e.val).chosen();
	});

// buttons for sbar units
	menu_control_list.map(function(e) {
		var s = d3.select('#menu_control_sbar_unit_' + e.val)
				  .append('form')
					.attr('id', 'sbar_unit_radio_' + e.val);
		[{ val: 'num', name: '#' },
		 { val: 'rate', name: 'Rate' }].map(function(d) {
			 s.append('input')
				.attr('type', 'radio')
				.attr('name', 'sbar_unit_radio_' + e.val)
				.attr('class', 'sbar_unit_radio_' + e.val)
				.attr('id', 'sbar_unit_radio_' + d.val + '_' + e.val)
				.attr('value', d.val)
				.attr(settings['sbar_unit_' + e.val] == d.val ? 'checked' : 'ignoreme', 'true');
			s.append('label')
				.attr('for', 'sbar_unit_radio_' + d.val + '_' + e.val)
				.text(d.name);
		 });
		 $('#sbar_unit_radio_' + e.val).buttonset()
		 	.css('margin-left', '44px')
		 	.change(function() { change_sbar_unit(e.val, $('.sbar_unit_radio_' + e.val + ':checked').val()); });
	});

// change units
	function change_sbar_unit(c, val) {
		// update the settings
			update_settings('sbar_unit', c, val);
		// update the charts
			update_charts(c);
	}
	update_functions['sbar_unit'] = change_sbar_unit;


// function to choose the correct value in a select menu
	function update_select(m, c, val) {
		$('#' + m + '_option_' + c + '_' + val)[0].selected = true;
		$('#' + m + '_select_' + c).trigger('liszt:updated');
	}

// function to update a slider with a new value and change the associated label
	function update_slider(m, c, val, move) {
		// move slider
			if (move) {
				$('#' + m + '_slider_' + c).slider('option', 'value', val);
			}
		// change label
			d3.select('#' + m + '_label_' + c).text(lookups[m][val]);
	}

// function to update radio buttons
	function update_radio(m, c, val) {
		// update the stored value
			$('#' + m + '_radio_' + val + '_' + c).attr('checked', 'checked');
		// refresh the button
			$('#' + m + '_radio_' + c).buttonset('refresh');
	}
	
// function to change the appropriate values
	function update_settings(m, c, val) {
		// change the appropriate settings
			if (c == 'A') {
				settings[m + '_A'] = val;
				settings[m + '_AB'] = val;
			}
			else if (c == 'B') {
				settings[m + '_B'] = val;
			}
			else if (c == 'AB') {
				settings[m + '_A'] = val;
				settings[m + '_B'] = val;
				settings[m + '_AB'] = val;
			}
		// update the appropriate controls
			menu_control_list.map(function(e) {
				if (menu_entries.filter(function(d) { return d.val == m })[0].type == 'select') {
					update_select(m, e.val, settings[m + '_' + e.val]);
				}
				if (menu_entries.filter(function(d) { return d.val == m })[0].type == 'slider') {
					update_slider(m, e.val, settings[m + '_' + e.val], c != e.val);
				}
				if (menu_entries.filter(function(d) { return d.val == m})[0].type == 'radio') {
					update_radio(m, e.val, settings[m + '_' + e.val]);
				}
			});
	}

// toggle if the menu option is synced between charts or not
	function toggle_sync(m) {
		// flip the switch
			settings[m + '_sync'] = !settings[m + '_sync'];
		
		// update the menu
			d3.select('#menu_label_' + m).style('font-style', settings[m + '_sync'] ? 'italic' : 'normal');
			d3.select('#menu_control_' + m + '_A').style('visibility', settings[m + '_sync'] ? 'hidden' : 'visible');
			d3.select('#menu_control_' + m + '_B').style('visibility', settings[m + '_sync'] ? 'hidden' : 'visible');
			d3.select('#menu_control_' + m + '_AB').style('visibility', settings[m + '_sync'] ? 'visible' : 'hidden');
		
		// if switching to synced mode, match B to A
			if (settings[m + '_sync']) {
				update_functions[m]('B', settings[m + '_AB']);
				if (menu_entries.filter(function(d) { return d.val == m; })[0].type == 'slider')update_slider(m, 'B', settings[m + '_AB'], true);
			}
	}
	
// update the charts
	function update_charts(c) {
		if (c == 'AB') {
			AB.map(function(e) {
				refresh_treemap(e);
				refresh_map(e);
				refresh_time_age(e);
				refresh_sbar(e);
			});		
		}
		else {
			refresh_treemap(c);
			refresh_map(c);
			refresh_time_age(c);
			refresh_sbar(c);
		}
	}
