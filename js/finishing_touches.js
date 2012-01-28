/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		10 January 2012
	Purpose:	Create basic 3 section layout for GBD tool
*/

// add rectangles for the contents
	A.append('rect')
		.attr('x', .5)
		.attr('y', .5)
		.attr('width', (content_width - 1) + 'px')
		.attr('height', ((height / 2) - 1) + 'px')
		.attr('rx', 4)
		.attr('ry', 4)
		.attr('class', 'content_rect');
	B.append('rect')
		.attr('x', .5)
		.attr('y', .5)
		.attr('width', (content_width - 1) + 'px')
		.attr('height', ((height / 2) - 1) + 'px')
		.attr('rx', 4)
		.attr('ry', 4)
		.attr('class', 'content_rect');