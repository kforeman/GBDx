/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		5 June 2012
	Purpose:	Create the choropleth map
*/

// create the map projection
	var map_proj = d3.geo.mercator().scale(775).translate([360, 220]),
		map_coord = d3.geo.path().projection(map_proj);
		
		

// custom "flat" projection
	var flat_proj = function() {
			var scale = 500, translate = [480, 250];
			function flat_proj(coordinates) {	var x = (coordinates[0]) / 360,	y = (-coordinates[1]) / 360; return [ scale * x + translate[0], scale * Math.max(-.5, Math.min(.5, y)) + translate[1]]; }
			flat_proj.scale = function(x) { if (!arguments.length) return scale; scale = +x; return flat_proj; };
			flat_proj.translate = function(x) { if (!arguments.length) return translate; translate = [+x[0], +x[1]]; return flat_proj; };
			return flat_proj;
		},
		flat_coord = d3.geo.path().projection(flat_proj);

// load in the full map
	/*$.ajax({
		url: 'resources/gbdx_full_map.json',
		dataType: 'json',
		async: false,
		success: function(json) {
			full_map = json;
		}
	});

// load in the world bank <> iso3 translator
	$.ajax({
		url: 'resources/wb_to_iso.csv',
		dataType: 'text',
		async: false,
		success: function(csv) {
			lookups['wb_to_iso'] = {};
			d3.csv.parse(csv).forEach(function(m) {
				lookups.wb_to_iso[m.wb] = m.iso;
			});
		}
	});*/
		
		
		

// make a lookup for country names/regions
	lookups['geo'] = {};
	geo_list.map(function(d) {
		lookups['geo'][d.code] = {
			'name': 	d.name,
			'C':		d.code,
			'R':		'R_' + d.R,
			'SR':		'SR_' + d.SR,
			'level':	(d.code.substr(0,2) == 'R_' ? 'R' : (d.code.substr(0,3) == 'SR_' ? 'SR' : 'C'))
		};
	})

// generate placeholders for the objects created in the A/B loop
	var map_paths = {},
		map_legend_scales = {},
		map_legend_axes = {},
		map_legend_labels = {},
		map_legend_titles = {},
		map_color_scales = {},
		map_highlights = {};

// loop through canvases
	canvas_data.forEach(function(canvas) {
		var c = canvas.canvas;
		
	// add a g for this map
		var g = d3.select('#map_' + c)
		  	.attr('transform', 'translate(0,' + (c == 0 ? height/4 : 0) + ')');
	
	// draw the map
		map_paths[c] = g.selectAll('map_paths')
			.data(geojson_map.features)
		  .enter().append('path')
		  	.attr('d', map_coord)
		  	.attr('onclick', function(d) {
		  		return 'map_change_geo("' + d.id + '", "' + c + '");';
		  	})
		  	.attr('class', 'map_path')
		  	.style('fill', '#ccc')
		  	.attr('title', function(d) { return lookups['geo'][d.id] ? lookups['geo'][d.id].name : 'No Data'; });
	
	// draw a highlight layer
		map_highlights[c] = g.append('path')
		  	.attr('d', map_coord(geojson_map.features.filter(function(d) { return d.id == settings['geo_' + c]; } )[0]))
		  	.attr('class', 'map_highlight');
			
	// create the scale
		map_color_scales[c] = d3.scale.linear()
			.domain(d3.range(1, -1e-5, -1/11))
			.range(colorbrewer['Spectral'][11])
			.clamp(true);
	
	// draw a legend
		g.append('g')
			.attr('transform', 'translate(250, 345)')
 		  .selectAll('.color_bar')
			.data(d3.range(300))
		  .enter().append('rect')
			.attr('x', function(d) { return d + 'px'; })
			.attr('width', '1px')
			.attr('height', '10px')
			.attr('y', '0px')
			.attr('fill', function(d) { return map_color_scales[c](d/299); })
			.attr('stroke', 'none');
	
	// label the legend
		map_legend_scales[c] = d3.scale.linear().range([250, 550]);
		map_legend_axes[c] = d3.svg.axis().scale(map_legend_scales[c]).ticks(6).orient('bottom').tickSize(5);
		map_legend_labels[c] = g.append('g')
			.attr('transform', 'translate(0, 356)')
			.attr('class', 'map axis')
			.call(map_legend_axes[c]);
	
	// title the legend
		map_legend_titles[c + '_cause_risk'] = g.append('text')
			.attr('dx', 400)
			.attr('dy', 314)
			.attr('class', 'map_legend_title')
			.text(lookups.cause[settings['cause_' + c]].cause_short);
		map_legend_titles[c + '_age_sex'] = g.append('text')
			.attr('dx', 400)
			.attr('dy', 328)
			.attr('class', 'map_legend_title')
			.text(lookups.sex[settings['sex_' + c]] + ', ' + lookups.age_to_name[settings['age_' + c]].age_name + ', ' + lookups.year_to_name[settings['year_' + c]].year_name);
		map_legend_titles[c + '_units'] = g.append('text')
			.attr('dx', 400)
			.attr('dy', 342)
			.attr('class', 'map_legend_title')
			.text(lookups.metric_labels[settings['metric_' + c]] + lookups.unit_labels[settings['unit_' + c]]);
	});

// function to change geo when map is clicked
	function map_change_geo(new_geo, c) {
		if (typeof lookups['geo'][new_geo] != 'undefined') change_geo(lookups['geo'][new_geo][settings['map_level_' + c]], c);
	}

// add tooltips on mouseover
	$('.map_path').poshytip({ 
		slide: false, 
		followCursor: true, 
		alignTo: 'cursor', 
		showTimeout: 0, 
		hideTimeout: 0, 
		alignX: 'center', 
		alignY: 'inner-bottom', 
		className: 'tip-twitter',
		offsetY: 5
	});

// function to update the map
	var current_map_level = { 0: '', 1: '', 2: '' };
	function refresh_map(c) {
	
	// find the parameters for this map
		var cause = settings['cause_' + c],
			sex = settings['sex_' + c],
			year = settings['year_' + c],
			age = settings['age_' + c],
			metric = settings['metric_' + c],
			unit = settings['unit_' + c],
			geo = settings['geo_' + c],
			chart = settings['chart_' + c],
			map_level = settings['map_level_' + c];
		
	// only if this chart is selected, update it
		if (chart_visibility['map_' + c]) {
	
		// load in the data for this cause/sex
			retrieve_map_data(cause, sex, metric);
		
		// find the scale
			var map_vals = [];
			geo_list.map(function(g) {
				var gg = lookups['geo'][g.code] ? lookups['geo'][g.code]['level'] : '';
				if (gg == map_level) {
					year_list.map(function(y) {
						map_vals.push(retrieve_value(metric, age, y.year_viz, unit, g.code, sex, cause));
					});
				}
			});
			var map_max = d3.max(map_vals);
		
		// update the legend
			map_legend_axes[c].scale(map_legend_scales[c].domain([0, map_max]))
				.tickFormat(tick_formatter(map_max, settings['unit_' + c]));
			map_legend_labels[c].transition().duration(1000).call(map_legend_axes[c]);
		
		// update the legend title
			map_legend_titles[c + '_cause_risk']
				.text(lookups.cause[settings['cause_' + c]].cause_short);
			map_legend_titles[c + '_age_sex']
				.text(lookups.sex[settings['sex_' + c]] + ', ' + lookups.age_to_name[settings['age_' + c]].age_name + ', ' + lookups.year_to_name[settings['year_' + c]].year_name);
			map_legend_titles[c + '_units']
				.text(lookups.metric_labels[settings['metric_' + c]] + lookups.unit_labels[settings['unit_' + c]]);
			
		// color in the choropleth
			map_color_scales[c].domain(d3.range(map_max*1.01, 0, -map_max/11));
			map_paths[c].transition()
				.duration(1000)
				.style('fill', function(d) {
					var g = lookups['geo'][d.id] ? lookups['geo'][d.id][map_level] : '',
						val = retrieve_value(metric, age, year, unit, g, sex, cause);
					if (isNaN(val)) return '#ccc';
					else return map_color_scales[c](val);	
				});
		
		// highlight the selected country
			map_highlights[c]
				.attr('d', map_coord(geojson_map.features.filter(function(d) { return d.id == settings['geo_' + c]; } )[0]));
		
		// change the mouseover if we've changed levels
			if (current_map_level[c] != map_level) {
				map_paths[c]
		  			.attr('title', function(d) { 
		  				if (typeof lookups['geo'][d.id] != 'undefined') {
			  				var g = lookups['geo'][d.id][map_level],
			  					t = lookups['geo'][g]['name']
			  				return t;			
		  				}
		  				else return 'No Data';
		  			});
		  		$('.map_path').poshytip('destroy');
		  		$('.map_path').poshytip({ 
					slide: false, 
					followCursor: true, 
					alignTo: 'cursor', 
					showTimeout: 0, 
					hideTimeout: 0, 
					alignX: 'center', 
					alignY: 'inner-bottom', 
					className: 'tip-twitter',
					offsetY: 5
				});
			}
		
		current_map_level[c] = map_level;
		}
	}
	menus_012.forEach(function(c) {
		refresh_map(c);
	});
	