/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		7 January 2012
	Purpose:	Preload some data from MySQL that is required for subsequent steps (ie can't be loaded asynchronously)
*/

// have a single object to store various menu lookups in
	var lookups = {};	

// load the cause list
	if (use_mysql) {
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
	}
	else {
		$.ajax({
			url: 'data/parameters/cause_list.csv',
			dataType: 'text',
			async: false,
			success: function(csv) {
				cause_list = d3.csv.parse(csv);
				lookups['cause'] = {};
				cause_list.map(function(d) {
					lookups['cause'][d.cause_viz] = d;
				});
			}
		});
	}

// load starting points for treemaps (doing it twice because of some annoying deep copy things in d3.layout)
	if (use_mysql) {
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
	}
	else {
		$.ajax({
			url: 'data/treemap/treemap_starting_values.csv',
			dataType: 'text',
			async: false,
			success: function(csv) {
				data = d3.csv.parse(csv);
				treemap_start_A = data;
			}
		});
		$.ajax({
			url: 'data/treemap/treemap_starting_values.csv',
			dataType: 'text',
			async: false,
			success: function(csv) {
				data = d3.csv.parse(csv);
				treemap_start_B = data;
			}
		});
	}

// list of risks for treemaps
	if (use_mysql) {
		$.ajax({
			url: 'php/risk_list.php',
			dataType: 'json',
			async: false,
			success: function(data) {
				risk_list = data;
				// risk_list.splice(0, 0, { risk: 'total', risk_name: 'Total' });
			}
		});	
	}
	else {
		$.ajax({
			url: 'data/parameters/risk_list.csv',
			dataType: 'text',
			async: false,
			success: function(csv) {
				data = d3.csv.parse(csv);
				risk_list = data;
				risk_list.splice(0, 0, { risk: 'total', risk_name: 'Total' });
			}
		});
	}

// go ahead and load in totals (envelopes/pop)
	var totals = {};
	geo_list.map(function(g) {
		totals[g.code] = {};
	});
	if (use_mysql) {
		$.ajax({
			url: 'php/totals.php',
			dataType: 'json',
			async: false,
			success: function(json) {
				json.map(function(d) {
					var gs = d.geo_sex.split('_'),
						g = (gs.length == 2 ? gs[0] : gs[0] + '_' + gs[1]),
						s = (gs.length == 2 ? gs[1] : gs[2]);
					if (totals[g]) totals[g][s] = d;
				});
			}
		});	
	}
	else {
		$.ajax({
			url: 'data/totals/totals.csv',
			dataType: 'text',
			async: false,
			success: function(csv) {
				data = d3.csv.parse(csv);
				data.map(function(d) {
					var gs = d.geo_sex.split('_'),
						g = (gs.length == 2 ? gs[0] : gs[0] + '_' + gs[1]),
						s = (gs.length == 2 ? gs[1] : gs[2]);
					if (totals[g]) totals[g][s] = d;
				});
			}
		});
	}
