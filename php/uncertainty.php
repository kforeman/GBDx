<?php
/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		30 January 2012
	Purpose:	Load confidence intervals on a quantity
	Arguments:	geo_sex, cause, metric
*/

	// load in mysql server configuration
	include 'mysql_config.php';

	// connect to the database
	$link = mysql_connect($host, $username, $password);
	$db = mysql_select_db($db, $link);
	
	// figure out which columns to grab
	$result = mysql_query('DESC gbdx_cfs'); 
	$metric = mysql_real_escape_string($_GET['metric']);
	$columns = array(); 
	while (list($column) = mysql_fetch_array($result)) {
  		if (substr($column,0,(strlen($metric)+5)) == $metric.'_l_pc' || substr($column,0,(strlen($metric)+5)) == $metric.'_l_nm') {
    		$columns[] = $column.' AS l'.substr($column,(strlen($metric)+3)); 
  		}
		else if (substr($column,0,(strlen($metric)+5)) == $metric.'_u_pc' || substr($column,0,(strlen($metric)+5)) == $metric.'_u_nm') {
    		$columns[] = $column.' AS u'.substr($column,(strlen($metric)+3)); 
  		}
	}	
	$columns = join(',',$columns);

	// perform the query
	$rows = array();
	$geo_sex = mysql_real_escape_string($_GET['geo_sex']);
	$cause = mysql_real_escape_string($_GET['cause']);
	$result = mysql_query('SELECT '.$columns.' FROM gbdx_cfs WHERE geo_sex="'.$geo_sex.'" AND cause_viz="'.$cause.'";');
	while($row = mysql_fetch_array($result, MYSQL_ASSOC))
    	$rows[] = $row;
    
    // return the results
	if (count($rows)) echo json_encode($rows, JSON_NUMERIC_CHECK);
	else echo '"failure"';
?>