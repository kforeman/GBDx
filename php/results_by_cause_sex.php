<?php
/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		9 January 2012
	Purpose:	Load data from mysql for maps
	Arguments:	cause_viz, sex
*/

	// load in mysql server configuration
	include 'mysql_config.php';

	// connect to the database
	$pdo = new PDO($dsn, $username, $password);
	
	// make an empty array in which to put the data
	$rows = array();
	
	// prepare the query for this cause_viz
	$stmt = $pdo->prepare('SELECT * FROM gbd_cfs WHERE cause_viz="'.$_GET['cause_viz'].'" AND geo_sex LIKE "%_'.$_GET['sex'].'";');

	// query the database
	$stmt->execute(array($_GET['cause_viz']));
	
	// save the mysql results into an array
	$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
	
	// return the results in json format
	if (count($rows)) echo json_encode($rows);
	else echo '"failure"';
?>