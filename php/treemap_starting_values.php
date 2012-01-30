<?php
/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		7 January 2012
	Purpose:	Default treemap starting positions (global average for now)
*/

	// load in mysql server configuration
	include 'mysql_config.php';

	// connect to the database
	$link = mysql_connect($host, $username, $password);
	$db = mysql_select_db($db, $link);

	// perform the query
	$rows = array();
	$result = mysql_query('SELECT cause_viz, AVG(daly_m_22_3) AS treemap_start_val FROM gbd_cfs WHERE geo_sex="G_M" OR geo_sex="G_F" GROUP BY (cause_viz);');
	while($row = mysql_fetch_array($result, MYSQL_ASSOC))
    	$rows[] = $row;
		
	// return the results in json format
	if (count($rows)) echo json_encode($rows);
	else echo '"failure"';
?>