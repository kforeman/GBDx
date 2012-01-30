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
	$result = mysql_query('DESC gbd_cfs'); 
	$columns = array(); 
	while (list($column) = mysql_fetch_array($result)) {
  		if (substr($column,0,(strlen($_GET['metric'])+2)) == $_GET['metric'].'_l') {
    		$columns[] = $column.' AS l'.substr($column,(strlen($_GET['metric'])+3)); 
  		}
		else if (substr($column,0,(strlen($_GET['metric'])+2)) == $_GET['metric'].'_u') {
    		$columns[] = $column.' AS u'.substr($column,(strlen($_GET['metric'])+3)); 
  		}
	}
    	
	$columns = join(',',$columns);

	// perform the query
	$rows = array();
	$result = mysql_query('SELECT '.$columns.' FROM gbd_cfs WHERE geo_sex="'.$_GET['geo_sex'].'" AND cause_viz="'.$_GET['cause'].'";');
	while($row = mysql_fetch_array($result, MYSQL_ASSOC))
    	$rows[] = $row;
    
    // return the results
	if (count($rows)) echo json_encode($rows);
	else echo '"failure"';
?>