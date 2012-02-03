/*	Author: 	Kyle Foreman (kforeman@post.harvard.edu)
	Date:		8 January 2012
	Purpose:	Return requested data, loading it if necessary
*/

// object in which to store the data, nested by geo, sex, cause
	var estimates = {},
		loaded_treemap_data = {},
		loaded_map_data = {},
		loaded_treemap_rfs = {},
		loaded_uncertainty = {},
		treemap_rfs = {};
	geo_list.map(function(g) {
		estimates[g.code] = {};
		treemap_rfs[g.code] = {};
		['M', 'F'].map(function(s) {
			estimates[g.code][s] = {};	
			treemap_rfs[g.code][s] = {};
			metric_list.map(function(m) {
				estimates[g.code][s][m.val] = {};
				treemap_rfs[g.code][s][m.val] = {};
				risk_list.map(function(r) {
					treemap_rfs[g.code][s][m.val][r.risk] = {};
				});
			});
		});
	});

// function to retrieve estimates for a given geo/sex/metric
	function retrieve_treemap_data(geo, sex, metric) {
		
		// download the data if it hasn't been already
			if (loaded_treemap_data[geo + '_' + sex + '_' + metric] != 1) download_treemap_data(geo, sex, metric);
		
		// return the requested data
			return estimates[geo][sex][metric];
	}

// load data by geo/sex (for treemaps)
	function download_treemap_data(geo, sex, metric) {
		// download from mysql if online
		if (use_mysql) {
			$.ajax({
				url: 'php/treemap_data.php?geo_sex=' + geo + '_' + sex + '&metric=' + metric,
				dataType: 'json',
				async: false,
				success: function(json) {
					json.map(function(d) {
						estimates[geo][sex][metric][d.cause_viz] = d;
					});
					loaded_treemap_data[geo + '_' + sex + '_' + metric] = 1;
				}
			});		
		}
		// otherwise open the csv
		else {
			$.ajax({
				url: 'data/treemap/' + geo + '_' + sex + '_' + metric + '.csv',
				dataType: 'text',
				async: false,
				success: function(csv) {
					var data = d3.csv.parse(csv);
					data.map(function(d) {
						estimates[geo][sex][metric][d.cause_viz] = d;
					});
					loaded_treemap_data[geo + '_' + sex + '_' + metric] = 1;
				}
			});	
		}
	}

// function to retrieve estimates for a given cause/sex/metric
	function retrieve_map_data(cause, sex, metric) {
		
		// download the data if it hasn't been already
			if (loaded_map_data[cause + '_' + sex + '_' + metric] != 1) download_map_data(cause, sex, metric);
		
		// make an appropriately shaped result object
			var results = {};
			geo_list.map(function(d) {
				results[d.code] = estimates[d.code][sex][metric][cause];
			});
					
		// return the requested data
			return results;
	}

// load data by cause and sex (for maps)
	function download_map_data(cause, sex, metric) {
		// download from mysql if we're online
		if (use_mysql) {
			$.ajax({
				url: 'php/map_data.php?cause_viz=' + cause + '&sex=' + sex + '&metric=' + metric,
				dataType: 'json',
				async: false,
				success: function(json) {
					json.map(function(d) {
						var gs = d.geo_sex.split('_'),
							g = (gs.length == 2 ? gs[0] : gs[0] + '_' + gs[1]),
							s = (gs.length == 2 ? gs[1] : gs[2]);
						if (estimates[g]) estimates[g][s][metric][cause] = d;
					});
					loaded_map_data[cause + '_' + sex + '_' + metric] = 1;
				}
			});
		}
		// otherwise open the csv
		else {
			$.ajax({
				url: 'data/map/' + cause + '_' + sex + '_' + metric + '.csv',
				dataType: 'text',
				async: false,
				success: function(csv) {
					var data = d3.csv.parse(csv);
					data.map(function(d) {
						var gs = d.geo_sex.split('_'),
							g = (gs.length == 2 ? gs[0] : gs[0] + '_' + gs[1]),
							s = (gs.length == 2 ? gs[1] : gs[2]);
						if (estimates[g]) estimates[g][s][metric][cause] = d;
					});
					loaded_map_data[cause + '_' + sex + '_' + metric] = 1;
				}
			});	
		}
	}

// find rf estimates for a geo/cause/sex/risk
	function retrieve_treemap_rf(geo, cause, sex, risk, metric, age, year) {
		// download if necessary
			if (loaded_treemap_rfs[geo + '_' + sex + '_' + metric + '_' + risk] != 1) download_treemap_rf(geo, sex, metric, risk);
		
		// return the value
			return treemap_rfs[geo][sex][metric][risk][cause] ? (treemap_rfs[geo][sex][metric][risk][cause]['m' + age + '_' + year] ? parseFloat(treemap_rfs[geo][sex][metric][risk][cause]['m' + age + '_' + year]) : 0) : 0;
	}

// load risk proportions for a given geo/sex/metric/risk (for treemaps with risks)
	function download_treemap_rf(geo, sex, metric, risk) {
		if (use_mysql) {
			$.ajax({
				url: 'php/treemap_rfs.php?geo_sex=' + geo + '_' + sex + '&risk=' + risk + '&metric=' + metric,
				dataType: 'json',
				async: false,
				success: function(json) {
					if (json == "failure") loaded_treemap_rfs[geo + '_' + sex + '_' + metric + '_' + risk] = 1;
					else {
						json.map(function(d) {
							treemap_rfs[geo][sex][metric][risk][d.cause_viz] = d;
						});
						loaded_treemap_rfs[geo + '_' + sex + '_' + metric + '_' + risk] = 1;					
					}
				},
				error: function() {
					loaded_treemap_rfs[geo + '_' + sex + '_' + metric + '_' + risk] = 1;
				}
			});		
		}
		else {
			$.ajax({
				url: 'data/treemap_risks/' + geo + '_' + sex + '_' + risk + '_' + metric + '.csv',
				dataType: 'text',
				async: false,
				success: function(csv) {
					var data = d3.csv.parse(csv);
					data.map(function(d) {
						treemap_rfs[geo][sex][metric][risk][d.cause_viz] = d;
					});
					loaded_treemap_rfs[geo + '_' + sex + '_' + metric + '_' + risk] = 1;
				},
				error: function() {
					loaded_treemap_rfs[geo + '_' + sex + '_' + metric + '_' + risk] = 1;
				}
			});	
		}
	}

// return a value in correct units (must already be downloaded)
	function retrieve_value(metric, age, year, unit, geo, sex, cause) {
		try {
			var pop = parseInt(totals[geo][sex]['pop_' + age + '_' + year]),
				env = parseFloat(totals[geo][sex][metric + '_' + age + '_' + year]),
				cf = parseFloat(estimates[geo][sex][metric][cause]['m' + age + '_' + year]);
			switch(unit) {
				case 'prop':
					return cf;
					break;
				case 'num':
					return cf * env;
					break;
				case 'rate':
					return cf * env * 100000 / pop;
					break;
			}
		}
		catch(err) {
			return NaN;
		}
	}

// give value with its uncertainty interval
	function retrieve_uncertainty(geo, sex, cause, year, age, metric, unit) {
		if (use_mysql && loaded_uncertainty[geo + '_' + sex + '_' + metric + '_' + cause] != 1) download_uncertainty(geo, sex, cause, metric);
		try {
			var pop = parseInt(totals[geo][sex]['pop_' + age + '_' + year]),
				env = parseFloat(totals[geo][sex][metric + '_' + age + '_' + year]),
				m = retrieve_value(metric, age, year, unit, geo, sex, cause),
				l = parseFloat(estimates[geo][sex][metric][cause]['l' + age + '_' + year]),
				u = parseFloat(estimates[geo][sex][metric][cause]['u' + age + '_' + year]);
			switch(unit) {
				case 'prop':
					return [m, l, u];
					break;
				case 'num':
					return [m, l*env, u*env];
					break;
				case 'rate':
					return [m, l*env*100000/pop, u*env*100000/pop];
					break;
			}
		}
		catch(err) {
			return [NaN, NaN, NaN];
		}
	}

// download confidence intervals
	function download_uncertainty(geo, sex, cause, metric) {
		$.ajax({
			url: 'php/uncertainty.php?geo_sex=' + geo + '_' + sex + '&cause=' + cause + '&metric=' + metric,
			dataType: 'json',
			async: false,
			success: function(json) {
				$.extend(estimates[geo][sex][metric][cause], json[0]);
				loaded_uncertainty[geo + '_' + sex + '_' + metric + '_' + cause] = 1;
			}
		})
	}
