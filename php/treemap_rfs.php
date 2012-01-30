<?php
/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		11 January 2012
	Purpose:	Load data from mysql for risk factor treemaps
	Arguments:	geo_sex, risk, metric
*/

	// load in mysql server configuration
	include 'mysql_config.php';

	// connect to the database
	$link = mysql_connect($host, $username, $password);
	$db = mysql_select_db($db, $link);
	
	// figure out which columns to grab
	$result = mysql_query('DESC gbd_rfs'); 
	$columns = array(); 
	while (list($column) = mysql_fetch_array($result))
  		if (substr($column,0,strlen($_GET['metric'])) == $_GET['metric']) 
    		$columns[] = $column.' AS m'.substr($column,(strlen($_GET['metric'])+1)); 
	$columns = join(',',$columns);

	// perform the query
	$rows = array();
	$result = mysql_query('SELECT geo_sex,'.$columns.' FROM gbd_rfs WHERE geo_sex="'.$_GET['geo_sex'].'" AND risk="'.$_GET['risk'].'";');
	while($row = mysql_fetch_array($result, MYSQL_ASSOC))
    	$rows[] = $row;
    
    // return the results
	if (count($rows)) echo json_encode($rows);
	else echo '"failure"';
?>