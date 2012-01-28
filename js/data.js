/*	Author: 	Kyle Foreman (kforeman@post.harvard.edu)
	Date:		8 January 2012
	Purpose:	Return requested data, loading it if necessary
*/

// object in which to store the data, nested by geo, sex, cause
	var estimates = {},
		loaded_data_by_geo_sex = {},
		loaded_data_by_cause_sex = {},
		loaded_rfs_by_geo_sex_risk = {},
		rfs = {};
	geo_list.map(function(g) {
		estimates[g.code] = {};
		rfs[g.code] = {};
		['M', 'F'].map(function(s) {
			estimates[g.code][s] = {};	
			rfs[g.code][s] = {};
			risk_list.map(function(r) {
				rfs[g.code][s][r.risk] = {};
			});
		});
	});

// function to retrieve estimates for a given geo/sex
	function retrieve_data_by_geo_sex(geo, sex) {
		
		// download the data if it hasn't been already
			if (loaded_data_by_geo_sex[geo + '_' + sex] != 1) load_data_by_geo_sex(geo, sex);
			
		// return the requested data
			return estimates[geo][sex];
	}

// load data by geo/sex (for treemaps)
	function load_data_by_geo_sex(geo, sex) {
		//loading_indicator.transition().style('visibility', 'visible');
		$.ajax({
			url: 'php/results_by_geo_sex.php?geo_sex=' + geo + '_' + sex,
			dataType: 'json',
			async: false,
			success: function(json) {
				json.map(function(d) {
					estimates[geo][sex][d.cause_viz] = d;
				});
				loaded_data_by_geo_sex[geo + '_' + sex] = 1;
			}
		});
		//loading_indicator.transition().style('visibility', 'hidden');
	}

// function to retrieve estimates for a given cause/sex
	function retrieve_data_by_cause_sex(cause, sex) {
		
		// download the data if it hasn't been already
			if (loaded_data_by_cause_sex[cause + '_' + sex] != 1) load_data_by_cause_sex(cause, sex);
		
		// make an appropriately shaped result object
			var results = {};
			geo_list.map(function(d) {
				results[d.code] = estimates[d.code][sex][cause];
			});
					
		// return the requested data
			return results;
	}

// load data by cause and sex (for maps)
	function load_data_by_cause_sex(cause, sex) {
		//loading_indicator.transition().style('visibility', 'visible');
		$.ajax({
			url: 'php/results_by_cause_sex.php?cause_viz=' + cause + '&sex=' + sex,
			dataType: 'json',
			async: false,
			success: function(json) {
				json.map(function(d) {
					var gs = d.geo_sex.split('_'),
						g = (gs.length == 2 ? gs[0] : gs[0] + '_' + gs[1]),
						s = (gs.length == 2 ? gs[1] : gs[2]);
					if (estimates[g]) estimates[g][s][cause] = d;
					loaded_data_by_cause_sex[cause + '_' + sex] = 1;
				});
			}
		});
		//loading_indicator.transition().style('visibility', 'hidden');
	}

// find rf estimates for a geo/cause/sex/risk
	function retrieve_rf(geo, cause, sex, risk, metric, age, year) {
		// just return 1 for total
			if (risk == 'total') return 1;
			else {
		
			// download if necessary
				if (loaded_rfs_by_geo_sex_risk[geo + '_' + sex + '_' + risk] != 1) load_rf_by_geo_sex_risk(geo, sex, risk);
			
			// return the value
				return rfs[geo][sex][risk][cause] ? (rfs[geo][sex][risk][cause][metric + '_' + age + '_' + year] ? parseFloat(rfs[geo][sex][risk][cause][metric + '_' + age + '_' + year]) : 0) : 0;
			}
	}

// load risk proportions for a given geo/sex/risk (for treemaps with risks)
	function load_rf_by_geo_sex_risk(geo, sex, risk) {
		$.ajax({
			url: 'php/rfs_by_geo_sex_risk.php?geo_sex=' + geo + '_' + sex + '&risk=' + risk,
			dataType: 'json',
			async: false,
			success: function(json) {
				json.map(function(d) {
					rfs[geo][sex][risk][d.cause_viz] = d;
				});
				loaded_rfs_by_geo_sex_risk[geo + '_' + sex + '_' + risk] = 1;
			}
		});
	}

// get data for just a single cause/sex/geo
	function retrieve_datum(geo, cause, sex) {
		if (loaded_data_by_cause_sex[cause + '_' + sex] != 1 && loaded_data_by_geo_sex[geo + '_' + sex] != 1) {
			load_data_by_cause_sex(cause, sex);
		}
		return estimates[geo][sex][cause];
	}

// return a value in correct units when given a row
	function retrieve_value(d, metric, b, age, year, unit, geo, sex) {
		var pop = parseInt(totals[geo][sex]['pop_' + age + '_' + year]),
			env = parseFloat(totals[geo][sex][metric + '_' + age + '_' + year]),
			cf = parseFloat(d[metric + '_' + b + '_' + age + '_' + year]);
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

// go ahead and load in totals (envelopes/pop)
	var totals = {};
	geo_list.map(function(g) {
		totals[g.code] = {};
	});
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
