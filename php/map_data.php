<?php
/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		29 January 2012
	Purpose:	Load data from mysql for maps
	Arguments:	cause_viz, sex, metric
*/

	// load in mysql server configuration
	include 'mysql_config.php';

	// connect to the database
	$link = mysql_connect($host, $username, $password);
	$db = mysql_select_db($db, $link);
	
	// figure out which columns to grab
	$metric = mysql_real_escape_string($_GET['metric']);
	$result = mysql_query('DESC gbdx_cfs'); 
	$columns = array(); 
	while (list($column) = mysql_fetch_array($result))
  		if (substr($column,0,(strlen($metric)+2)) == $metric.'_m') 
    		$columns[] = $column.' AS m'.substr($column,(strlen($metric)+3)); 
	$columns = join(',',$columns);

	// perform the query
	$rows = array();
	$cause_viz = mysql_real_escape_string($_GET['cause_viz']);
	$sex = mysql_real_escape_string($_GET['sex']);
	$result = mysql_query('SELECT geo_sex,'.$columns.' FROM gbdx_cfs WHERE cause_viz="'.$cause_viz.'" AND geo_sex LIKE "%_'.$sex.'";');
	while($row = mysql_fetch_array($result, MYSQL_ASSOC))
    	$rows[] = $row;
    
    // return the results
	if (count($rows)) echo json_encode($rows, JSON_NUMERIC_CHECK);
	else echo '"failure"';
?>