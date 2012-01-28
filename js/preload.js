/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		7 January 2012
	Purpose:	Preload some data from MySQL that is required for subsequent steps (ie can't be loaded asynchronously)
*/

// have a single object to store various menu lookups in
	var lookups = {};

// load the cause list
	$.ajax({
		url: 'php/cause_list.php',
		dataType: 'json',
		async: false,
		success: function(data) {
			cause_list = data;
			lookups['cause'] = {};
			cause_list.map(function(d) {
				lookups['cause'][d.cause_viz] = d;
			});
		}
	});

// load starting points for treemaps (doing it twice because of some annoying deep copy things in d3.layout)
	$.ajax({
		url: 'php/treemap_starting_values.php',
		dataType: 'json',
		async: false,
		success: function(data) { 
			treemap_start_A = data;
		}
	});
	$.ajax({
		url: 'php/treemap_starting_values.php',
		dataType: 'json',
		async: false,
		success: function(data) { 
			treemap_start_B = data;
		}
	});

// list of risks for treemaps
	$.ajax({
		url: 'php/risk_list.php',
		dataType: 'json',
		async: false,
		success: function(data) {
			risk_list = data;
			risk_list.splice(0, 0, { risk: 'total', risk_name: 'Total' });
		}
	});