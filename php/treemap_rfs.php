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
	$result = mysql_query('DESC gbdx_rfs'); 
	$columns = array(); 
	$metric = mysql_real_escape_string($_GET['metric']);
	while (list($column) = mysql_fetch_array($result))
  		if (substr($column,0,strlen($metric)+3) == $metric.'_pc') 
    		$columns[] = $column.' AS m'.substr($column,(strlen($metric)+1)); 
	$columns = join(',',$columns);

	// perform the query
	$rows = array();
	$geo_sex = mysql_real_escape_string($_GET['geo_sex']);
	$risk = mysql_real_escape_string($_GET['risk']);
	$result = mysql_query('SELECT cause_viz,geo_sex,'.$columns.' FROM gbdx_rfs WHERE geo_sex="'.$geo_sex.'" AND risk="'.$risk.'";');
	while($row = mysql_fetch_array($result, MYSQL_ASSOC))
    	$rows[] = $row;
    
    // return the results
	if (count($rows)) echo json_encode($rows);
	else echo '"failure"';
?>