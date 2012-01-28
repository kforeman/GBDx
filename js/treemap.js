/*	Author: 	Kyle Foreman (kforeman@post.harvard.edu)
	Date:		7 January 2012
	Purpose:	Generate treemaps
*/

// treemap colors
	var treemap_color_list = {
			D: colorbrewer['Reds'][9].splice(2,7),
			E: colorbrewer['Blues'][9].splice(2,7),
			F: colorbrewer['Greens'][9].splice(2,7) 
		};
		treemap_interps = {};
	['D', 'E', 'F'].map(function(c) {	
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
			var datum = retrieve_datum(settings['geo_' + c], d.cause_viz, settings['sex_' + c]);
			if (typeof datum != 'undefined') {
				var val2005 = retrieve_value(datum, settings['metric_' + c], 'm', settings['age_' + c], lookups['reverse_year']['2005'], 'rate', settings['geo_' + c], settings['sex_' + c]),
					val2010 = retrieve_value(datum, settings['metric_' + c], 'm', settings['age_' + c], lookups['reverse_year']['2010'], 'rate', settings['geo_' + c], settings['sex_' + c]),
					chg = Math.log(val2010 / val2005) / (2010-2005);
				var v = treemap_change_scale(chg);
				if (isNaN(chg)) return '#444';
				else return treemap_interps[d.cause_viz.substr(0,1)][Math.floor(v)](v - Math.floor(v));				
			}
			else {
				return '#444';
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
	loaded_treemap_data = {};

// generate default treemap layout
	treemap_layout_A = d3.layout.treemap()
			.size([content_width * .8, height * .5 - 10])
			.value(function(d) { return d.treemap_start_val; })
			.padding(1)
			.sticky(true)
			.sort(function(a,b) { return a.depth == 1 ? (a.cause_viz == 'D' ? 1 : -1) : a.value - b.value; });
	treemap_layout_B = d3.layout.treemap()
			.size([content_width * .8, height * .5 - 10])
			.value(function(d) { return d.treemap_start_val; })
			.padding(1)
			.sticky(true)
			.sort(function(a,b) { return a.depth == 1 ? (a.cause_viz == 'D' ? 1 : -1) : a.value - b.value; });

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

// create placeholders for the various treemap components
	var tree_cells = {},
		tree_rects = {},
		tree_rfs = {},
		tree_labels = {},
		treemap_legends = {},
		tree_clips = {};
			
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
		  	//.style('opacity', function(d) {
		  	//	 return d.depth <= settings['tree_depth_' + c] + (settings['tree_depth_' + c] >= 2 ? 1 : 0) ? 1 : 1e-6;
		  	//})
		  	//.style('visibility', function(d) {
		  		//return d.depth <= settings['tree_depth_' + c] + (settings['tree_depth_' + c] >= 2 ? 1 : 0) ? 'visible' : 'hidden' 
		  	//	return (d.depth == (settings['tree_depth_' + c] + (settings['tree_depth_' + c] >= 2 ? 1 : 0))) || (d.children == null && d.depth <= (settings['tree_depth_' + c] + (settings['tree_depth_' + c] >= 2 ? 1 : 0))) ? 'visible' : 'hidden'
		  	//})
			.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })
			.attr('class', function(d) { return 'treemap_' + c + '_' + d.depth + ' treemap_' + c + '_cell'; })
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
			.style('fill', function(d) { return color_treemap(settings['tree_color_' + c], d, 'b', c); });
	
	// rectangle overlays for risks
		tree_rfs[c]= tree_cells[c].append('rect')
			.attr('width', function(d) { return d3.max([0, d.dx * retrieve_rf(settings['geo_' + c], d.cause_viz, settings['sex_' + c], settings['tree_risk_' + c], settings['metric_' + c], settings['age_' + c], settings['year_' + c])]); })
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
			//.attr('height', function(d) { return d.dy; })
			.attr('stroke', 'none')
			.style('fill', function(d) { return color_treemap(settings['tree_color_' + c], d, 'r', c); });
	
	// add labels for each cause
	/*	tree_labels[c] = tree_cells[c].append('text')
			.attr('id', function(d) { return 'tree_label_' + c + '_' + d.cause_viz; })
			.attr('x', 0)
			.attr('dx', '2px')
			.attr('dy', '.9em')
			.attr('class', 'treemap_label')
			.each(treemap_font_size);*/
	tree_clips[c] = tree_cells[c].append('clipPath')
		.attr('id', function(d) {
			 return 'tree_clip_' + c + '_' + d.cause_viz;
		})
	  .append('rect')
	  	.attr('clip-rule', 'nonzero')
	  	.attr('width', function(d) { return d.dx >= 0 ? d.dx : 0; })
		.attr('height', function(d) { return d.dy >= 0 ? d.dy : 0; });
	tree_labels[c] = tree_cells[c].append('text')
		.attr('x', 0)
		.attr('class', 'treemap_label')
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
		['D', 'E', 'F'].map(function(d, i) {
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
		['D', 'E', 'F'].map(function(d, i) {
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
		[{ val: 'D', name: 'Group I' },
		{ val: 'E', name: 'Group II' },
		{ val: 'F', name: 'Group III' }].map(function(d, i) {
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
		
		['D', 'E', 'F'].map(function(d, i) {
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
		
// update the depth of the treemaps
/*	function refresh_treemap_depth(c) {
			console.log('refreshing depth ' + c)
		d3.selectAll('.treemap_' + c + '_cell').style('visibility', 'visible')
		refresh_treemap(c, 0);
		d3.range(max_tree_depth).map(function(d) {
			d3.selectAll('.treemap_' + c + '_' + (d+1))
				.transition()
				//.style('visibility', 'visible')
				//.transition()
			//	.duration(1)
			//	.delay(1)
				.duration(1000)
				.style('opacity', (d+1) <= (settings['tree_depth_' + c] + (settings['tree_depth_' + c] >= 2 ? 1 : 0)) ? 1 : 1e-6)
			//	.transition()
			//	.delay(1000)
			//	.style('visibility', function(i) {
			//		return ((d+1) == (settings['tree_depth_' + c] + (settings['tree_depth_' + c] >= 2 ? 1 : 0))) || (i.children == null && (d+1) <= (settings['tree_depth_' + c] + (settings['tree_depth_' + c] >= 2 ? 1 : 0))) ? 'visible' : 'hidden' 
			//	});
				
		});
		refresh_treemap(c, 0);
	}
*/
// size text inside of the treemap
	/*function treemap_font_size(d) {
		var size = d.dx/5,
			words = [lookups['cause'][d.cause_viz] && d.value > .01 ? lookups['cause'][d.cause_viz].cause_short : ''],
			word = words[0],
			width = d.dx*.8,
			height = d.dy*.9,
			length = 0;
		d3.select(this).style('font-size', size + 'px').text(word);
		while(((this.getBBox().width >= width) || (this.getBBox().height >= height)) && (size > 12)) {
  			size--;
  			d3.select(this).style('font-size', size + 'px');
  			this.firstChild.data = word;
 		}
	}*/

// update the treemap
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
			chart = settings['chart_' + c];
	
	// update only if this chart is displayed
		if (chart == 'treemap') {
			
		// attach the data to the treemap structure if it hasn't been already
			if (loaded_treemap_data[geo + '_' + sex + '_' + c] != 1) {
				add_treemap_data(geo, sex, c);
			}
			
		// update the data
			if (c == 'A') {
				treemap_layout_A.nodes(treemap_data_A);
				treemap_layout_A.value(function(d) {
					return d[settings['geo_A'] + '_' + settings['sex_A']] ? parseFloat(d[settings['geo_A'] + '_' + settings['sex_A']][settings['metric_A'] + '_m_' + settings['age_A'] + '_' + settings['year_A']]) : 0;
				});
				tree_cells['A'].data(treemap_layout_A);	
			}
			else if (c == 'B') {
				treemap_layout_B.nodes(treemap_data_B);
				treemap_layout_B.value(function(d) {
					return d[settings['geo_B'] + '_' + settings['sex_B']] ? parseFloat(d[settings['geo_B'] + '_' + settings['sex_B']][settings['metric_B'] + '_m_' + settings['age_B'] + '_' + settings['year_B']]) : 0;
				});
				tree_cells['B'].data(treemap_layout_B);	
			}

		
		// move the rectangles
			tree_cells[c]
				.transition()
				.ease('linear')
				.duration(dur)
				.attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; })
				.style('visibility', function(d) {
		  		//return d.depth <= settings['tree_depth_' + c] + (settings['tree_depth_' + c] >= 2 ? 1 : 0) ? 'visible' : 'hidden' 
		  			return (d.depth == (settings['tree_depth_' + c] + (settings['tree_depth_' + c] >= 2 ? 1 : 0))) || (d.children == null && d.depth <= (settings['tree_depth_' + c] + (settings['tree_depth_' + c] >= 2 ? 1 : 0))) ? 'visible' : 'hidden'
		  		});
		  	
		// change the rectangles' sizes and colors
			tree_rects[c]
			  	.transition()
			  	.ease('linear')
			  	.duration(dur)
				.attr('width', function(d) { return d.dx >= 0 ? d.dx : 0; })
				.attr('height', function(d) { return d.dy >= 0 ? d.dy : 0; })
				.style('fill', function(d) { return color_treemap(settings['tree_color_' + c], d, 'b', c); });
		
		// update risk overlays
			tree_rfs[c]
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
				.attr('width', function(d) { return d3.max([0, d.dx * retrieve_rf(settings['geo_' + c], d.cause_viz, settings['sex_' + c], settings['tree_risk_' + c], settings['metric_' + c], settings['age_' + c], settings['year_' + c])]); })
				.attr('height', function(d) { switch(d.depth) {
					case 0: 	return d3.max([0,d.dy-0]); 	break;
					case 1: 	return d3.max([0,d.dy-3*2]); 	break;
					case 2: 	return d3.max([0,d.dy-2*2]); 	break;
					case 3: 	return d3.max([0,d.dy-1*2]); 	break;
					default: 	return d3.max([0,d.dy-1*2]); 	break;
				}})
				.style('fill-opacity', settings['tree_color_' + c] == 'risk' ? 1 : 0)
				.style('fill', function(d) { return color_treemap(settings['tree_color_' + c], d, 'r', c); });
		
		// update the label sizes
			tree_clips[c]
			  	.transition()
			  	.ease('linear')
			  	.duration(dur)
			  	.attr('width', function(d) { return d.dx >= 0 ? d.dx : 0; })
				.attr('height', function(d) { return d.dy >= 0 ? d.dy : 0; });
			tree_labels[c]
			  	.transition()
			  	.ease('linear')
			  	.duration(dur)
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
			  		return d.val == settings['tree_color_' + c] ? 1 : 0;
			  	});
		}
	}

// insert new data into the correct leaves of the tree object
	function add_treemap_data(geo, sex, c) {
		
		// grab the input data
		var new_data = retrieve_data_by_geo_sex(geo, sex);
		
		// extract the leaves for this geo/sex
		var new_leaves = [];
		treemap_leaves.map(function(d) {
			if (new_data[d.cause_viz]) new_leaves.push(new_data[d.cause_viz]);
		});
		
		// append the new data as leaves to the tree
		new_leaves.map(append_leaf, { geo: geo, sex: sex, c: c });
		
		// mark the data as loaded
		loaded_treemap_data[geo + '_' + sex + '_' + c] = 1;
	}

		
				
// this fellow recursively adds the data for selected geo, age, sex, year to the existing tree
		function append_leaf(leaf) {
			var cause_index = tree_indices[leaf.cause_viz],
				d = 'treemap_data_' + this['c'];
			if (typeof cause_index != 'undefined') cause_index.map(function(i) { d = d + '["children"][' + i + ']'; });
			eval(d + '["' + this['geo'] + '_' + this['sex'] + '"] = leaf;');
		}



