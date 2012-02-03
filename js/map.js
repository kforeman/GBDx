/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		10 January 2012
	Purpose:	Create the geographic map
*/

// create the map projection
	var map_proj = d3.geo.mercator().scale(775).translate([360, 220]),
		map_coord = d3.geo.path().projection(map_proj);

// create interpolators for the choropleth
	var map_interpolators = [];
	for (i=0; i<10; i++) {
		map_interpolators.push(d3.interpolate(colorbrewer['Spectral'][11][i], colorbrewer['Spectral'][11][i+1]));
	}
	function choropleth_color(val) {
		if (isNaN(val)) return '#cccccc';
		else return map_interpolators[Math.floor(val)](val - Math.floor(val));
	}

// make a lookup for country names/regions
	lookups['geo'] = {};
	geo_list.map(function(d) {
		lookups['geo'][d.code] = d;
	})

// generate placeholders for the objects created in the A/B loop
	var map_paths = {},
		map_legend_scales = {},
		map_legend_axes = {},
		map_legend_labels = {},
		map_legend_titles = {},
		map_color_scales = {};

// loop through sections A and B
	AB.map(function(c) {
		
	// add a g for this map
		g = d3.select('#' + c)
		  .append('g')
		  	.attr('id', 'map_' + c)
		  	.attr('transform', 'translate(' + (settings['chart_' + c] == 'map' ? content_buffer : -1 * content_width) + ',' + content_buffer + ')');
	
	// draw the map
		map_paths[c] = g.selectAll()
			.data(geojson_map.features)
		  .enter().append('path')
		  	.attr('d', map_coord)
		  	.attr('class', 'map_path')
		  	.style('fill', '#ccc')
		  	.attr('title', function(d) { return lookups['geo'][d.id] ? lookups['geo'][d.id].name : 'No Data'; });
	
	// draw a highlight layer
	
	// draw a legend
		g.append('g')
			.attr('transform', 'translate(250, 330)')
 		  .selectAll('.color_bar')
			.data(d3.range(300))
		  .enter().append('rect')
			.attr('x', function(d) { return d + 'px'; })
			.attr('width', '1px')
			.attr('height', '12px')
			.attr('y', '0px')
			.attr('fill', function(d) { return choropleth_color((299-d)/30); })
			.attr('stroke', 'none');
	
	// label the legend
		map_legend_scales[c] = d3.scale.linear().range([250, 550]);
		map_legend_axes[c] = d3.svg.axis().scale(map_legend_scales[c]).ticks(4).orient('bottom').tickSize(5);
		map_legend_labels[c] = g.append('g')
			.attr('transform', 'translate(0, 345)')
			.attr('class', 'map axis')
			.call(map_legend_axes[c]);
	
	// title the legend
		map_legend_titles[c] = g.append('text')
			.attr('dx', 400)
			.attr('dy', 320)
			.attr('class', 'map_legend_title')
			.text(metric_list.filter(function(d) { return settings['metric_' + c] == d.val; })[0].short + unit_list[settings['unit_' + c]]);
			
	// create the scale
		map_color_scales[c] = d3.scale.linear().range([10-1e-6, 1e-6]).clamp(true);
	});

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
	function refresh_map(c) {
	
	// find the parameters for this map
		var cause = settings['cause_' + c],
			sex = settings['sex_' + c],
			year = settings['year_' + c],
			age = settings['age_' + c],
			metric = settings['metric_' + c],
			unit = settings['unit_' + c],
			geo = settings['geo_' + c],
			chart = settings['chart_' + c];
		
	// only if this chart is selected, update it
		if (chart == 'map') {
	
		// load in the data for this cause/sex
			retrieve_map_data(cause, sex, metric);
		
		// find the scale
			var map_vals = [];
			geo_list.map(function(g) {
				if (g.code != 'G') {
					year_list.map(function(y) {
						map_vals.push(retrieve_value(metric, age, y.year_viz, unit, g.code, sex, cause));
					});
				}
			});
			var map_max = d3.max(map_vals);
		
		// update the legend
			map_legend_axes[c].scale(map_legend_scales[c].domain([0, map_max]));
			map_legend_labels[c].transition().duration(1000).call(map_legend_axes[c]);
		
		// update the legend title
			map_legend_titles[c]
				.text(metric_list.filter(function(d) { return settings['metric_' + c] == d.val; })[0].short + unit_list[settings['unit_' + c]]);
			
		// color in the choropleth
			map_color_scales[c].domain([0, map_max]);
			map_paths[c].transition()
				.duration(1000)
				.style('fill', function(d) {
					var val = retrieve_value(metric, age, year, unit, d.id, sex, cause);
					if (isNaN(val)) return '#ccc';
					else return choropleth_color(map_color_scales[c](val));	
				});
		}
	}
