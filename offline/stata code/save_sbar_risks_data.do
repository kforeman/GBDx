/*
Author:		Kyle Foreman
Date:		29 January 2012
Updated:	27 April 2012
Purpose:	Save stacked bar risk factor data
*/

** settings
clear all
set more off
set mem 4g
set maxvar 7000
cap log close

** log
log using "${save_dir}/logs/save_sbar_risks_${geo_sex}.smcl", replace

** open data 
use if geo_sex == "${geo_sex}" using "${tmp_dir}/sbar_rfs.dta", clear
** save relevant part
preserve
foreach r of global risk_cats {
	di "`r'"
	quietly keep if risk_parent == "`r'"
	foreach m of global metrics {
		di "`m'"
		renpfix `m'_ m
		outsheet cause_viz risk m* using "${save_dir}/data/sbar_risks/${geo_sex}_`r'_`m'.csv", comma replace
		drop m*
	}
	restore, preserve
}
