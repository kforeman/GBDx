/*	Author: 	Kyle Foreman (kforeman@post.harvard.edu)
	Date:		8 January 2012
	Purpose:	Return requested data, loading it if necessary
*/

// object in which to store the data, nested by geo, sex, cause
	var estimates = {},
		loaded_treemap_data = {},
		loaded_map_data = {},
		loaded_treemap_rfs = {},
		loaded_sbar_rfs = {},
		loaded_uncertainty = {},
		treemap_rfs = {},
		sbar_rfs = {};
	geo_list.forEach(function(g) {
		estimates[g.code] = {};
		treemap_rfs[g.code] = {};
		sbar_rfs[g.code] = {};
		sex_list.forEach(function(s) {
			estimates[g.code][s.val] = {};	
			treemap_rfs[g.code][s.val] = {};
			sbar_rfs[g.code][s.val] = {};
			metric_list.forEach(function(m) {
				estimates[g.code][s.val][m.val] = {};
				treemap_rfs[g.code][s.val][m.val] = {};
				sbar_rfs[g.code][s.val][m.val] = {};
				risk_list.forEach(function(r) {
					treemap_rfs[g.code][s.val][m.val][r.risk] = {};
					sbar_rfs[g.code][s.val][m.val][r.risk] = {};
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
		$.ajax({
			url: use_mysql ? 'php/treemap_data.php?geo_sex=' + geo + '_' + sex + '&metric=' + metric : 'data/treemap/' + geo + '_' + sex + '_' + metric + '.csv',
			dataType: use_mysql ? 'json' : 'text',
			async: false,
			success: function(data) {
				if (!use_mysql) data = d3.csv.parse(data);
				data.forEach(function(d) {
					estimates[geo][sex][metric][d.cause_viz] = d;
				});
				loaded_treemap_data[geo + '_' + sex + '_' + metric] = 1;
			}
		});		
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
		$.ajax({
			url: use_mysql ? 'php/map_data.php?cause_viz=' + cause + '&sex=' + sex + '&metric=' + metric : 'data/map/' + cause + '_' + sex + '_' + metric + '.csv',
			dataType: use_mysql ? 'json' : 'text',
			async: false,
			success: function(data) {
				if (!use_mysql) data = d3.csv.parse(data);
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

// find rf estimates for a geo/cause/sex/risk
	function retrieve_treemap_rf(geo, cause, sex, risk, metric, age, year) {
		// download if necessary
			if (loaded_treemap_rfs[geo + '_' + sex + '_' + metric + '_' + risk] != 1) download_treemap_rf(geo, sex, metric, risk);
		
		// return the value
			return treemap_rfs[geo][sex][metric][risk][cause] ? (treemap_rfs[geo][sex][metric][risk][cause]['mpc_' + age + '_' + year] ? parseFloat(treemap_rfs[geo][sex][metric][risk][cause]['mpc_' + age + '_' + year]) : 0) : 0;
	}

// load risk proportions for a given geo/sex/metric/risk (for treemaps with risks)
	function download_treemap_rf(geo, sex, metric, risk) {
		$.ajax({
			url: use_mysql ? 'php/treemap_rfs.php?geo_sex=' + geo + '_' + sex + '&risk=' + risk + '&metric=' + metric : 'data/treemap_risks/' + geo + '_' + sex + '_' + risk + '_' + metric + '.csv',
			dataType: use_mysql ? 'json' : 'text',
			async: false,
			success: function(data) {
				if (data == "failure") loaded_treemap_rfs[geo + '_' + sex + '_' + metric + '_' + risk] = 1;
				else {
					if (!use_mysql) data = d3.csv.parse(data);
					data.map(function(d) {
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

// load risk values for a given geo/sex/metric/category (for stacked bar charts)
	function download_sbar_rf(geo, sex, metric, category) {
		$.ajax({
			url:	use_mysql ? 'php/sbar_rfs.php?geo_sex=' + geo + '_' + sex + '&metric=' + metric + '&category=' + category : 'data/sbar_risks/' + geo + '_' + sex + '_' + category + '_' + metric + '.csv',
			dataType:	use_mysql ? 'json' : 'text',
			async:		false,
			success:	function(data) {
				if (!use_mysql) data = d3.csv.parse(data);
				data.forEach(function(d) {
					sbar_rfs[geo][sex][metric][d.risk][d.cause_viz] = d;
				});
				loaded_sbar_rfs[geo + '_' + sex + '_' + metric + '_' + category] = 1;
			},
			error: function() {
				loaded_sbar_rfs[geo + '_' + sex + '_' + metric + '_' + category] = 1;
			}
		});
	}

// retrieve the risk values in an appropriate stacked bar format
	function retrieve_sbar_rf(geo, sex, metric, category) {
		// download if necessary
			if (loaded_sbar_rfs[geo + '_' + sex + '_' + metric + '_' + category] != 1) download_sbar_rf(geo, sex, metric, category);
		// make an array in which to hold the results
			var bar_values = [];
		// first loop through the causes
			risk_causes.forEach(function(c) {
			// start an array to store the values for each risk
				var tmp = [];
			// loop through the risks
				risks_by_cat[category].forEach(function(r) {
				// add the values for this risk to the cause's array
					tmp.push(sbar_rfs[geo][sex][metric][r][c.cause_viz]);
				});
			// add a new entry for this cause
				bar_values.push(tmp)			
			});
		// also make an object for the totals for each bar
			var bar_totals = [];
			risks_by_cat[category].forEach(function(r) {
				bar_totals.push(sbar_rfs[geo][sex][metric][r]['T']);
			});
		// return the result
			return { values: bar_values, totals: bar_totals };
	}

// return a value in correct units (must already be downloaded)
	function retrieve_value(metric, age, year, unit, geo, sex, cause) {
		try {
			var pop = parseInt(pops[geo][sex]['pop_' + age + '_' + year]),
				nm = parseFloat(estimates[geo][sex][metric][cause]['mnm_' + age + '_' + year]),
				pc = parseFloat(estimates[geo][sex][metric][cause]['mpc_' + age + '_' + year]);
			switch(unit) {
				case 'prop':
					return pc;
					break;
				case 'num':
					return nm;
					break;
				case 'rate':
					return nm / pop * 100000;
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
			var pop = parseInt(pops[geo][sex]['pop_' + age + '_' + year]),
				m = retrieve_value(metric, age, year, unit, geo, sex, cause),
				l_pc = parseFloat(estimates[geo][sex][metric][cause]['lpc_' + age + '_' + year]),
				l_nm = parseFloat(estimates[geo][sex][metric][cause]['lnm_' + age + '_' + year]),
				u_pc = parseFloat(estimates[geo][sex][metric][cause]['upc_' + age + '_' + year]),
				u_nm = parseFloat(estimates[geo][sex][metric][cause]['unm_' + age + '_' + year]);
			switch(unit) {
				case 'prop':
					return [m, l_pc, u_pc];
					break;
				case 'num':
					return [m, l_nm, u_nm];
					break;
				case 'rate':
					return [m, l_nm / pop * 100000, u_nm / pop * 100000];
					break;
			}
		}
		catch(err) {
			return [0, 0, 0];
		}
	}

// download confidence intervals
	function download_uncertainty(geo, sex, cause, metric) {
		$.ajax({
			url: 'php/uncertainty.php?geo_sex=' + geo + '_' + sex + '&cause=' + cause + '&metric=' + metric,
			dataType: 'json',
			async: false,
			success: function(json) {
				// add the upper and lower values as new properties to the already existing mean value
				$.extend(estimates[geo][sex][metric][cause], json[0]);
				loaded_uncertainty[geo + '_' + sex + '_' + metric + '_' + cause] = 1;
			}
		})
	}
