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
				$.extend(estimates[geo][sex][metric][cause], json[0]);
				loaded_uncertainty[geo + '_' + sex + '_' + metric + '_' + cause] = 1;
			}
		})
	}
