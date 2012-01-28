<?php
/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		9 January 2012
	Purpose:	Load data from mysql for treemaps
	Arguments:	geo_sex
*/

	// load in mysql server configuration
	include 'mysql_config.php';

	// connect to the database
	$pdo = new PDO($dsn, $username, $password);
	
	// make an empty array in which to put the data
	$rows = array();
	
	// prepare the query for this geo_sex
	$stmt = $pdo->prepare('SELECT * FROM gbd_cfs WHERE geo_sex="'.$_GET['geo_sex'].'";');

	// query the database
	$stmt->execute(array($_GET['geo_sex']));
	
	// save the mysql results into an array
	$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
	
	// return the results in json format
	if (count($rows)) echo json_encode($rows);
	else echo '"failure"';
?>