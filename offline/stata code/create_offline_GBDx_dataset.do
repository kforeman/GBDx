/*
Author:		Kyle Foreman
Date:		29 January 2012
Updated:	30 January 2012
			2 February 2012 (Leslie Mallinger)
Purpose:	Download the current GBD database and save it into csv files for offline access
*/

** -------- This should be the only thing you have to touch: where to save all the csv files -------- //
	global save_dir "/home/j/Project/GBD/GBDx_April25/"


** setup stata
clear
set mem 20g
set maxvar 30000
set more off
set odbcmgr unixodbc
global dsn CODMOD

log using "${save_dir}/log", replace

** establish directories
capture mkdir "${save_dir}"
capture mkdir "${save_dir}/data"
capture mkdir "${save_dir}/logs"
foreach subdir in parameters pops treemap map treemap_risks sbar_risks {
	capture mkdir "${save_dir}/data/`subdir'"
}
global tmp_dir "/share/temp/save_GBDx_data"
capture mkdir "${tmp_dir}"

** ages
odbc load, exec("SELECT * FROM gbdx_age ORDER BY age_viz;") dsn($dsn) clear
outsheet using "${save_dir}/data/parameters/age_list.csv", comma replace

** years
odbc load, exec("SELECT * FROM gbdx_year ORDER BY year_viz;") dsn($dsn) clear
outsheet using "${save_dir}/data/parameters/year_list.csv", comma replace

** causes
odbc load, exec("SELECT * FROM gbdx_causes ORDER BY cause_sort;") dsn($dsn) clear
outsheet using "${save_dir}/data/parameters/cause_list.csv", comma replace

** make a list of level 2 causes
keep if cause_level == 2
levelsof cause_viz, l(risk_causes) c

** risks
odbc load, exec("SELECT * FROM gbdx_risks ORDER BY risk_name;") dsn($dsn) clear
outsheet using "${save_dir}/data/parameters/risk_list.csv", comma replace

** save a copy of the risks for the stacked bar risk section
replace risk_parent = "summary" if risk_level == 1
levelsof risk_parent, l(risk_cats) c
keep risk risk_parent
tempfile risk_parents
save `risk_parents', replace
	
** populations
odbc load, exec("SELECT * FROM gbdx_pops;") dsn($dsn) clear
outsheet using "${save_dir}/data/pops/pop.csv", comma replace

** treemap starting values
odbc load, exec("SELECT cause_viz, AVG(daly_m_22_3) AS treemap_start_val FROM gbdx_cfs WHERE geo_sex='G_M' OR geo_sex='G_F' GROUP BY (cause_viz);") clear
outsheet using "${save_dir}/data/treemap/treemap_starting_values.csv", comma replace

** all cause fractions
odbc load, exec("SELECT * FROM gbdx_cfs;") dsn($dsn) clear
levelsof cause_viz, l(cause_vizes) c
levelsof geo_sex, l(geo_sexes) c
local sexes M F
local metrics daly yld yll dth
save "${tmp_dir}/all_cfs.dta", replace

** all risk factors
odbc load, exec("SELECT * FROM gbdx_rfs;") dsn($dsn) clear
levelsof risk, l(risks) c
save "${tmp_dir}/all_rfs.dta", replace

** risk factors only for level 2 causes and total
gen keep_me = (cause_viz == "T")
foreach c of local risk_causes {
	replace keep_me = 1 if cause_viz == "`c'"
}
keep if keep_me
drop keep_me
merge m:1 risk using `risk_parents', nogen keep(match)
save "${tmp_dir}/sbar_rfs.dta", replace

** treemap data
foreach g of local geo_sexes {
	qui file open do_file using "${tmp_dir}/save_treemap_`g'.do", write replace text
	file write do_file		"global geo_sex `g'" _n ///
							"global metrics `metrics'" _n ///
							"global tmp_dir ${tmp_dir}" _n ///
							"global save_dir ${save_dir}" _n ///
							`"do "/home/j/Project/GBD/GBDx/code/save_treemap_data.do""' _n
	file close do_file
	qui file open shell_script using "${tmp_dir}/save_treemap_`g'.sh", write replace text
	file write shell_script	"#!/bin/sh" _n ///
							"#$ -S /bin/sh" _n ///
							`"/usr/local/stata11/stata-mp < "${tmp_dir}/save_treemap_`g'.do" > /dev/null"' _n
	file close shell_script
	! /usr/local/bin/SGE/bin/lx24-amd64/qsub -l mem_free=4G -N tm`g' "${tmp_dir}/save_treemap_`g'.sh"
	sleep 100
}
	
** map data
foreach c of local cause_vizes {
	foreach s of local sexes {
		qui file open do_file using "${tmp_dir}/save_map_`c'_`s'.do", write replace text
		file write do_file		"global cause `c'" _n ///
								"global sex `s'" _n ///
								"global metrics `metrics'" _n ///
								"global tmp_dir ${tmp_dir}" _n ///
								"global save_dir ${save_dir}" _n ///
								`"do "/home/j/Project/GBD/GBDx/code/save_map_data.do""' _n
		file close do_file
		qui file open shell_script using "${tmp_dir}/save_map_`c'_`s'.sh", write replace text
		file write shell_script	"#!/bin/sh" _n ///
								"#$ -S /bin/sh" _n ///
								`"/usr/local/stata11/stata-mp < "${tmp_dir}/save_map_`c'_`s'.do" > /dev/null"' _n
		file close shell_script
		! /usr/local/bin/SGE/bin/lx24-amd64/qsub -l mem_free=4G -N m`c'`s' "${tmp_dir}/save_map_`c'_`s'.sh"
		sleep 100
	}
}

** output risks for treemaps
foreach g of local geo_sexes {
	qui file open do_file using "${tmp_dir}/save_risks_`g'.do", write replace text
	file write do_file		"global geo_sex `g'" _n ///
							"global metrics `metrics'" _n ///
							"global risks `risks'" _n ///
							"global tmp_dir ${tmp_dir}" _n ///
							"global save_dir ${save_dir}" _n ///
							`"do "/home/j/Project/GBD/GBDx/code/save_risks_data.do""' _n
	file close do_file
	qui file open shell_script using "${tmp_dir}/save_risks_`g'.sh", write replace text
	file write shell_script	"#!/bin/sh" _n ///
							"#$ -S /bin/sh" _n ///
							`"/usr/local/stata11/stata-mp < "${tmp_dir}/save_risks_`g'.do" > /dev/null"' _n
	file close shell_script
	! /usr/local/bin/SGE/bin/lx24-amd64/qsub -l mem_free=4G -N r`g' "${tmp_dir}/save_risks_`g'.sh"
	sleep 100
}

** output risks for stacked bars
foreach g of local geo_sexes {
	qui file open do_file using "${tmp_dir}/save_sbar_risks_`g'.do", write replace text
	file write do_file		"global geo_sex `g'" _n ///
							"global metrics `metrics'" _n ///
							"global risk_cats `risk_cats'" _n ///
							"global tmp_dir ${tmp_dir}" _n ///
							"global save_dir ${save_dir}" _n ///
							`"do "/home/j/Project/GBD/GBDx/code/save_sbar_risks_data.do""' _n
	file close do_file
	qui file open shell_script using "${tmp_dir}/save_sbar_risks_`g'.sh", write replace text
	file write shell_script	"#!/bin/sh" _n ///
							"#$ -S /bin/sh" _n ///
							`"/usr/local/stata11/stata-mp < "${tmp_dir}/save_sbar_risks_`g'.do" > /dev/null"' _n
	file close shell_script
	! /usr/local/bin/SGE/bin/lx24-amd64/qsub -l mem_free=4G -N r`g' "${tmp_dir}/save_sbar_risks_`g'.sh"
	sleep 100
}
