<?php
/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		7 January 2012
	Purpose:	Default treemap starting positions (global average for now)
*/

	// load in mysql server configuration
	include 'mysql_config.php';

	// connect to the database
	$pdo = new PDO($dsn, $username, $password);
	
	// make an empty array in which to put the data
	$rows = array();
	
	// prepare the query
	$stmt = $pdo->prepare('SELECT cause_viz, AVG(daly_m_22_3) AS treemap_start_val FROM gbd_cfs WHERE geo_sex="G_M" OR geo_sex="G_F" GROUP BY (cause_viz);');

	// query the database
	$stmt->execute(array('default'));
	
	// save the mysql results into an array
	$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
	
	// return the results in json format
	if (count($rows)) echo json_encode($rows);
	else echo '"failure"';
?>