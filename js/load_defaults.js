/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		10 January 2012
	Purpose:	Switch all the charts to their default state
*/

AB.map(function(c) {
	refresh_treemap(c);
	refresh_map(c);
	refresh_time_age(c);
});
