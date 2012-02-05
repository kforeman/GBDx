/*	Author: 	Kyle Foreman (kforeman@post.harvard.edu)
	Date:		4 January 2012
	Purpose:	Store settings for GBD tool
*/

// list all the menu options
	var	menu_entries = [
			{ val: 'chart', 	label: 'Chart',		type: 'select',	section: 'main' },
		 	{ val: 'geo', 		label: 'Place',		type: 'select',	section: 'main' },
		 	{ val: 'cause',		label: 'Cause',		type: 'select',	section: 'main' },
			{ val: 'year',		label: 'Year',		type: 'slider',	section: 'main' },
			{ val: 'age',		label: 'Age',		type: 'slider',	section: 'main' },
			{ val: 'sex',		label: 'Sex',		type: 'radio',	section: 'main' },
			{ val: 'metric',	label: 'Metric',	type: 'select',	section: 'main' },
			{ val: 'unit',		label: 'Units',		type: 'radio',	section: 'main' },
			{ val: 'tree_depth',label: 'Depth',		type: 'slider',	section: 'tree' },
			{ val: 'tree_color',label: 'Color',		type: 'select',	section: 'tree' },
			{ val: 'tree_risk',	label: 'Risk',		type: 'select',	section: 'tree' },
			{ val: 'map_level',	label: 'Level',		type: 'select',	section: 'map' 	},
		];

// determine if this is the offline version
	var use_mysql = (window.location.host != 'localhost:8888');

// create some default settings
	var defaults = {
		chart_sync:		false,
		chart_A:		'treemap',
		chart_B:		'map',
		geo_sync:		true,
		geo_A:			'G',
		cause_sync:		true,
		cause_A:		'A',
		year_sync:		true,
		year_A:			3,
		age_sync:		true,
		age_A:			22,
		sex_sync:		true,
		sex_A:			'M',
		metric_sync:	true,
		metric_A:		'daly',
		unit_sync:		true,
		unit_A:			'rate',
		tree_depth_A:	2,
		tree_depth_sync:true,
		tree_color_A:	'change',
		tree_color_sync:true,
		tree_risk_A:	'alcohol_eg',
		tree_risk_sync:	true,
		map_level_A:	'C',
		map_level_sync:	true
	};

// copy the default settings for A into the AB setting; also, make sure A & B are mirrored if synced
	menu_entries.map(function(m) {
		defaults[m.val + '_AB'] = defaults[m.val + '_A'];
		if (defaults[m.val + '_sync']) {
			defaults[m.val + '_B'] = defaults[m.val + '_A'];
		}
	});

// add some additional global settings
	defaults['tree_click'] = true;
	defaults['map_click'] = true;
	defaults['time_age_click'] = true;

// for now just load in the defaults
	var settings = defaults;

// list of different charts available
	var chart_list = [	
		{ val: 'treemap', 	label: 'Treemap' },
		{ val: 'map', 		label: 'Map' },
		{ val: 'time_age',	label: 'Time/Age Plots' }
		//{ val: 'table',		label: 'Table' }
	];

// list of different metrics available
	var metric_list = [
		{ val: 'dth', 		label: 'Deaths',								short: 'Deaths' },
		{ val: 'yll', 		label: 'YLL (Years of Life Lost)',				short: 'YLLs' },
		{ val: 'yld', 		label: 'YLD (Years Lost due to Disability)',	short: 'YLDs' },
		{ val: 'daly', 		label: 'DALY (Disability-Adjusted Life Years)',	short: 'DALYs' }
	];

// units
	var unit_list = { num: '', prop: ' Proportion', rate: ' per 100,000' };

// treemap color scales
	var tree_color_options = [
		{ val: 'group', 	label: 'Cause Group' },
		{ val: 'size', 		label: 'Proportion' },
		{ val: 'change',	label: 'Rate of Change' },
		{ val: 'risk',		label: 'Risk Factor Attribution' }
	];

// map levels
	var map_level_options = [
		{ val: 'C', 	label: 'Country' },
		{ val: 'R', 	label: 'Region' },
		{ val: 'SR', 	label: 'Super Region' }
	];

// AB looper
	var AB = ['A', 'B'];
