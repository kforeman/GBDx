/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		7 January 2012
	Purpose:	Preload some data from MySQL that is required for subsequent steps (ie can't be loaded asynchronously)
*/

// have a single object to store various menu lookups in
	var lookups = {};	

// load the cause list
	$.ajax({
		url: use_mysql ? 'php/cause_list.php' : 'data/parameters/cause_list.csv',
		dataType: use_mysql ? 'json' : 'text',
		async: false,
		success: function(data) {
			if (!use_mysql) data = d3.csv.parse(data);
			cause_list = data;
			lookups['cause'] = {};
			cause_list.map(function(d) {
				lookups['cause'][d.cause_viz] = d;
			});
		}
	});	
	
// load starting points for treemaps (doing it twice because of some annoying deep copy things in d3.layout)
	$.ajax({
		url: use_mysql ? 'php/treemap_starting_values.php' : 'data/treemap/treemap_starting_values.csv',
		dataType: use_mysql ? 'json' : 'text',
		async: false,
		success: function(data) { 
			if (!use_mysql) data = d3.csv.parse(data);
			treemap_start_A = data;
		}
	});
	$.ajax({
		url: use_mysql ? 'php/treemap_starting_values.php' : 'data/treemap/treemap_starting_values.csv',
		dataType: use_mysql ? 'json' : 'text',
		async: false,
		success: function(data) { 
			if (!use_mysql) data = d3.csv.parse(data);
			treemap_start_B = data;
		}
	});

// list of risks for treemaps
	$.ajax({
		url: use_mysql ? 'php/risk_list.php' : 'data/parameters/risk_list.csv',
		dataType: use_mysql ? 'json' : 'text',
		async: false,
		success: function(data) {
			if (!use_mysql) data = d3.csv.parse(data);
			risk_list = data;
		}
	});	

// go ahead and load in populations
	var pops = {};
	geo_list.map(function(g) {
		pops[g.code] = {};
	});
	$.ajax({
		url: use_mysql ? 'php/pops.php' : 'data/pops/pop.csv',
		dataType: use_mysql ? 'json' : 'text',
		async: false,
		success: function(data) {
			if (!use_mysql) data = d3.csv.parse(data);
			data.map(function(d) {
				var gs = d.geo_sex.split('_'),
					g = (gs.length == 2 ? gs[0] : gs[0] + '_' + gs[1]),
					s = (gs.length == 2 ? gs[1] : gs[2]);
				if (pops[g]) pops[g][s] = d;
			});
		}
	});	
