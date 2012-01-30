/*
Author:		Kyle Foreman
Date:		29 January 2012
Updated:	30 January 2012
Purpose:	Download the current GBD database and save it into csv files for offline access
*/

// -------- This should be the only thing you have to touch: where to save all the csv files -------- //
	global tmp_dir "/home/j/Project/Causes of Death/Sandbox/GBDx data/"


// setup stata
	clear
	set mem 20g
	set maxvar 30000
	set more off
	set odbcmgr unixodbc
	global dsn CODMOD

// ages
	capture mkdir "$tmp_dir/parameters"
	odbc load, exec("SELECT * FROM gbd_age ORDER BY age_viz;") dsn($dsn) clear
	outsheet using "$tmp_dir/parameters/age_list.csv", comma replace

// years
	odbc load, exec("SELECT * FROM gbd_year ORDER BY year_viz;") dsn($dsn) clear
	outsheet using "$tmp_dir/parameters/year_list.csv", comma replace

// causes
	odbc load, exec("SELECT * FROM gbd_causes ORDER BY cause_sort;") dsn($dsn) clear
	outsheet using "$tmp_dir/parameters/cause_list.csv", comma replace
	tempfile causes
	save `causes', replace

// risks
	odbc load, exec("SELECT * FROM gbd_risks ORDER BY risk_name;") dsn($dsn) clear
	outsheet using "$tmp_dir/parameters/risk_list.csv", comma replace
	
// totals
	odbc load, exec("SELECT * FROM gbd_totals;") dsn($dsn) clear
	outsheet using "$tmp_dir/totals/totals.csv", comma replace

// load in all cause fractions
	odbc load, exec("SELECT * FROM gbd_cfs;") dsn($dsn) clear
	preserve

// make lists for looping through the cause fractions
	levelsof cause_viz, l(cause_vizes) c
	levelsof geo_sex, l(geo_sexes) c
	local sexes M F
	local metrics daly yld yll dth

// treemap data
	capture mkdir "$tmp_dir/treemap"
	foreach g of local geo_sexes {
		display "treemap `g'"
		quietly keep if geo_sex == "`g'" 
		foreach m of local metrics {
			renpfix `m'_m_ m
			renpfix `m'_l_ l
			renpfix `m'_u_ u
			quietly outsheet cause_viz m* l* u* using "$tmp_dir/treemap/`g'_`m'.csv", comma replace
			drop m* l* u*
		}
		restore , preserve
	}
	
// map data
	capture mkdir "$tmp_dir/map"
	foreach c of local cause_vizes {
		display "map `c'"
		foreach s of local sexes {
			quietly keep if cause_viz == "`c'" & substr(geo_sex, -1, 1) == "`s'"
			foreach m of local metrics {
				renpfix `m'_m_ m
				renpfix `m'_l_ l
				renpfix `m'_u_ u
				quietly outsheet geo_sex m* l* u* using "$tmp_dir/map/`c'_`s'_`m'.csv", comma replace
				drop m* l* u*
			}
			restore , preserve
		}
	}

// load in risk factors
	restore , not
	odbc load, exec("SELECT * FROM gbd_rfs;") dsn($dsn) clear
	preserve

// make lists for looping
	levels risk, l(risks) c

// output risks
	capture mkdir "$tmp_dir/treemap_risks"
	foreach g of local geo_sexes {
		display "risk `g'"
		foreach r of local risks {
			quietly keep if geo_sex == "`g'" & risk == "`r'"
			foreach m of local metrics {
				renpfix `m'_ m
				quietly outsheet cause_viz risk m* using "$tmp_dir/treemap_risks/`g'_`r'_`m'.csv", comma replace
				drop m*
			}
			restore , preserve
		}
	}
	
// treemap starting values
	odbc load, exec("SELECT cause_viz, AVG(daly_m_22_3) AS treemap_start_val FROM gbd_cfs WHERE geo_sex='G_M' OR geo_sex='G_F' GROUP BY (cause_viz);") clear
	outsheet using "$tmp_dir/treemap/treemap_starting_values.csv", comma replace
