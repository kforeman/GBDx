<?php
/*	Author:		Kyle Foreman (kforeman@post.harvard.edu)
	Date:		18 April 2012
	Purpose:	Load data from mysql for risk factor treemaps
	Arguments:	geo_sex, category, metric
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
  		if (substr($column,0,strlen($metric)) == $metric) 
    		$columns[] = $column.' AS m'.substr($column,(strlen($metric)+1)); 
	$columns = join(',',$columns);
	
	// figure out which causes to grab
	$result = mysql_query('SELECT cause_viz FROM gbdx_causes WHERE cause_level=2 OR cause_viz="T";');
	$cause_clause = array();
	while (list($cause) = mysql_fetch_array($result))
		$cause_clause[] = 'cause_viz = "'.$cause.'"';
	$cause_clause = join(' OR ', $cause_clause);
	
	// figure out which risks to grab
	$cat = mysql_real_escape_string($_GET['category']);
	if ($cat == 'summary') 
		$result = mysql_query('SELECT risk FROM gbdx_risks WHERE risk_level=1;');
	else 
		$result = mysql_query('SELECT risk FROM gbdx_risks WHERE risk_parent="'.$cat.'"');
	$risk_clause = array();
	while (list($risk) = mysql_fetch_array($result))
		$risk_clause[] = 'risk = "'.$risk.'"';
	$risk_clause = join(' OR ', $risk_clause);

	// perform the query
	$rows = array();
	$geo_sex = mysql_real_escape_string($_GET['geo_sex']);
	$result = mysql_query('SELECT cause_viz,geo_sex,risk,'.$columns.' FROM gbdx_rfs WHERE geo_sex="'.$geo_sex.'" AND ('.$cause_clause.') AND ('.$risk_clause.');');
	while($row = mysql_fetch_array($result, MYSQL_ASSOC))
    	$rows[] = $row;
    
    // return the results
	if (count($rows)) echo json_encode($rows, JSON_NUMERIC_CHECK);
	else echo '"failure"';
	// else echo 'SELECT cause_viz,geo_sex,risk,'.$columns.' FROM gbdx_rfs WHERE geo_sex="'.$geo_sex.'" AND ('.$cause_clause.') AND ('.$risk_clause.');';
?>