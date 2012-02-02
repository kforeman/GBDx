/*
Author:		Kyle Foreman
Date:		29 January 2012
Updated:	30 January 2012
			2 February 2012 (Leslie Mallinger)
Purpose:	Save treemap data from GBDx
*/

** settings
clear all
set more off
set mem 4g
set maxvar 7000
cap log close

** log
log using "${save_dir}/logs/save_risks_${geo_sex}.smcl", replace

** open data and save relevant part
use "${tmp_dir}/all_rfs.dta", clear
foreach r of global risks {
	di "`r'"
	quietly keep if geo_sex == "${geo_sex}" & risk == "`r'"
	foreach m of global metrics {
		di "`m'"
		renpfix `m'_ m
		outsheet cause_viz risk m* using "${save_dir}/data/treemap_risks/${geo_sex}_`r'_`m'.csv", comma replace
		drop m*
	}
}
