/*	Author: 	Kyle Foreman (kforeman@post.harvard.edu)
	Date:		7 January 2012
	Purpose:	Generate treemaps
*/

// treemap colors
	var treemap_color_list = {
			A: colorbrewer['Reds'][9].splice(2,7),
			B: colorbrewer['Blues'][9].splice(2,7),
			C: colorbrewer['Greens'][9].splice(2,7) 
		};
		treemap_interps = {};
	['A', 'B', 'C'].map(function(c) {	
		treemap_interps[c] = [];
		for (i=0; i<6; i++) {
			treemap_interps[c].push(d3.interpolate(treemap_color_list[c][i], treemap_color_list[c][i+1]));
		}
	});
	treemap_size_scale = d3.scale.linear()
		.domain([0, .33])
		.range([0, 6 - 1e-6])
		.clamp(true);
	treemap_change_scale = d3.scale.linear()
		.domain([-.03, .03])
		.range([0, 6 - 1e-6])
		.clamp(true);
	function color_treemap(scale, d, rf, c) {
		if (isNaN(d.value)) {
			return 'none';
		}
		else if (d.cause_viz == 'T') {
			return 'white';
		}
		else if (scale == 'group') {
			return treemap_color_list[d.cause_viz.substr(0,1)][3];
		}
		else if (scale == 'size') {
			var v = treemap_size_scale(d.value);
			return treemap_interps[d.cause_viz.substr(0,1)][Math.floor(v)](v - Math.floor(v));
		}
		else if (scale == 'risk') {
			return rf == 'b' ? treemap_color_list[d.cause_viz.substr(0,1)][1] : treemap_color_list[d.cause_viz.substr(0,1)][5];
		}
		else if (scale == 'change') {
			if (d.cause_viz.length == 3) return '#444';
			else {
				var val2005 = retrieve_value(settings['metric_' + c], settings['age_' + c], lookups['reverse_year']['2005'], 'rate', settings['geo_' + c], settings['sex_' + c], d.cause_viz),
					val2010 = retrieve_value(settings['metric_' + c], settings['age_' + c], lookups['reverse_year']['2010'], 'rate', settings['geo_' + c], settings['sex_' + c], d.cause_viz),
					chg = Math.log(val2010 / val2005) / (2010-2005);
				var v = treemap_change_scale(chg);
				if (isNaN(chg)) return '#444';
				else return treemap_interps[d.cause_viz.substr(0,1)][Math.floor(v)](v - Math.floor(v));				
			}
		}
	}

// treeify the data
	treemap_data_A = {children: [], cause_viz: 'T'};
	treemap_leaves = cause_list.filter(function(d) { return d.leaf == 1;	});
	treemap_start_A.filter(function(d) {
		return lookups['cause'][d.cause_viz] ? parseInt(lookups['cause'][d.cause_viz].leaf) == 1 : 0;
	}).forEach(treeify_A);
	function treeify_A(node) {
		var i = node.cause_viz.lastIndexOf('_');
			p = i < 0 ? treemap_data_A : treeify_A({cause_viz: node.cause_viz.substring(0, i), children: []})
			n = p.children.length;
		for (j = -1; ++j < n;) {
			if (p.children[j].cause_viz === node.cause_viz) {
				return p.children[j];
			}
		}
		p.children.push(node);
		return node;
	}
	
	treemap_data_B = {children: [], cause_viz: 'T'};
	treemap_start_B.filter(function(d) {
		return lookups['cause'][d.cause_viz] ? parseInt(lookups['cause'][d.cause_viz].leaf) == 1 : 0;
	}).forEach(treeify_B);
	function treeify_B(node) {
		var i = node.cause_viz.lastIndexOf('_');
			p = i < 0 ? treemap_data_B : treeify_B({cause_viz: node.cause_viz.substring(0, i), children: []})
			n = p.children.length;
		for (j = -1; ++j < n;) {
			if (p.children[j].cause_viz === node.cause_viz) {
				return p.children[j];
			}
		}
		p.children.push(node);
		return node;
	}

// keep a list of which treemap data has been loaded
	appended_treemap_data = {};

// generate default treemap layout
	treemap_layout_A = d3.layout.treemap()
			.size([content_width * .8, height * .5 - 10])
			.value(function(d) { return d.treemap_start_val; })
			.padding(1)
			.sticky(true)
			.sort(function(a,b) { return a.depth == 1 ? (a.cause_viz == 'A' ? 1 : -1) : a.value - b.value; });
	treemap_layout_B = d3.layout.treemap()
			.size([content_width * .8, height * .5 - 10])
			.value(function(d) { return d.treemap_start_val; })
			.padding(1)
			.sticky(true)
			.sort(function(a,b) { return a.depth == 1 ? (a.cause_viz == 'A' ? 1 : -1) : a.value - b.value; });

// set the size of treemap labels
	min_treemap_label = .01;
	treemap_label_sizer = d3.scale.sqrt().domain([min_treemap_label, .5]).range([8,40]).clamp(true);

// find the indices of tree leaves to make inserting new data easier
	treemap_layout_A.nodes(treemap_data_A);
	var flat_indices = {};
	tree_indices = {};
	find_tree_indices(treemap_data_A);
	function find_tree_indices(data) {
		data['children'].map(function(d,i) { 
			flat_indices[d.cause_viz] = i; 
			if (typeof d['children'] != 'undefined') find_tree_indices(d);
			treeify_indices(d.cause_viz);
		})
		function treeify_indices(cause_viz) {
			var cs = cause_viz.split('_'),
				depth = cs.length,
				indices = [];
			for (j=1; j<=depth; j++) {
				indices.push(flat_indices[cs.slice(0,j).join('_')])
			}
			tree_indices[cause_viz] = indices;
		}
	}

// make a list of which depths a cause should be visible at
	var treemap_depth_visibility = {'T': false},
		treemap_highlight_visibility = {'T': false},
		treemap_cause_classes = {'A': {'T': {}}, 'B': {'T': {}}};
	$.map(tree_indices, function(i, c) {
		treemap_depth_visibility[c] = {};
		treemap_highlight_visibility[c] = {};
		treemap_cause_classes['A'][c] = {};
		treemap_cause_classes['B'][c] = {};
		$.map(lookups['tree_depth'], function(d) {
			var dd = 'treemap_data_A';
			i.map(function(j) { dd = dd + '["children"][' + j + ']'; });
			eval('var has_kids = ' + dd + '.hasOwnProperty("children")');
			if (d == 1) treemap_depth_visibility[c][d] = (i.length == d);
			else if (has_kids == false && (i.length <= d+1)) treemap_depth_visibility[c][d] = true;
			else treemap_depth_visibility[c][d] = (i.length == d+1);
			if (d == 1) treemap_highlight_visibility[c][d] = (i.length == d);
			else treemap_highlight_visibility[c][d] = (i.length <= d+1);
		});
		['cell', 'rect', 'clip', 'rf', 'label'].map(function(a) {
			AB.map(function(cc) {
				treemap_cause_classes[cc][c][a] = '';
				$.map(lookups['tree_depth'], function(d) {
					if (treemap_depth_visibility[c][d]) treemap_cause_classes[cc][c][a] = treemap_cause_classes[cc][c][a] + ' treemap_' + cc + '_' + d + '_' + a;
				});
			});
		});
	});

// function to change cause upon clicking the treemap
	function treemap_change_cause(new_cause) {
		if (settings['tree_click']) change_cause('AB', new_cause);
	}

// create placeholders for the various treemap components
	var tree_cells = {},
		tree_rects = {},
		tree_rfs = {},
		tree_labels = {},
		treemap_legends = {},
		tree_clips = {},
		tree_highlights = {};
			
// loop through sections A and B
	AB.map(function(c) {
		
	// add a g for this treemap
		g = d3.select('#' + c)
		  .append('g')
		  	.attr('id', 'treemap_' + c)
		  	.attr('transform', 'translate(' + (settings['chart_' + c] == 'treemap' ? content_buffer : -1 * content_width) + ',' + content_buffer + ')');
	
	// make cells for each cause
		tree_cells[c] = g.selectAll('tree_cells')
			.data(c == 'A' ? treemap_layout_A.nodes(treemap_data_A) : treemap_layout_B.nodes(treemap_data_B))
		  .enter().append('g')
		  	.attr('onclick', function(d) {
		  		return 'treemap_change_cause("' + d.cause_viz + '");';
		  	})
			.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })
			.attr('class', function(d) { return treemap_cause_classes[c][d.cause_viz]['cell'] + ' treemap_' + c + '_cell treemap_cell'; })
			.attr('title', function(d) { return lookups['cause'][d.cause_viz] ? lookups['cause'][d.cause_viz].cause_name : '' });
	
	
	// draw a rectangle for each cause
		tree_rects[c] = tree_cells[c].append('rect')
			.attr('width', function(d) { return d.dx; })
			.attr('height', function(d) { return d.dy; })
			.attr('stroke', 'white')
			.attr('stroke-width', function(d) { switch(d.depth) {
				case 0: 	return 0; 	break;
				case 1: 	return 3; 	break;
				case 2: 	return 2; 	break;
				case 3: 	return 1; 	break;
				default: 	return 1; 	break;
			}})
			.attr('class', function(d) { return treemap_cause_classes[c][d.cause_viz]['rect']; })
			.style('fill', function(d) { return color_treemap(settings['tree_color_' + c], d, 'b', c); });
	
	// rectangle overlays for risks
		tree_rfs[c]= tree_cells[c].append('rect')
			.attr('class', function(d) { return treemap_cause_classes[c][d.cause_viz]['rf']; })
			.attr('width', function(d) { return d3.max([0, d.dx * retrieve_treemap_rf(settings['geo_' + c], d.cause_viz, settings['sex_' + c], settings['tree_risk_' + c], settings['metric_' + c], settings['age_' + c], settings['year_' + c])]); })
			.attr('x', function(d) { switch(d.depth) {
				case 0: 	return 0; 	break;
				case 1: 	return 3; 	break;
				case 2: 	return 2; 	break;
				case 3: 	return 1; 	break;
				default: 	return 1; 	break;
			}})
			.attr('y', function(d) { switch(d.depth) {
				case 0: 	return 0; 	break;
				case 1: 	return 3; 	break;
				case 2: 	return 2; 	break;
				case 3: 	return 1; 	break;
				default: 	return 1; 	break;
			}})
			.attr('height', function(d) { switch(d.depth) {
				case 0: 	return d3.max([0,d.dy-0]); 	break;
				case 1: 	return d3.max([0,d.dy-3*2]); 	break;
				case 2: 	return d3.max([0,d.dy-2*2]); 	break;
				case 3: 	return d3.max([0,d.dy-1*2]); 	break;
				default: 	return d3.max([0,d.dy-1*2]); 	break;
			}})
			.attr('stroke', 'none')
			.style('fill', function(d) { return color_treemap(settings['tree_color_' + c], d, 'r', c); });
	
	tree_clips[c] = tree_cells[c].append('clipPath')
		.attr('id', function(d) {
			 return 'tree_clip_' + c + '_' + d.cause_viz;
		})
	  .append('rect')
		.attr('class', function(d) { return treemap_cause_classes[c][d.cause_viz]['clip']; })
	  	.attr('clip-rule', 'nonzero')
	  	.attr('width', function(d) { return d.dx >= 0 ? d.dx : 0; })
		.attr('height', function(d) { return d.dy >= 0 ? d.dy : 0; });
	tree_labels[c] = tree_cells[c].append('text')
		.attr('class', function(d) { return treemap_cause_classes[c][d.cause_viz]['label'] + ' treemap_label'; })
		.attr('x', 0)
		.text(function(d) { return lookups['cause'][d.cause_viz] ? lookups['cause'][d.cause_viz].cause_short : ''; })
		.attr('dx', function(d) {
			 return ((d.dy > 1.3*d.dx ? treemap_label_sizer(d.value) : 0) + 8) + 'px';
		})
		.attr('dy', function(d) {
			return d.dy > 1.3*d.dx ? '6px' : '2px';
		})
		.attr('clip-path', function(d) {
			return 'url(#tree_clip_' + c + '_' + d.cause_viz + ')';
		})
		.attr('font-size', function(d) { return treemap_label_sizer(d.value) + 'px'; })
		.style('opacity', function(d) { return d.value >= min_treemap_label ? 1 : 1e-6})
		.style('writing-mode', function(d) { return d.dy > 1.3*d.dx ? 'tb' : 'lr'; });
	
	// add mouseover titles to each cause
		$('.treemap_' + c + '_cell').poshytip({
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
		
	// add a rectangle to highlight the selected cause
		tree_highlights[c] = g.append('rect')
			.style('stroke', 'black')
			.style('fill', 'none')
			.style('stroke-width', 2)
			.style('pointer-events', 'none');
		
	// add legends
		treemap_legends[c] = g.selectAll()
			.data(tree_color_options)
		  .enter().append('g')
		  	.attr('transform', 'translate(' + (content_width * .9 - 5) + ',75)')
		  	.attr('id', function(d) {
		  		return 'tree_legend_' + c + '_' + d.val
		  	})
		  	.style('opacity', function(d) {
		  		return d.val == settings['tree_color_' + c] ? 1 : 0;
		  	});
	
	// size legend
		var l = d3.select('#tree_legend_' + c + '_size');
		l.append('text')
			.text('Proportion of ')
			.attr('class', 'treemap_legend_text')
			.attr('y', -14)
			.attr('x', 12)
			.style('font-size', '14px');
		 l.append('text')
			.text(metric_list.filter(function(d) { return settings['metric_' + c] == d.val; })[0].short)
			.attr('class', 'treemap_legend_text')
			.attr('id', 'treemap_size_title_' + c)
			.attr('x', 12)
			.style('font-size', '14px');
		var m = l.append('g')
			.attr('transform', 'translate(-32,20)');
		['A', 'B', 'C'].map(function(d, i) {
			d3.range(100).reverse().map(function(j) {
				m.append('rect')
					.attr('width', 28)
					.attr('height', 2)
					.attr('x', i * 31 + 2)
					.attr('y', j * 2)
					.style('stroke', 'none')
					.style('fill', treemap_interps[d][Math.floor(j/100 * 6)]((j/100 * 6) - Math.floor(j/100 * 6)));
			});
		});
		var sc = d3.scale.linear().domain([0, .33]).range([0, 198]),
			ax = d3.svg.axis().scale(sc).ticks(5).orient('left').tickSize(4);
		m.append('g')
			.attr('transform', 'translate(0, 0)')
			.attr('class', 'tree axis')
			.call(ax);

	// change legend
		var l = d3.select('#tree_legend_' + c + '_change');
		l.append('text')
			.text('Annual % Change')
			.attr('class', 'treemap_legend_text')
			.attr('y', -26)
			.attr('x', 12)
			.style('font-size', '14px');
		l.append('text')
			.text('2005 to 2010')
			.attr('class', 'treemap_legend_text')
			.attr('y', -12)
			.attr('x', 12)
			.style('font-size', '14px');
		 l.append('text')
			.text(metric_list.filter(function(d) { return settings['metric_' + c] == d.val; })[0].short + ' per 100,000')
			.attr('class', 'treemap_legend_text')
			.attr('id', 'treemap_change_title_' + c)
			.attr('x', 12)
			.style('font-size', '12px');
		var m = l.append('g')
			.attr('transform', 'translate(-32,20)');
		['A', 'B', 'C'].map(function(d, i) {
			d3.range(100).reverse().map(function(j) {
				m.append('rect')
					.attr('width', 28)
					.attr('height', 2)
					.attr('x', i * 31 + 2)
					.attr('y', j * 2)
					.style('stroke', 'none')
					.style('fill', treemap_interps[d][Math.floor(j/100 * 6)]((j/100 * 6) - Math.floor(j/100 * 6)));
			});
		});
		var sc = d3.scale.linear().domain([-3, 3]).range([0, 198]),
			ax = d3.svg.axis().scale(sc).ticks(7).orient('left').tickSize(4);
		m.append('g')
			.attr('transform', 'translate(0, 0)')
			.attr('class', 'tree axis')
			.call(ax);

	// group legend
		var l = d3.select('#tree_legend_' + c + '_group');
		[{ val: 'A', name: 'Group I' },
		{ val: 'B', name: 'Group II' },
		{ val: 'C', name: 'Group III' }].map(function(d, i) {
			var m = l.append('g')
					.attr('transform', 'translate(-50,' + (i*50 + 50) + ')');
			m.append('rect')	
				.attr('width', 20)
				.attr('height', 20)
				.style('stroke', 'none')
				.style('fill', treemap_color_list[d.val][3]);
			m.append('text')
				.attr('x', 60)
				.attr('y', 10)
				.style('alignment-baseline', 'middle')
				.text(d.name)
				.attr('class', 'treemap_legend_text')
				.style('font-size', '14px');
		})
	
	// risk legend
		var l = d3.select('#tree_legend_' + c + '_risk');
		l.append('text')
			.attr('id', 'tree_legend_' + c + '_risk_l1')
			.attr('y', 0)
			.attr('x', 0)
			.attr('class', 'treemap_legend_text')
			.style('font-size', '14px')
			.text(metric_list.filter(function(d) { return settings['metric_' + c] == d.val; })[0].short);
		l.append('text')
			.attr('y', 15)
			.attr('x', 0)
			.attr('class', 'treemap_legend_text')
			.style('font-size', '14px')
			.text('attributable to');
		l.append('text')
			.attr('id', 'tree_legend_' + c + '_risk_l2')
			.attr('y', 30)
			.attr('x', 0)
			.attr('class', 'treemap_legend_text')
			.style('font-size', '14px')
			.text(risk_list.filter(function(d) {
				 	return d.risk == settings['tree_risk_' + c]; 
				 })[0].risk_short);
		
		l.append('text')
			.attr('id', 'tree_legend_' + c + '_risk_l3')
			.attr('y', 120)
			.attr('x', 0)
			.attr('class', 'treemap_legend_text')
			.style('font-size', '14px')
			.text(metric_list.filter(function(d) { return settings['metric_' + c] == d.val; })[0].short);
		l.append('text')
			.attr('y', 135)
			.attr('x', 0)
			.attr('class', 'treemap_legend_text')
			.style('font-size', '14px')
			.text('not attributable to');
		l.append('text')
			.attr('y', 150)
			.attr('x', 0)
			.attr('id', 'tree_legend_' + c + '_risk_l4')
			.attr('class', 'treemap_legend_text')
			.style('font-size', '14px')
			.text(risk_list.filter(function(d) {
				 	return d.risk == settings['tree_risk_' + c]; 
				 })[0].risk_short);
		
		['A', 'B', 'C'].map(function(d, i) {
			l.append('rect')
				.attr('x', i*35 - 48)
				.attr('y', 45)
				.attr('width', 30)
				.attr('height', 30)
				.style('stroke', 'none')
				.style('fill', treemap_color_list[d][5]);
			l.append('rect')
				.attr('x', i*35 - 48)
				.attr('y', 165)
				.attr('width', 30)
				.attr('height', 30)
				.style('stroke', 'none')
				.style('fill', treemap_color_list[d][1]);
		})
		
	
	});

// update the treemap
	var current_cause = { 'A' : '',	'B' : ''},
		current_depth = { 'A' : '',	'B' : ''};
	function refresh_treemap(c, dur) {
		if (typeof dur == 'undefined') var dur = 1000;
		
	// find desired geo/sex/age/year/metric
		var geo = settings['geo_' + c],
			sex = settings['sex_' + c],
			year = settings['year_' + c],
			age = settings['age_' + c],
			metric = settings['metric_' + c],
			cause = settings['cause_' + c],
			unit = settings['unit_' + c],
			chart = settings['chart_' + c],
			depth = settings['tree_depth_' + c],
			tree_color = settings['tree_color_' + c],
			risk = settings['tree_risk_' + c];
	
	// update only if this chart is displayed
		if (chart == 'treemap') {
			
		// attach the data to the treemap structure if it hasn't been already
			if (appended_treemap_data[geo + '_' + sex + '_' + c + '_' + metric] != 1) {
				add_treemap_data(geo, sex, metric, c);
			}
			
		// update the data
			if (c == 'A') {
				treemap_layout_A.nodes(treemap_data_A);
				treemap_layout_A.value(function(d) {
					return d[settings['geo_A'] + '_' + settings['sex_A']] ? (d[settings['geo_A'] + '_' + settings['sex_A']][settings['metric_A']] ? parseFloat(d[settings['geo_A'] + '_' + settings['sex_A']][settings['metric_A']]['m' + settings['age_A'] + '_' + settings['year_A']]) : 0) : 0;
				});
				tree_cells['A'].data(treemap_layout_A);	
			}
			else if (c == 'B') {
				treemap_layout_B.nodes(treemap_data_B);
				treemap_layout_B.value(function(d) {
					return d[settings['geo_B'] + '_' + settings['sex_B']] ? (d[settings['geo_B'] + '_' + settings['sex_B']][settings['metric_B']] ? parseFloat(d[settings['geo_B'] + '_' + settings['sex_B']][settings['metric_B']]['m' + settings['age_B'] + '_' + settings['year_B']]) : 0) : 0;
				});
				tree_cells['B'].data(treemap_layout_B);	
			}
		
		// set which rectangles are visible
			tree_cells[c]
				.style('visibility', function(d) {
					return treemap_depth_visibility[d.cause_viz][depth] ? 'visible' : 'hidden'
				});
		
		// move the rectangles
			d3.selectAll('.treemap_' + c + '_' + depth + '_cell')
				.transition()
				.ease('linear')
				.duration(current_depth[c] == depth ? dur : 0)
				.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });
		  	
		// change the rectangles' sizes and colors
			d3.selectAll('.treemap_' + c + '_' + depth + '_rect')
			  	.transition()
			  	.ease('linear')
				.duration(current_depth[c] == depth ? dur : 0)
				.attr('width', function(d) { return d.dx >= 0 ? d.dx : 0; })
				.attr('height', function(d) { return d.dy >= 0 ? d.dy : 0; })
				.style('fill', function(d) { return color_treemap(settings['tree_color_' + c], d, 'b', c); });
		
		// find position of highlight
			var cause_index = tree_indices[cause],
				dd = 'treemap_data_' + c;
			cause_index.map(function(i) { dd = dd + '["children"][' + i + ']'; });
			eval('var highlight = ' + dd);
		
		// move the highlight
			tree_highlights[c]
				.transition()
				.duration(current_cause[c] == cause ? dur: 0)
				.ease('linear')
				.attr('x', highlight.x)
				.attr('y', highlight.y)
				.attr('width', highlight.dx)
				.attr('height', highlight.dy)
				.style('stroke-opacity', treemap_highlight_visibility[cause][depth] ? 1 : 1e-6);
			current_cause[c] = cause;
		
		// update risk overlays
			if (tree_color == 'risk') {
				d3.selectAll('.treemap_' + c + '_' + depth + '_rf')
					.transition()
					.ease('linear')
					.duration(dur)
					.attr('x', function(d) { switch(d.depth) {
						case 0: 	return 0; 	break;
						case 1: 	return 3; 	break;
						case 2: 	return 2; 	break;
						case 3: 	return 1; 	break;
						default: 	return 1; 	break;
					}})
					.attr('y', function(d) { switch(d.depth) {
						case 0: 	return 0; 	break;
						case 1: 	return 3; 	break;
						case 2: 	return 2; 	break;
						case 3: 	return 1; 	break;
						default: 	return 1; 	break;
					}})
					.attr('width', function(d) { return d3.max([0, d.dx * retrieve_treemap_rf(geo, d.cause_viz, sex, risk, metric, age, year)]); })
					.attr('height', function(d) { switch(d.depth) {
						case 0: 	return d3.max([0,d.dy-0]); 	break;
						case 1: 	return d3.max([0,d.dy-3*2]); 	break;
						case 2: 	return d3.max([0,d.dy-2*2]); 	break;
						case 3: 	return d3.max([0,d.dy-1*2]); 	break;
						default: 	return d3.max([0,d.dy-1*2]); 	break;
					}})
					.style('fill-opacity', 1)
					.style('fill', function(d) { return color_treemap('risk', d, 'r', c); });			
			}
			else {
				tree_rfs[c]
					.transition()
					.ease('linear')
					.duration(dur)
					.style('fill-opacity', 1e-6);
			}
		
		// update the label sizes
			d3.selectAll('.treemap_' + c + '_' + depth + '_clip')
				.transition()
				.ease('linear')
				.duration(current_depth[c] == depth ? dur : 0)
			  	.attr('width', function(d) { return d.dx >= 0 ? d.dx : 0; })
				.attr('height', function(d) { return d.dy >= 0 ? d.dy : 0; });
			d3.selectAll('.treemap_' + c + '_' + depth + '_label')
				.transition()
				.ease('linear')
				.duration(current_depth[c] == depth ? dur : 0)
			  	.attr('dx', function(d) {
					 return ((d.dy > 1.3*d.dx ? treemap_label_sizer(d.value) : 0) + 8) + 'px';
				})
				.attr('dy', function(d) {
					return d.dy > 1.3*d.dx ? '6px' : '2px';
				})
				.attr('font-size', function(d) { return treemap_label_sizer(d.value) + 'px'; })
				.style('opacity', function(d) { return d.value >= min_treemap_label ? 1 : 1e-6})
				.style('writing-mode', function(d) { return d.dy > 1.3*d.dx ? 'tb' : 'lr'; });
		
		// update legends
			d3.select('#treemap_size_title_' + c).text(metric_list.filter(function(d) { return settings['metric_' + c] == d.val; })[0].short);
			d3.select('#treemap_change_title_' + c).text(metric_list.filter(function(d) { return settings['metric_' + c] == d.val; })[0].short + ' per 100,000')
			d3.select('#tree_legend_' + c + '_risk_l1').text(metric_list.filter(function(d) { return settings['metric_' + c] == d.val; })[0].short);
			d3.select('#tree_legend_' + c + '_risk_l2').text(risk_list.filter(function(d) { return d.risk == settings['tree_risk_' + c]; })[0].risk_short);
			d3.select('#tree_legend_' + c + '_risk_l3').text(metric_list.filter(function(d) { return settings['metric_' + c] == d.val; })[0].short);
			d3.select('#tree_legend_' + c + '_risk_l4').text(risk_list.filter(function(d) { return d.risk == settings['tree_risk_' + c]; })[0].risk_short);
		
		// show only the applicable legend
			treemap_legends[c].transition().duration(dur)
			  	.style('opacity', function(d) {
			  		return d.val == settings['tree_color_' + c] ? 1 : 1e-6;
			  	});
			 
		// update current settings
			current_depth[c] = depth;
		}
	}

// insert new data into the correct leaves of the tree object
	function add_treemap_data(geo, sex, metric, c) {
		
		// grab the input data
		var new_data = retrieve_treemap_data(geo, sex, metric);
		
		// extract the leaves for this geo/sex
		var new_leaves = [];
		treemap_leaves.map(function(d) {
			if (new_data[d.cause_viz]) new_leaves.push(new_data[d.cause_viz]);
		});
		
		// append the new data as leaves to the tree
		new_leaves.map(append_leaf, { geo: geo, sex: sex, c: c, metric: metric });
		
		// mark the data as loaded
		appended_treemap_data[geo + '_' + sex + '_' + c + '_' + metric] = 1;
	}

				
// this fellow recursively adds the data for selected geo, age, sex, year to the existing tree
		function append_leaf(leaf) {
			var cause_index = tree_indices[leaf.cause_viz],
				dd = 'treemap_data_' + this['c'];
			if (typeof cause_index != 'undefined') cause_index.map(function(i) { dd = dd + '["children"][' + i + ']'; });
			eval('if (typeof ' + dd + '["' + this['geo'] + '_' + this['sex'] + '"] == "undefined") ' + dd + '["' + this['geo'] + '_' + this['sex'] + '"]  = {};');
			eval(dd + '["' + this['geo'] + '_' + this['sex'] + '"]["' + this['metric'] + '"] = leaf;');
		}



