/*	Author: 	Kyle Foreman (kforeman@post.harvard.edu)
	Date:		4 January 2012
	Purpose:	Store settings for GBD tool
*/

// list all the menu options
	var	menu_entries = [
			{ val: 'chart', 	label: 'Chart',		type: 'select',	section: 'main' },
		 	{ val: 'geo', 		label: 'Place',		type: 'select',	section: 'main' },
		 	{ val: 'cause',		label: 'Cause',		type: 'select',	section: 'main' },
			//{ val: 'risk',		label: 'Risk',		type: 'select',	section: 'main' },
			{ val: 'year',		label: 'Year',		type: 'slider',	section: 'main' },
			{ val: 'age',		label: 'Age',		type: 'slider',	section: 'main' },
			{ val: 'sex',		label: 'Sex',		type: 'radio',	section: 'main' },
			{ val: 'metric',	label: 'Metric',	type: 'select',	section: 'main' },
			{ val: 'unit',		label: 'Units',		type: 'radio',	section: 'main' },
			{ val: 'tree_depth',label: 'Depth',		type: 'slider',	section: 'tree' },
			{ val: 'tree_color',label: 'Color',		type: 'select',	section: 'tree' },
			{ val: 'tree_risk',	label: 'Risk',		type: 'select',	section: 'tree' }
		];

// determine if this is the offline version
	var use_mysql = (window.location.host != 'localhost:8888');

// create some default settings
	var defaults = {
		chart_sync:		0,
		chart_A:		'treemap',
		chart_B:		'map',
		geo_sync:		1,
		geo_A:			'G',
		cause_sync:		1,
		cause_A:		'A',
		risk_sync:		1,
		year_sync:		1,
		year_A:			3,
		age_sync:		1,
		age_A:			22,
		sex_sync:		1,
		sex_A:			'M',
		metric_sync:	1,
		metric_A:		'daly',
		unit_sync:		1,
		unit_A:			'rate',
		tree_depth_A:	2,
		tree_depth_sync:1,
		tree_color_A:	'change',
		tree_color_sync:1,
		tree_risk_A:	'alcohol_eg',
		tree_risk_sync:	1
	};

// copy the default settings for A into the AB setting; also, make sure A & B are mirrored if synced
	menu_entries.map(function(m) {
		defaults[m.val + '_AB'] = defaults[m.val + '_A'];
		if (defaults[m.val + '_sync']) {
			defaults[m.val + '_B'] = defaults[m.val + '_A'];
		}
	});

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
	]

// AB looper
	var AB = ['A', 'B'];
