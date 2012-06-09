/*	Author: 	Kyle Foreman (kforeman@post.harvard.edu)
	Date:		3 June 2012
	Purpose:	Build menus for GBD tool, store internal settings
*/

// layout parameters
	var menu_width = 250,
		content_width = 725,
		height = 725;
		
// list all the menu elements
	var menu_elements = [
		{	name: 'Chart Type',	val: 'chart',	type:	'select',	visible: { map: true, treemap: true, sbar: true, time_age: true, table: true, risks: true, causes: true }	},
		{	name: 'Display',val: 'display',	type:	'select',	visible: { map: true, treemap: false, sbar: false, time_age: true, table: true, risks: true, causes: true }},
		{	name: 'Metric',	val: 'metric',	type:	'select',	visible: { map: true, treemap: true, sbar: true, time_age: true, table: true, risks: true, causes: true }	},
		{	name: 'Place',	val: 'geo',		type:	'select',	visible: { map: true, treemap: true, sbar: true, time_age: true, table: true, risks: true, causes: true }	},
		{	name: 'Cause of Death or Morbidity',	val: 'cause',	type:	'select',	visible: { map: true, treemap: true, sbar: false, time_age: true, table: true, risks: false, causes: true }	},
		{	name: 'Risk Factor',	val: 'risk',	type:	'select',	visible: { map: true, treemap: false, sbar: false, time_age: true, table: true, risks: true, causes: false }	},
		{	name: 'Risk Factor Category',	val: 'risk_cat',	type:	'select',	visible: { map: false, treemap: false, sbar: true, time_age: false, table: false, risks: true, causes: true }	},
		{	name: 'Year',	val: 'year',	type:	'slider',	visible: { map: true, treemap: true, sbar: true, time_age: true, table: true, risks: true, causes: true }	},
		{	name: 'Age',	val: 'age',		type:	'slider',	visible: { map: true, treemap: true, sbar: true, time_age: true, table: true, risks: true, causes: true }	},
		{	name: 'Sex',	val: 'sex',		type:	'radio',	visible: { map: true, treemap: true, sbar: true, time_age: true, table: true, risks: true, causes: true }	},
		{	name: 'Units',	val: 'unit',	type:	'radio',	visible: { map: true, treemap: false, sbar: true, time_age: true, table: true, risks: true, causes: true }	},
		{	name: 'Treemap Depth',	val: 'treemap_depth',	type:	'slider',	visible: { map: false, treemap: true, sbar: false, time_age: false, table: false, risks: true, causes: true }	},
		{	name: 'Treemap Color Scale',	val: 'treemap_color',	type:	'select',	visible: { map: false, treemap: true, sbar: false, time_age: false, table: false, risks: true, causes: true }	},
		{	name: 'Mapping Level',	val: 'map_level',	type:	'select',	visible: { map: true, treemap: false, sbar: false, time_age: false, table: false, risks: true, causes: true }	},
		{	name: 'Bar Order',	val: 'sbar_sort',	type:	'radio',	visible: { map: false, treemap: false, sbar: true, time_age: false, table: false, risks: true, causes: true }	}
	];
		
// load default settings
	var settings = {
		// number of charts to display (1 or 2)
			num_charts:			1,
		// what type of chart (treemap, map, etc)
			chart_sync:			false,
			chart_1:			'treemap',
			chart_2:			'map',
		// risk factors or causes?
			display_sync:		true,
			display_0:			'causes',
		// metric (dalys, deaths, etc)
			metric_sync:		true,
			metric_0:			'daly',
		// the "place" (a country, region, etc)
			geo_sync:			true,
			geo_0:				'G',
		// cause of death/morbidity
			cause_sync:			true,
			cause_0:			'A',
		// risk factor
			risk_sync:			true,
			risk_0:				'alcohol_eg',
		// risk category (for the stacked bars)
			risk_cat_sync:		true,
			risk_cat_0:			'summary',
		// year (in 1, 2, 3, etc format)
			year_sync:			true,
			year_0:				3,
		// age (in 1, 2, 3, etc format)
			age_sync:			true,
			age_0:				22,
		// sex (B/M/F)
			sex_sync:			true,
			sex_0:				'M',
		// units (proportion, rate, number)
			unit_sync:			true,
			unit_0:				'rate',
		// treemap depth (number of levels to show)
			treemap_depth_sync:	true,
			treemap_depth_0:	3,
		// treemap color scale (rate of change, risk factors, proportion)
			treemap_color_sync:	true,
			treemap_color_0:	'change',
		// geographic level (map by country, region, or super region)
			map_level_sync:		true,
			map_level_0:		'C',
		// stacked bar sort order (rank or alphabetic)
			sbar_sort_sync:		true,
			sbar_sort_0:		'rank'
	};

// fill in the rest of the defaults
	menu_elements.forEach(function(m) {
		if (settings[m.val + '_sync']) {
			settings[m.val + '_1'] = settings[m.val + '_0'];
			settings[m.val + '_2'] = settings[m.val + '_0'];
		}
		else {
			settings[m.val + '_0'] = settings[m.val + '_1'];
		}
	});

// if there are settings saved into the hash, replace the defaults with them
	if (window.location.hash.substr(0,12) == '#mysettings=') {
		eval(window.location.hash.substr(1));
		window.location.hash = '';
		for (var p in mysettings) {
			settings[p] = mysettings[p];
		}
	}

// add a div along the top for the menu bar
	var top_menu_div = d3.select('html').append('body').append('div')
			.attr('id', 'top_menu_div')
		  .append('div')
			.style('width', (menu_width + content_width - 20) + 'px');

// put the logo in the upper left corner
	top_menu_div.append('img')
		.attr('src', 'resources/green_logo.jpg')

// add a settings button in the right corner
	top_menu_div.append('button')
		.attr('id', 'settings_button')
		.attr('class', 'top_menu_button')
		.text('Settings');
	$('#settings_button').button({ icons : { primary: 'ui-icon-gear' } });

// add a "presets" button in the upper right corner
	top_menu_div.append('button')
		.attr('id', 'presets_button')
		.attr('class', 'top_menu_button')
		.text('Stories');
	$('#presets_button').button({ icons : { primary: 'ui-icon-star' } });

// add a sharing button in the right corner
	top_menu_div.append('button')
		.attr('id', 'sharing_button')
		.attr('class', 'top_menu_button')
		.text('Sharing')
	$('#sharing_button').button({ icons: { primary: 'ui-icon-person' } });

// show/hide the sharing menu when the button is clicked
	var sharing_menu_open = false;
	$('#sharing_button').click(
		function() { 
			// update the bitly link
				bitlify(); 
			// if the settings or preset menu is open, close it
				if (settings_menu_open) $('#settings_menu').dialog('close');
				if (presets_menu_open) $('#presets_menu').dialog('close');
			// toggle the menu's visibility
				$('#sharing_menu').dialog(sharing_menu_open ? 'close' : 'open');
		}
	);

// build sharing menu
	// div to hold everything
		var sharing_menu = d3.select('body').append('div')
			.attr('class', 'dialog_menu')
			.attr('id', 'sharing_menu');
	// a title for the bitly link
		sharing_menu.append('span')
			.text('Link to this graph:');
	// the bitly link (highlightable)
		sharing_menu.append('br');
		sharing_menu.append('input')
			.attr('type', 'text')
			.attr('id', 'bitly_link');
	// email button
		sharing_menu.append('br');
		sharing_menu.append('br');
		sharing_menu.append('a')
			.attr('id', 'email_button')
			.attr('href', 'mailto:?subject=GBD Graphs')
			.text('Email')
		$('#email_button').button({ icons: { primary: 'ui-icon-mail-closed'} });
	// share on facebook
		sharing_menu.append('br');
		sharing_menu.append('br');
		sharing_menu.append('span')
			.text('Share on Facebook');
	// share on twitter
		sharing_menu.append('br');
		sharing_menu.append('span')
			.text('Share on Twitter');
	// share on Google+
		sharing_menu.append('br');
		sharing_menu.append('span')
			.text('Share on Google+');
	// turn into a dialog
		$('#sharing_menu').dialog({ 
			title: 'Sharing', 
			autoOpen: false,
			close:	function() { sharing_menu_open = false; },
			open:	function() { sharing_menu_open = true; }
		});

// function to create a short URL using bit.ly
// NOTE: for public launch, create an IHME account and then wrap this up in some php or something so that the API key is not public
	function bitlify() {
		$.ajax({
			url: 		'https://api-ssl.bitly.com/v3/shorten?callback=?',
			dataType:	'json',
			data: 		{
				format:	'json',
				apiKey:	'R_87ad5505fbe94d0cc78b0964dc48e573',
				login:	'kyleforeman',
				longUrl:	encodeURI(window.location.origin + window.location.pathname + '#mysettings=' + JSON.stringify(settings))
			},
			async:		false,
			success: 	function(response) {
				$('#bitly_link').attr('value', response.data.url).select();
				$('#email_button').attr('href', encodeURI('mailto:?subject=GBD Graphs&body=Check out these graphs from the Global Burden of Disease: ' + response.data.url));
			}
		});
	}

// show/hide the settings menu when the button is clicked
	var settings_menu_open = false;
	$('#settings_button').click(
		function() { 
			// if the sharing or presets menu is open, close it
				if (sharing_menu_open) $('#sharing_menu').dialog('close');
				if (presets_menu_open) $('#presets_menu').dialog('close');
			// toggle the menu's visibility
				$('#settings_menu').dialog(settings_menu_open ? 'close' : 'open');
		}
	);

// build settings menu
	// div to hold everything
		var settings_menu = d3.select('body').append('div')
			.attr('class', 'dialog_menu')
			.attr('id', 'settings_menu');
	// title for number of graphs
		settings_menu.append('span')
			.text('Number of charts');
		settings_menu.append('br');
	// radio buttons for 1 vs 2 charts
		var num_charts_radio = settings_menu.append('form')
			.attr('id', 'num_charts_radio');
		[1, 2].forEach(function(n) {
			num_charts_radio.append('input')
				.attr('type', 'radio')
				.attr('name', 'num_charts_radio')
				.attr('id', 'num_charts_radio_' + n)
				.attr('onclick', 'change_num_charts(value)')
				.attr('value', n);
			num_charts_radio.append('label')
				.attr('for', 'num_charts_radio_' + n)
				.text(n);
		});
		$('#num_charts_radio_' + settings.num_charts)[0].checked = true;
		$('#num_charts_radio').buttonset();
	// function for responding to radio events
		function change_num_charts(new_num_charts) {
			// save the setting
				settings.num_charts = parseInt(new_num_charts);
			// change the side menu
				toggle_tabs(settings.num_charts);
			// show/hide the split screen line
				split_screen_line.transition().delay((settings.num_charts - 1) * 1000).duration(1000).style('stroke-opacity', settings.num_charts - (1 - 1e-5));
			// toggle chart visibility
				toggle_chart_visibility();
			// update the charts
				update_charts(0, 'num_charts');
		}
	// turn into a dialog
		$('#settings_menu').dialog({ 
			title: 'Settings', 
			autoOpen: false,
			close:	function() { settings_menu_open = false; },
			open:	function() { settings_menu_open = true; }
		});

// show/hide the presets menu when the button is clicked
	var presets_menu_open = false;
	$('#presets_button').click(
		function() { 
			// if the sharing or settings menu is open, close it
				if (sharing_menu_open) $('#sharing_menu').dialog('close');
				if (settings_menu_open) $('#settings_menu').dialog('close');
			// toggle the menu's visibility
				$('#presets_menu').dialog(presets_menu_open ? 'close' : 'open');
		}
	);

// build presets menu
	// div to hold everything
		var presets_menu = d3.select('body').append('div')
			.attr('class', 'dialog_menu')
			.attr('id', 'presets_menu');
		presets_menu.append('div').text('Soon this menu will be used for people to navigate specific stories, scenarios, etc. It will have a description and then a button to change the charts to a specific configuration. For instance, there could be one to compare Developed vs Developing treemaps, another to show maps of Communicable vs NCDs, and another to show risk factor rankings for males vs females.')
	/*
	// title for number of graphs
		presets_menu.append('span')
			.text('Number of charts');
		presets_menu.append('br');
	// radio buttons for 1 vs 2 charts
		var num_charts_radio = presets_menu.append('form')
			.attr('id', 'num_charts_radio');
		[1, 2].forEach(function(n) {
			num_charts_radio.append('input')
				.attr('type', 'radio')
				.attr('name', 'num_charts_radio')
				.attr('id', 'num_charts_radio_' + n)
				.attr('onclick', 'change_num_charts(value)')
				.attr('value', n);
			num_charts_radio.append('label')
				.attr('for', 'num_charts_radio_' + n)
				.text(n);
		});
		$('#num_charts_radio_' + settings.num_charts)[0].checked = true;
		$('#num_charts_radio').buttonset();
	// function for responding to radio events
		function change_num_charts(new_num_charts) {
			settings.num_charts = parseInt(new_num_charts);
			toggle_tabs(settings.num_charts);
			split_screen_line.transition().delay((settings.num_charts - 1) * 1000).duration(1000).style('stroke-opacity', settings.num_charts - (1 - 1e-5));
		}
	*/
	// turn into a dialog
		$('#presets_menu').dialog({ 
			title: 'Stories', 
			autoOpen: false,
			close:	function() { presets_menu_open = false; },
			open:	function() { presets_menu_open = true; }
		});

// lower div to contain both side menu and content
	var lower_div = d3.select('body').append('div')
			.attr('id', 'lower_div')
			.style('width', (menu_width + content_width) + 'px')
			.style('height', height + 'px');

// add side menu panel
	var side_menu_panel = lower_div.append('div')
			.attr('id', 'side_menu_panel')
			.style('width', (menu_width - 6) + 'px')
			.style('height', (height - 6) + 'px');
	
// add tabs for each menu element
	var tab_list = ['Menu', 'Top Chart', 'Bottom Chart'],
		tabs = side_menu_panel.append('ul')
			.selectAll('tabs')
			.data(tab_list)
		  .enter().append('li').append('a')
			.attr('href', function(d,i) { return '#tab_' + i; })
			.attr('id', function(d,i) { return 'tab_li_' + i; })
			.text(function(d) { return d; }),
		tab_menus = side_menu_panel
			.selectAll('tab_menus')
			.data(tab_list)
		  .enter().append('div')
			.attr('id', function(d,i) { return 'tab_' + i; });

// keep track of whether each is synced or not
	var menu_synced = {},
		menu_visible = {};
	menu_elements.forEach(function(e) {
		menu_synced[e.val] = false;
		tab_list.forEach(function(t,i) {
			menu_visible[i + '_' + e.val] = true;
		});
	});
	
// add menu elements
	var menu_rows = tab_menus.append('table')
		.attr('class', 'menu_table')
		.selectAll('menu_rows')
		.data(menu_elements)
	  .enter().append('tr')
		.attr('id', function(d,i,p) { return 'menu_row_' + p + '_' + d.val; })
	  .append('table')
		.attr('class', 'menu_subtable');
	var menu_element_titles = menu_rows.append('tr')
	  .append('td')
		.attr('colspan', 2)
	  .append('span')
		.attr('class', 'menu_element_title')
		.text(function(d) { return d.name; });
	var menu_element_control_rows = menu_rows.append('tr');
	var menu_element_locks = menu_element_control_rows.append('td')
		.attr('class', 'menu_lock_td');
	menu_element_locks.append('input')
		.attr('type', 'checkbox')
		.attr('id', function(d,i,p) { return 'lock_' + p + '_' + d.val; })
		.attr('class', 'menu_lock_check');
	menu_element_locks.append('label')
		.style('visibility', function(d,i,p) { return p==0 ? 'hidden' : 'visible'; })
		.attr('for', function(d,i,p) { return 'lock_' + p + '_' + d.val; })
		.attr('title', function(d) { return 'Toggle ' + d.name + ' synchronization'; })
		.attr('class', 'menu_lock_button');
	var menus_012 = [0, 1, 2];
	menu_elements.forEach(function(m) {
		menus_012.forEach(function(i) {
			$('#lock_' + i + '_' + m.val).prop('checked', settings[m.val + '_sync']);
			$('#lock_' + i + '_' + m.val)
				.button({ icons: { primary: settings[m.val + '_sync'] ? 'ui-icon-locked' : 'ui-icon-unlocked' } })
				.click(function() {
					var this_lock = this.id.split('_'),
						p = parseInt(this_lock[1]),
						d = this_lock[2];
					if (this.checked) {
						// set syncing to true
							settings[d + '_sync'] = true;
						// change the icons
							$(this).button('option', 'icons', { primary: 'ui-icon-locked' })
							$('#lock_' + (p == 1 ? 2 : 1) + '_' + d).prop('checked', true).button('option', 'icons', { primary: 'ui-icon-locked' }).button('refresh');
						// change the setting of chart 2 to match that of chart 1
							update_settings(d, settings[d + '_1'], 2);
						// if changing charts, also change visibility
							if (m.val == 'chart') {
								toggle_chart_visibility();
							}
						// redraw chart 2
							update_charts(2, m.val);
					}
					else {
						// set syncing fo false
							settings[d + '_sync'] = false;
						// update the icons
							$(this).button('option', 'icons', { primary: 'ui-icon-unlocked' })
							$('#lock_' + (p == 1 ? 2 : 1) + '_' + d).prop('checked', false).button('option', 'icons', { primary: 'ui-icon-unlocked' }).button('refresh');
					}
				});
		});
	});
	var menu_element_controls = menu_element_control_rows.append('td')
		.attr('id', function(d,i,p) { return 'menu_control_' + p + '_' + d.val; })
		.attr('class', function(d) { return 'menu_control_' + d.val; });

// mark which menu elements are currently displayed
	var visible_menu_elements = {};
	menu_elements.forEach(function(m) {
		menus_012.forEach(function(i) {
			visible_menu_elements[m.val + '_' + i] = true;
		});
	});

// functions to show/hide menu element rows with animated transitions
	function hide_menu_row(i, name) {
		$('#menu_row_' + i + '_' + name)
			.find('td')
			.wrapInner('<div style="display: block;" />')
			.parent()
			.find('td > div')
			.slideUp(400, function() { $(this).children().unwrap(); });
		setTimeout(function() { $('#menu_row_' + i + '_' + name).hide(); }, 400);
	}
	function show_menu_row(i, name) {
		$('#menu_row_' + i + '_' + name).show();
		$('#menu_row_' + i + '_' + name)
			.find('td')
			.wrapInner('<div style="display: none;" />')
			.parent()
			.find('td > div')
			.slideDown(400, function() { $(this).children().unwrap(); });
	}
	
// loop through and set all menu elements to the correct state (displayed or hidden)
	function set_menu_element_visibility() {
		menu_elements.forEach(function(m) {
			menus_012.forEach(function(i) {
				// check whether the element should be displayed or not
					var chart_setting = settings['chart_' + i],
						display_setting = settings['display_' + i],
						should_be_visible = m.visible[chart_setting] && m.visible[display_setting];
				// here are some special exceptions to the "should be visible" rule...
					if (settings['chart_' + i] == 'treemap' && settings['treemap_color_' + i] == 'risk' && m.val == 'risk') should_be_visible = true;					
				// if the current and desired visibility do not align...
					if (should_be_visible != visible_menu_elements[m.val + '_' + i]) { 
						// hide it if it should be hidden
							if (!should_be_visible) hide_menu_row(i, m.val);
						// show it if it should be shown
							else show_menu_row(i, m.val);
						// then update the value
							visible_menu_elements[m.val + '_' + i] = should_be_visible
					}
			});
		})
	}
	set_menu_element_visibility();

// handlers for changing the various menu elements below
	// function to update settings when menu elements are changed
		function update_settings(setting, new_value, chart) {
			// update this chart
				settings[setting + '_' + chart] = new_value;
			// if the charts are synced, update everything
				if (settings[setting + '_sync']) {
					menus_012.forEach(function(i) { 
						settings[setting + '_' + i] = new_value; 
					});
					update_ui(setting, [0,1,2]);
				}
			// if updating chart 0 also update chart 1
				else if (chart == 0) {
					settings[setting + '_1'] = new_value;
					update_ui(setting, [0,1]);
				}
			// and vice versa
				else if (chart == 1) {
					settings[setting + '_0'] = new_value;
					update_ui(setting, [0,1]);
				}
			// also change which options are available for a few select controls
				if (setting == 'chart' || setting == 'display' || setting == 'treemap_color') {
					set_menu_element_visibility();
				}
		}

	// lookup what type of control corresponds to each menu element
		var menu_element_types = {};
		menu_elements.forEach(function(m) {
			menu_element_types[m.val] = m.type;
		});

	// function to update UI elements when changing things that are linked programatically
		function update_ui(setting, charts) {
			switch(menu_element_types[setting]) {
				case 'slider': 	update_sliders(setting, charts); 	break;
				case 'select': 	update_selects(setting, charts); 	break;
				case 'radio':	update_radios(setting, charts);		break;
			}
		}

	// function to update a slider to a new value
		function update_sliders(setting, charts) {
			charts.forEach(function(c) { 
				if ($('#menu_' + setting + '_slider_' + c).slider('option', 'value') != settings[setting + '_' + c]) {
					$('#menu_' + setting + '_slider_' + c).slider('option', 'value', settings[setting + '_' + c]);
				}
			});
		}
	
	// function to choose the correct value in a select menu
		function update_selects(setting, charts) {
			charts.forEach(function(c) {
				if ($('#menu_' + setting + '_select_' + c).val() != settings[setting + '_' + c]) {
					$('#menu_' + setting + '_select_' + c).val(settings[setting + '_' + c]);
					$('#menu_' + setting + '_select_' + c).trigger('liszt:updated');
				}
			})
		}

	// function to update radio buttons
		function update_radios(setting, charts) {
			charts.forEach(function(c) {
				if ($('#menu_' + setting + '_form_' + c).find(':checked').val() != settings[setting + '_' + c]) {
					$('#menu_' + setting + '_form_' + c).find('input').filter('[value="' + settings[setting + '_' + c] + '"]').prop('checked', true);
					$('#menu_' + setting + '_form_' + c).buttonset('refresh');
				}
			})
		}

// add menu controls
	// chart select
		var chart_list = [	
			{ val: 'treemap', 	label: 'Treemap' },
			{ val: 'map', 		label: 'Map' },
			{ val: 'time_age',	label: 'Time/Age Plots' },
			{ val: 'sbar',		label: 'Stacked Bar Chart' }
			//{ val: 'table',		label: 'Table' }
		];
		d3.selectAll('.menu_control_chart')
		  .append('select')
			.attr('onchange', function(d,i) { return 'change_chart(this.value,' + i + ')'; })
			.attr('id', function(d,i) { return 'menu_chart_select_' + i; })
			.style('width', (.85 * menu_width) + 'px')
			.selectAll('options')
			.data(chart_list)
		  .enter().append('option')
			.attr('id', function(d,i,p) { return 'chart_option_' + p + '_' + d.val; })
			.attr('value', function(d) { return d.val; })
			.text(function(d) { return d.label; });
		function change_chart(chart_type, chart) {
			// update the stored settings
				update_settings('chart', chart_type, chart);
			// toggle chart visibility
				toggle_chart_visibility();
			// update the charts
				update_charts(chart, 'chart');
		}
	
	// display select
		var display_list = [
			{ val: 'causes',	label: 'Cause of Death or Morbidity' },
			{ val: 'risks',		label: 'Risk Factor' }
		]
		d3.selectAll('.menu_control_display')
		  .append('select')
			.attr('id', function(d,i) { return 'menu_display_select_' + i; })
			.style('width', (.85 * menu_width) + 'px')
			.attr('onchange', function(d,i) { return 'change_display(this.value,' + i + ')'; })
			.selectAll('options')
			.data(display_list)
		  .enter().append('option')
			.attr('id', function(d,i,p) { return 'display_option_' + p + '_' + d.val; })
			.attr('value', function(d) { return d.val; })
			.text(function(d) { return d.label; });
		function change_display(display, chart) {
			// update the stored settings
				update_settings('display', display, chart);
			// update the charts
				update_charts(chart, 'display');
		}
	
	// metric select
		var metric_list = [
			{ val: 'dth', 		label: 'Deaths',								short: 'Deaths' },
			{ val: 'yll', 		label: 'YLL (Years of Life Lost)',				short: 'YLLs' },
			{ val: 'yld', 		label: 'YLD (Years Lost due to Disability)',	short: 'YLDs' },
			{ val: 'daly', 		label: 'DALY (Disability-Adjusted Life Years)',	short: 'DALYs' }
		];
		lookups['metric_labels'] = {};
		metric_list.forEach(function(m) {
			lookups['metric_labels'][m.val] = m.short;
		});
		d3.selectAll('.menu_control_metric')
		  .append('select')
			.attr('id', function(d,i) { return 'menu_metric_select_' + i; })
			.style('width', (.85 * menu_width) + 'px')
			.attr('onchange', function(d,i) { return 'change_metric(this.value,' + i + ')'; })
			.selectAll('options')
			.data(metric_list)
		  .enter().append('option')
			.attr('id', function(d,i,p) { return 'metric_option_' + p + '_' + d.val; })
			.attr('value', function(d) { return d.val; })
			.text(function(d) { return d.label; });
		function change_metric(metric, chart) {
			// update the stored settings
				update_settings('metric', metric, chart);
			// update the charts
				update_charts(chart, 'metric');
		}

	// geo select
		d3.selectAll('.menu_control_geo')
		  .append('select')
			.attr('id', function(d,i) { return 'menu_geo_select_' + i; })
			.style('width', (.85 * menu_width) + 'px')
			.attr('onchange', function(d,i) { return 'change_geo(this.value,' + i + ')'; })
			.selectAll('options')
			.data(geo_list)
		  .enter().append('option')
			.attr('id', function(d,i,p) { return 'geo_option_' + p + '_' + d.code; })
			.attr('value', function(d) { return d.code; })
			.style('font-weight', function(d) { return (d.code.substr(0,3) == 'SR_' || d.code == 'G' || d.code.substr(0,2) == 'R_' || d.code == 'D0' || d.code == 'D1') ? 'bold' : 'normal'; })
	  	  	.style('margin-left', function(d) { return (d.code.substr(0,3) == 'SR_' || d.code == 'G') ? '0px' : ((d.code.substr(0,2) == 'R_' || d.code == 'D0' || d.code == 'D1') ? '5px' : '10px'); })
			.text(function(d) { return d.name; });
		function change_geo(geo, chart) {
			// update the stored settings
				update_settings('geo', geo, chart);
			// update the charts
				update_charts(chart, 'geo');
		}

	// cause select
		d3.selectAll('.menu_control_cause')
		  .append('select')
			.attr('id', function(d,i) { return 'menu_cause_select_' + i; })
			.style('width', (.85 * menu_width) + 'px')
			.attr('onchange', function(d,i) { return 'change_cause(this.value,' + i + ')'; })
			.selectAll('options')
			.data(cause_list)
		  .enter().append('option')
			.attr('id', function(d,i,p) { return 'cause_option_' + p + '_' + d.cause_viz; })
			.attr('value', function(d) { return d.cause_viz; })
			.style('font-weight', function(d) { return (d.cause_viz.match(/_/g) == null ? 0 : d.cause_viz.match(/_/g).length) <= 2 ? 'bold' : 'normal'; })
	  	  	.style('margin-left', function(d) { return ((d.cause_viz.match(/_/g) == null ? 0 : d.cause_viz.match(/_/g).length) * 5) + 'px'; })
			.text(function(d) { return d.cause == 'Total' ? d.cause_name : d.cause + '. ' + d.cause_name; });
		function change_cause(cause, chart) {
			// update the stored settings
				update_settings('cause', cause, chart);
			// update the charts
				update_charts(chart, 'cause');
		}
	
	// risk factor select
		d3.selectAll('.menu_control_risk')
		  .append('select')
			.attr('id', function(d,i) { return 'menu_risk_select_' + i; })
			.style('width', (.85 * menu_width) + 'px')
			.attr('onchange', function(d,i) { return 'change_risk(this.value,' + i + ')'; })
			.selectAll('options')
			.data(risk_list)
		  .enter().append('option')
			.attr('id', function(d,i,p) { return 'risk_option_' + p + '_' + d.risk; })
			.attr('value', function(d) { return d.risk; })
			.text(function(d) { return d.risk_name; })
	  	  	.style('font-weight', function(d) { return d.risk_level == 1 ? 'bold' : 'normal'; })
			.style('font-style', function(d) { return d.risk_level == 3 ? 'italic' : 'normal'; })
	  	  	.style('margin-left', function(d) { return ((d.risk_level-1) * 5) + 'px'; });
		function change_risk(risk, chart) {
			// update the stored settings
				update_settings('risk', risk, chart);
			// update the charts
				update_charts(chart, 'risk');
		}
	
	// risk factor category select
		d3.selectAll('.menu_control_risk_cat')
		  .append('select')
			.attr('id', function(d,i) { return 'menu_risk_cat_select_' + i; })
			.style('width', (.85 * menu_width) + 'px')
			.attr('onchange', function(d,i) { return 'change_risk_cat(this.value,' + i + ')'; })
			.selectAll('options')
			.data([{ risk: 'summary', risk_name: 'Summary (Categories)' }].concat(risk_list.filter(function(d) { return d.risk_level == 1; })))
	  	  .enter().append('option')
			.attr('id', function(d,i,p) { return 'risk_cat_option_' + p + '_' + d.risk; })
	  	  	.attr('value', function(d) { return d.risk; })
	  	  	.text(function(d) { return d.risk_name; });
		function change_risk_cat(risk_cat, chart) {
			// update the stored settings
				update_settings('risk_cat', risk_cat, chart);
			// update the charts
				update_charts(chart, 'risk_cat');
		}
		
	// year slider
		$.ajax({
			url: use_mysql ? 'php/year_list.php' : 'data/parameters/year_list.csv',
			dataType: use_mysql ? 'json' : 'text',
			async: false,
			success: function(data) {
			// save year list
				year_list = use_mysql ? data : d3.csv.parse(data);
			// create lookups
				lookups['year_to_name'] = {};
				lookups['year_from_name'] = {};
				year_list.forEach(function(y) {
					lookups['year_to_name'][y.year_viz] = y;
					lookups['year_from_name'][y.year_name] = y;
				});
			}
		});
		// div to turn into year slider
			var tmp = d3.selectAll('.menu_control_year').append('table').style('width', '100%').append('tr');
			tmp.append('td').attr('class', 'menu_slider').append('div')
				.attr('id', function(d,i) { return 'menu_year_slider_' + i; }); 
		// label for selected year
			tmp.append('td').append('span')
				.attr('class', 'menu_slider_label')
				.attr('id', function(d,i) { return 'menu_year_label_' + i; })
				.text(function(d,i) { return lookups['year_to_name'][settings['year_' + i]].year_name; }); 
		// turn them all into sliders
			$('[id^="menu_year_slider"]').slider({
				min:	d3.min(year_list, function(y) { return parseInt(y.year_viz); }),
				max:	d3.max(year_list, function(y) { return parseInt(y.year_viz); }),
				animate:true,
				change:	function(event, ui) {
					$(this).parent().parent().find('.menu_slider_label').text(lookups['year_to_name'][ui.value].year_name);
					change_year(ui.value, this.id.substr(-1));
				},
				slide:function(event, ui) {
					$(this).parent().parent().find('.menu_slider_label').text(lookups['year_to_name'][ui.value].year_name);
				}
			});
		function change_year(year, chart) {
			// update the stored settings
				update_settings('year', year, chart);
			// update the charts
				update_charts(chart, 'year');
		}

	// age slider
		$.ajax({
			url: use_mysql ? 'php/age_list.php' : 'data/parameters/age_list.csv',
			dataType: use_mysql ? 'json' : 'text',
			async: false,
			success: function(data) {
			// save age list
				age_list = use_mysql ? data : d3.csv.parse(data);
			// create lookups
				lookups['age_to_name'] = {};
				lookups['age_from_name'] = {};
				lookups['age_from_short'] = {};
				age_list.forEach(function(a) {
					lookups['age_to_name'][parseInt(a.age_viz)] = a;
					if (a.age_name == 'Total') lookups['age_to_name'][parseInt(a.age_viz)]['age_name'] = 'All Ages';
					lookups['age_from_name'][a.age_name] = a;
					lookups['age_from_short'][a.age_axis] = a;
				});
			}
		});
		// div to turn into age slider
			var tmp = d3.selectAll('.menu_control_age').append('table').style('width', '100%').append('tr');
			tmp.append('td').attr('class', 'menu_slider').append('div')
				.attr('id', function(d,i) { return 'menu_age_slider_' + i; }); 
		// label for selected age
			tmp.append('td').append('span')
				.attr('class', 'menu_slider_label')
				.attr('id', function(d,i) { return 'menu_age_label_' + i; })
				.text(function(d,i) { return lookups['age_to_name'][settings['age_' + i]].age_name; }); 
		// turn them all into sliders
			$('[id^="menu_age_slider"]').slider({
				min:	d3.min(age_list, function(a) { return parseInt(a.age_viz); }),
				max:	d3.max(age_list, function(a) { return parseInt(a.age_viz); }),
				animate:true,
				change:	function(event, ui) {
					$(this).parent().parent().find('.menu_slider_label').text(lookups['age_to_name'][ui.value].age_name);
					change_age(ui.value, this.id.substr(-1));
				},
				slide:function(event, ui) {
					$(this).parent().parent().find('.menu_slider_label').text(lookups['age_to_name'][ui.value].age_name);
				}
			});
		function change_age(age, chart) {
			// update the stored settings
				update_settings('age', age, chart);
			// update the charts
				update_charts(chart, 'age');
		}
			
	// sex radio buttons
		var sex_list = [{ val: 'B', name: 'Both',	label: 'Both Sexes' },
						{ val: 'M', name: 'Male',	label: 'Males' },
						{ val: 'F', name: 'Female',	label: 'Females' }];
		lookups['sex'] = {};
		sex_list.forEach(function(s) {
			lookups.sex[s.val] = s.label;
		});
		var tmp = d3.selectAll('.menu_control_sex').append('center').append('form').attr('id', function(d,i) { return 'menu_sex_form_' + i; });
		tmp.selectAll('radios')
			.data(sex_list)
		  .enter().append('input')
			.attr('type', 'radio')
			.attr('name', function(d,i,p) { return 'menu_sex_radio_' + p; })
			.attr('id', function(d,i,p) { return 'menu_sex_radio_' + p + '_' + d.val; })
			.attr('value', function(d,i,p) { return d.val; });
		tmp.selectAll('labels')
			.data(sex_list)
		  .enter().append('label')
			.attr('class', 'menu_radio_label')
			.attr('for', function(d,i,p) { return 'menu_sex_radio_' + p + '_' + d.val; })
			.text(function(d) { return d.name; });
		$('[id^="menu_sex_form"]').buttonset()
			.change(function() { 
				update_settings('sex', $(this).find(':checked').val(), parseInt(this.id.substr(-1))); 
				update_charts(parseInt(this.id.substr(-1)), 'sex');
			});

	// unit radio buttons
		var unit_list = [{ val: 'num', label: '#'},
						 { val: 'rate', label: 'Rate'},
						 { val: 'prop', label: '%'}];
		lookups['unit_labels'] = { num: '', prop: ' Proportion', rate: ' per 100,000' };
		var tmp = d3.selectAll('.menu_control_unit').append('center').append('form').attr('id', function(d,i) { return 'menu_unit_form_' + i; });
		tmp.selectAll('radios')
			.data(unit_list)
		  .enter().append('input')
			.attr('type', 'radio')
			.attr('name', function(d,i,p) { return 'menu_unit_radio_' + p; })
			.attr('id', function(d,i,p) { return 'menu_unit_radio_' + p + '_' + d.val; })
			.attr('value', function(d,i,p) { return d.val; });
		tmp.selectAll('labels')
			.data(unit_list)
		  .enter().append('label')
			.attr('class', 'menu_radio_label')
			.attr('for', function(d,i,p) { return 'menu_unit_radio_' + p + '_' + d.val; })
			.text(function(d) { return d.label; });
		$('[id^="menu_unit_form"]').buttonset()
			.change(function() { 
				update_settings('unit', $(this).find(':checked').val(), parseInt(this.id.substr(-1))); 
				update_charts(parseInt(this.id.substr(-1)), 'unit');
			});
	
	// treemap color scale select
		var treemap_color_list = [
			{ val: 'group', 	label: 'Cause Group' },
			{ val: 'size', 		label: 'Proportion' },
			{ val: 'change',	label: 'Rate of Change' },
			{ val: 'risk',		label: 'Risk Factor Attribution' }
		];
		d3.selectAll('.menu_control_treemap_color')
		  .append('select')
			.attr('id', function(d,i) { return 'menu_treemap_color_select_' + i; })
			.style('width', (.85 * menu_width) + 'px')
			.attr('onchange', function(d,i) { return 'change_treemap_color(this.value,' + i + ')'; })
			.selectAll('options')
			.data(treemap_color_list)
		  .enter().append('option')
			.attr('id', function(d,i,p) { return 'treemap_color_option_' + p + '_' + d.val; })
			.attr('value', function(d) { return d.val; })
			.text(function(d) { return d.label; });
		function change_treemap_color(treemap_color, chart) {
			// update the stored settings
				update_settings('treemap_color', treemap_color, chart);
			// update the charts
				update_charts(chart, 'treemap_color');
		}
	
	// treemap depth slider
		var max_treemap_depth = d3.max(cause_list, function(d) { return d.cause_viz.match(/_/g) ? d.cause_viz.match(/_/g).length + 1 : 0 }) - 1;
		// div to turn into treemap_depth slider
			var tmp = d3.selectAll('.menu_control_treemap_depth').append('table').style('width', '100%').append('tr');
			tmp.append('td').attr('class', 'menu_slider').append('div')
				.attr('id', function(d,i) { return 'menu_treemap_depth_slider_' + i; }); 
		// label for selected treemap_depth
			tmp.append('td').append('span')
				.attr('class', 'menu_slider_label')
				.attr('id', function(d,i) { return 'menu_treemap_depth_label_' + i; })
				.text(function(d,i,p) { return settings['treemap_depth_' + i]; }); 
		// turn them all into sliders
			$('[id^="menu_treemap_depth_slider"]').slider({
				min:	1,
				max:	max_treemap_depth,
				animate:true,
				change:	function(event, ui) {
					$(this).parent().parent().find('.menu_slider_label').text(ui.value);
					update_settings('treemap_depth', ui.value, parseInt(this.id.substr(-1)));
					update_charts(parseInt(this.id.substr(-1)), 'treemap_depth');
				},
				slide:function(event, ui) {
					$(this).parent().parent().find('.menu_slider_label').text(ui.value);
				}
			});
	
	// map levels
		var map_level_list = [
			{ val: 'C', 	label: 'Country' },
			{ val: 'R', 	label: 'Region' },
			{ val: 'SR', 	label: 'Super Region' }
		];
		d3.selectAll('.menu_control_map_level')
		  .append('select')
			.attr('id', function(d,i) { return 'menu_map_level_select_' + i; })
			.style('width', (.85 * menu_width) + 'px')
			.attr('onchange', function(d,i) { return 'change_map_level(this.value,' + i + ')'; })
			.selectAll('options')
			.data(map_level_list)
		  .enter().append('option')
			.attr('id', function(d,i,p) { return 'map_level_option_' + p + '_' + d.val; })
			.attr('value', function(d) { return d.val; })
			.text(function(d) { return d.label; });
		function change_map_level(map_level, chart) {
			// update the stored settings
				update_settings('map_level', map_level, chart);
			// update the charts
				update_charts(chart, 'map_level');
		}
	
	// stacked bar sort order radio buttons
		var sbar_sort_list = [	{ val: 'rank', name: 'Rank' },
								{ val: 'alpha', name: 'Alphabetic' }];
		var tmp = d3.selectAll('.menu_control_sbar_sort').append('center').append('form').attr('id', function(d,i) { return 'menu_sbar_sort_form_' + i; });
		tmp.selectAll('radios')
			.data(sbar_sort_list)
		  .enter().append('input')
			.attr('type', 'radio')
			.attr('name', function(d,i,p) { return 'menu_sbar_sort_radio_' + p; })
			.attr('id', function(d,i,p) { return 'menu_sbar_sort_radio_' + p + '_' + d.val; })
			.attr('value', function(d,i,p) { return d.val; });
		tmp.selectAll('labels')
			.data(sbar_sort_list)
		  .enter().append('label')
			.attr('class', 'menu_radio_label')
			.attr('for', function(d,i,p) { return 'menu_sbar_sort_radio_' + p + '_' + d.val; })
			.text(function(d) { return d.name; });
		$('[id^="menu_sbar_sort_form"]').buttonset()
			.change(function() { 
				update_settings('sbar_sort', $(this).find(':checked').val(), parseInt(this.id.substr(-1))); 
				update_charts(parseInt(this.id.substr(-1)), 'sbar_sort');
			});

// set all the controls to their starting values
	$(function() {
		menu_elements.forEach(function(m) {
			// use the update_ui function on all 3 control panels to put everything in the right starting state
				update_ui(m.val, menus_012);
			// there's an issue with starting values for some selects not triggering updates, so do them the fail-safe way as well
				if (m.type == 'select') {
					menus_012.forEach(function(i) {
						$('#' + m.val + '_option_' + i + '_' + settings[m.val + '_' + i])[0].selected = true;
					});
				}
		});
	
		// make all the selects into all-fancy-like-selects
		// NOTE: this needs to happen after setting the starting option on the selects, hence doing it down here
		// seems to be a bit of a bug with chosen(), sometimes the onchange() event won't trigger otherwise
			$('#side_menu_panel').find('select').chosen({ disable_search_threshold: 10 })
	});


// make side menu into a jquery tab widget
	// turn into tabs
		$('#side_menu_panel').tabs();
	// function to show only the relevant tab(s)
		// menu if 1 chart shown, charts 1 & 2 if both charts shown
		function toggle_tabs(num_charts) {
			// toggle visibility
				$('#tab_li_1').parent().toggle(num_charts == 2);
				$('#tab_li_2').parent().toggle(num_charts == 2);
				$('#tab_li_0').parent().toggle(num_charts == 1);
			// select the appropriate tab (menu in one chart mode, chart 1 in two chart mode)
				$('#side_menu_panel').tabs('option', 'selected', num_charts-1);
		}
		toggle_tabs(settings.num_charts);

// function for finding good tick formats
	function tick_formatter(max, unit) {
		if (unit == 'prop') {
			if (max <= .0005) return d3.format('.2%');
			else if (max <= .005) return d3.format('.1%');
			else if (max <= .1) return d3.format('.1%');
			else return d3.format('.0%');
		}
		else {
			if (max <= .5) return d3.format('.2f');
			else if (max < 5) return d3.format('.1f');
			else if (max <= 1000) return d3.format('.0f');
			else if (max <= 10000) return d3.format('.2s');
			else return d3.format('s');
		}
	}

// add the SVG canvas
	var svg = lower_div.append('svg')
		.attr('width', content_width + 'px')
		.attr('height', height + 'px')
		.style('margin-left', menu_width + 'px');

// add a dividing line between the top and bottom
	var split_screen_line = svg.append('line')
		.attr('id', 'split_screen_line')
		.attr('x1', '5%')
		.attr('x2', '95%')
		.attr('y1', '50%')
		.attr('y2', '50%')
		.style('stroke-opacity', settings.num_charts - (1 - 1e-5));

// add a clipping path for the half-size canvases
	svg.append('clipPath')
		.attr('id', 'rect_clip')
	  .append('rect')
		.attr('y', function(d) { return 1; })
		.attr('width', content_width)
		.attr('height', height / 2);

// add g's for each canvas
	var canvas_data = [{ canvas: 0, y: 0, h: height }, { canvas: 1, y: 0, h: height/2 }, { canvas: 2, y: height/2, h: height/2 }],
		canvases = svg.selectAll('canvases')
			.data(canvas_data)
		  .enter().append('g')
			.attr('clip-path', function(d) { return d.canvas > 0 ? 'url(#rect_clip)' : ''; })
			.attr('id', function(d) { return 'canvas_' + d.canvas; })
			.attr('transform', function(d) { return 'translate(0,' + d.y + ')' });

// keep track of which charts are visible
	var chart_visibility = {};
	chart_list.forEach(function(d) {
		menus_012.forEach(function(p) {
			chart_visibility[d.val + '_' + p] = (d.val == settings['chart_' + p] && ((settings.num_charts == 1 && p == 0) || (settings.num_charts == 2 && p > 0)));
		});
	});

// add a g for each chart
	var chart_gs = canvases.selectAll('chart_gs')
			.data(chart_list)
		  .enter().append('g')
			.attr('id', function(d,i,p) { return d.val + '_' + p; })
			.style('visibility', function(d,i,p) { return chart_visibility[d.val + '_' + p] ? 'visible' : 'hidden'; })
			.style('opacity', function(d,i,p) { return chart_visibility[d.val + '_' + p] ? 1 : 1e-5; });

// change which charts are visible
	function toggle_chart_visibility() {
		// mark which charts should be visible
			chart_list.forEach(function(d) {
				menus_012.forEach(function(p) {
					chart_visibility[d.val + '_' + p] = (d.val == settings['chart_' + p] && ((settings.num_charts == 1 && p == 0) || (settings.num_charts == 2 && p > 0)));
				});
			});
		// set all charts to visible mode
			chart_gs.style('visibility', 'visible');
		// transition the opacity to swap visibility
			chart_gs.transition().duration(1000).ease('linear')
				.delay(function(d,i,p) { return chart_visibility[d.val + '_' + p] ? 1000 : 0; })
				.style('opacity', function() { 
					var d = this.id.substr(0, this.id.length-2),
						p = this.id.substr(-1); 
					return chart_visibility[d + '_' + p] ? 1 : 1e-5; 
				})
		// and then chain on another transition to turn off visibility on the old chart(s)
				.transition().duration(0)
				.delay(1001)
				.style('visibility', function() { 
					var d = this.id.substr(0, this.id.length-2),
						p = this.id.substr(-1); 
					return chart_visibility[d + '_' + p] ? 'visible' : 'hidden'; 
				});
	}
	
// update the charts
	function update_charts(chart, setting) {
		// if the charts are synced on this attribute, update everything
			if (settings[setting + '_sync'] || setting == 'num_charts') {
				[0,1,2].forEach(function(c) { 
					refresh_map(c);
					refresh_sbar(c);
					refresh_time_age(c);
					refresh_treemap(c, setting);
				});
			}
		// if updating chart 0 also update chart 1 (and vice versa)
			else if (chart == 0 || chart == 1) {
				[0,1].forEach(function(c) {
					refresh_map(c);
					refresh_sbar(c);
					refresh_time_age(c);
					refresh_treemap(c, setting);
				});
			}
		// otherwise just update chart 2
			else {
				refresh_map(chart);
				refresh_sbar(chart);
				refresh_time_age(chart);
				refresh_treemap(chart, setting);
			}
	}
	