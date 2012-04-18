// do "/home/j/Project/Causes of Death/Sandbox/create_gbdx_viz_dataset.do"
/*
Author:		Kyle Foreman
Date:		4 December 2011
Updated:	2 January 2012
Purpose:	Create an efficient database structure for the GBD visualization tool
*/

global upload_main = 0
global upload_risks = 0
global submit_offline = 0
global this_date = "Apr18_2012"

// setup stata
	clear
	set mem 20g
	set maxvar 30000
	set more off
	set odbcmgr unixodbc
	global dsn CODMOD
	global tmp_dir "/home/j/Project/Causes of Death/Sandbox/"

// years/ages to keep (in order for sliders)
	local keep_years 1990 2005 2010
	local keep_ages 97 0 .01 .1 1 5 10 15 20 25 30 35 40 45 50 55 60 65 70 75 80 99

// make a table of ages
	clear
	local num_ages: word count `keep_ages'
	set obs `num_ages'
	generate age_viz = _n
	generate double age_data = .
	forvalues i = 1 / `num_ages' {
		local a: word `i' of `keep_ages'
		replace age_data = `a' in `i'
	}
	generate age_name = string(age_data) + " to " + string(age_data + 4)
	replace age_name = "Under 5" if age_data == 97
	replace age_name = "Early Neonatal" if age_data == 0
	replace age_name = "Late Neonatal" if age_data == .01
	replace age_name = "Post Neonatal" if age_data == .1
	replace age_name = "Age Adjusted" if age_data == 98
	replace age_name = "Total" if age_data == 99
	replace age_name = "80 plus" if age_data == 80
	
	generate age_plot = (age_data <= 80)
	generate age_axis = string(age_data)
	replace age_axis = "" if age_data > 80
	replace age_axis = "EN" if age_data == 0
	replace age_axis = "LN" if age_data == .01
	replace age_axis = "PN" if age_data == .1
	odbc exec("DROP TABLE IF EXISTS gbdx_age;"), dsn($dsn)
	odbc insert *, table("gbdx_age") dsn($dsn) create
	tempfile new_ages
	save `new_ages', replace

// make a table of years
	clear
	local num_years: word count `keep_years'
	set obs `num_years'
	generate year_viz = _n
	generate int year_name = .
	forvalues i = 1 / `num_years' {
		local y: word `i' of `keep_years'
		replace year_name = `y' in `i'
	}
	odbc exec("DROP TABLE IF EXISTS gbdx_year;"), dsn($dsn)
	odbc insert *, table("gbdx_year") dsn($dsn) create
	tempfile new_years
	save `new_years', replace

// local of where clause for which years to keep
	local year_clause = "(year=" + subinstr("`keep_years'", " ", " OR year=", .) + ")"


// make a table of causes
	// find which causes have been successfully uploaded
		odbc load, exec("SELECT cause, most_detailed AS leaf FROM g_global GROUP BY cause ORDER BY cause;") clear dsn($dsn) 
		drop if substr(cause,1,6) == "A.1.2."
		levelsof cause, local(causes) clean
		tempfile causes
		save `causes', replace
	// download the original table
		odbc load, exec("SELECT cause, cause_short, cause_name, cause_color, cause_display, cause_sort, cause_level FROM id_causes_reporting;") clear dsn($dsn)
	// keep just the causes for which we have results
		merge 1:1 cause using `causes', keep(match) nogen
	// generate the cause actually used for treemaps
		generate cause_viz = substr(cause, 1, 1) + "." + string(cause_color) + substr(cause, 2, .)
		replace cause_viz = cause if cause_level == 1
		replace cause_viz = subinstr(cause_viz, ".", "_", .)
	// make a lookup to go from cause to treemap cause
		foreach c of local causes {
			local cn = strtoname("`c'")
			levelsof cause_viz if cause == "`c'", local(vc_`cn') clean
		}
	// find size of cause column
		count
		local num_causes = `r(N)'
		generate cause_length = length(cause_viz)
		summarize cause_length, meanonly
		local len_cause = `r(max)'
	// manually tweak some short names
		replace cause_short = "Group I" if cause_viz == "A"
		replace cause_short = "Group II" if cause_viz == "B"
		replace cause_short = "Group III" if cause_viz == "C"
	// add the "total" cause
		local num_obs = _N + 1
		set obs `num_obs'
		replace cause = "Total" in `num_obs'
		replace cause_short = "Total" in `num_obs'
		replace cause_name = "Total (All Causes)" in `num_obs'
		replace cause_color = 1 in `num_obs'
		replace cause_sort = -1 in `num_obs'
		replace cause_viz = "T" in `num_obs'
		replace leaf = 0 in `num_obs'
	// upload to the server
		compress
		odbc exec("DROP TABLE IF EXISTS gbdx_causes;"), dsn($dsn)
		odbc insert cause cause_short cause_name cause_color cause_sort cause_viz leaf, table("gbdx_causes") dsn($dsn) create
	// save temp version for below
		keep cause cause_viz
		tempfile new_causes
		save `new_causes', replace

// make a list of risks
	// find which risks have been successfully uploaded
		odbc load, exec("SELECT risk FROM r_global GROUP BY risk ORDER BY risk;") clear dsn($dsn) 
		levelsof risk, local(risks) clean
	
	// load in risk names
		odbc load, exec("SELECT * FROM id_risks;") clear dsn($dsn)
	
	// keep only uploaded risks
		generate keeper = 0
		foreach r of local risks {
			replace keeper = 1 if risk == "`r'"
		}
		keep if keeper
	
	// generate table
		sort risk_sort
		keep risk risk_short risk_level risk_name risk_parent risk_sort
		compress
		odbc exec("DROP TABLE IF EXISTS gbdx_risks;"), dsn($dsn)
		odbc insert risk risk_name risk_short risk_level risk_parent risk_sort, table("gbdx_risks") dsn($dsn) create
	
	// save risk list for later
		keep risk
		tempfile risks
		save `risks', replace
	
	// find max length
		generate len_rf = length(risk)
		summ len_rf, meanonly
		local rf_len = `r(max)'
		local num_risks = _N
	
// create new pop table
	// put population numbers into a single wide table
		foreach g in country region super_region global {
		
		// load in envelope/pop at each level of the hierarchy
			if "`g'" == "country" {
				odbc load, exec("SELECT * FROM id_populations;") clear dsn($dsn)
				rename iso3 geo
			}
			else if "`g'" == "region" {
				odbc load, exec("SELECT * FROM id_populations_`g';") clear dsn($dsn)
				generate geo = "R_" + string(`g')
			}
			else if "`g'" == "super_region" {
				odbc load, exec("SELECT * FROM id_populations_`g';") clear dsn($dsn)
				generate geo = "SR_" + string(`g')
			}
			else if "`g'" == "global" {
				odbc load, exec("SELECT * FROM id_populations_`g';") clear dsn($dsn)
				generate geo = "G"	
				tempfile tt
				save `tt', replace
				odbc load, exec("SELECT * FROM id_populations_dev_status;") clear dsn($dsn)
				rename dev_status geo
				append using `tt'
				capture destring pop, replace
			}

		// keep just the relevant years/ages
			rename age age_data
			merge m:1 age_data using `new_ages', keep(match) nogen
			rename year year_name
			merge m:1 year_name using `new_years', keep(match) nogen

		// group by geographic unit and sex
			generate sex_string = "M" if sex == 1
			replace sex_string = "F" if sex == 2
			generate geo_sex = geo + "_" + sex_string
		
		// create a variable for year and age
			generate age_year = string(age_viz) + "_" + string(year_viz)
		
		// keep just the relevant variables
			gen pop_ = round(pop)
			keep geo_sex age_year pop_
		
		// reshape so that we have a row for each geo/sex and a column for each age/year
			compress
			reshape wide pop_, i(geo_sex) j(age_year) string
		
		// store the formatted results
			tempfile ep_`g'
			save `ep_`g'', replace
		}

	// put the pieces back together
		clear
		foreach g in country region super_region global {
			append using `ep_`g''
		}
		compress

	// get variables in the right order (EXTREMELY IMPORTANT when using INFILE for mysql, because otherwise the data will be scrambled)
		order geo_sex, first
		local previous_var "geo_sex"
		forvalues a = 1 / `num_ages' {
			forvalues y = 1 / `num_years' {
				order pop_`a'_`y', after(`previous_var')
				local previous_var "pop_`a'_`y'"
			}
		}

	// upload to the server
		outsheet using "$tmp_dir/gbd_pop.txt", replace nolabel noquote nonames
		odbc exec("DROP TABLE IF EXISTS gbdx_pop_new;"), dsn($dsn)
		odbc exec("CREATE TABLE gbdx_pop_new(geo_sex varchar(6));"), dsn($dsn)
		quietly {
			forvalues a = 1 / `num_ages' {
				forvalues y = 1 / `num_years' {
					odbc exec("ALTER TABLE gbdx_pop_new ADD COLUMN pop_`a'_`y' BIGINT;"), dsn($dsn)
				}
			}
		}
		odbc exec("LOAD DATA LOCAL INFILE '$tmp_dir/gbd_pop.txt' INTO TABLE gbdx_pop_new FIELDS TERMINATED BY '\t' LINES TERMINATED BY '\n';"), dsn($dsn)
		odbc exec("ALTER TABLE gbdx_pop_new ADD INDEX (geo_sex);"), dsn($dsn)
		odbc exec("DROP TABLE IF EXISTS gbdx_pop;"), dsn($dsn) 
		odbc exec("ALTER TABLE gbdx_pop_new RENAME TO gbdx_pop;"), dsn($dsn)


	
if ${upload_main} == 1 {
// create table for estimates by cause
	// put predictions into a single wide table
		** foreach g in global {
		foreach g in country region super_region global {
		
		// load in envelope/pop at each level of the hierarchy
			if "`g'" == "country" {
				odbc load, exec("SELECT * FROM g_`g' WHERE `year_clause';") clear dsn($dsn)
				drop if cause == ""
				tempfile ggf
				save `ggf', replace
				odbc load, exec("SELECT iso3, year, age, sex, cause, mean_prev, upper_prev, lower_prev FROM o_`g' WHERE outcome='' AND `year_clause';") clear dsn($dsn)
				drop if cause == ""
				merge 1:1 iso3 year age sex cause using `ggf', nogen
				rename iso3 geo
			}
			else if "`g'" == "region" {
				odbc load, exec("SELECT * FROM g_`g' WHERE `year_clause';") clear dsn($dsn)
				drop if cause == ""
				tempfile ggf
				save `ggf', replace
				odbc load, exec("SELECT region, year, age, sex, cause, mean_prev, upper_prev, lower_prev FROM o_`g' WHERE outcome='' AND `year_clause';") clear dsn($dsn)
				drop if cause == ""
				merge 1:1 region year age sex cause using `ggf', nogen
				generate geo = "R_" + region
			}
			else if "`g'" == "super_region" {
				odbc load, exec("SELECT * FROM g_`g' WHERE `year_clause';") clear dsn($dsn)
				drop if cause == ""
				tempfile ggf
				save `ggf', replace
				odbc load, exec("SELECT super_region, year, age, sex, cause, mean_prev, upper_prev, lower_prev FROM o_`g' WHERE outcome='' AND `year_clause';") clear dsn($dsn)
				drop if cause == ""
				merge 1:1 super_region year age sex cause using `ggf', nogen
				generate geo = "SR_" + super_region
			}
			else if "`g'" == "global" {
				odbc load, exec("SELECT * FROM g_`g' WHERE `year_clause';") clear dsn($dsn)
				drop if cause == ""
				tempfile ggf
				save `ggf', replace
				odbc load, exec("SELECT dev_status, year, age, sex, cause, mean_prev, upper_prev, lower_prev FROM o_`g' WHERE outcome='' AND `year_clause';") clear dsn($dsn)
				drop if cause == ""
				merge 1:1 dev_status year age sex cause using `ggf', nogen
				rename dev_status geo
			}
		
		// keep just 1980-2011
			rename age age_data
			merge m:1 age_data using `new_ages', keep(match) nogen
			rename year year_name
			merge m:1 year_name using `new_years', keep(match) nogen
		
		// group by geographic unit and sex
			generate sex_string = "M" if sex == 1
			replace sex_string = "F" if sex == 2
			generate geo_sex = geo + "_" + sex_string
		
		// create a variable for year and age
			generate age_year = string(age_viz) + "_" + string(year_viz)
		
		// keep just the relevant variables
			gen dth_m_nm_ = mean_death
			gen dth_u_nm_ = upper_death
			gen dth_l_nm_ = lower_death
			
			gen yll_m_nm_ = mean_YLL
			gen yll_u_nm_ = upper_YLL
			gen yll_l_nm_ = lower_YLL
			
			gen yld_m_nm_ = mean_YLD
			gen yld_u_nm_ = upper_YLD
			gen yld_l_nm_ = lower_YLD
			
			gen daly_m_nm_ = mean_DALY
			gen daly_u_nm_ = upper_DALY
			gen daly_l_nm_ = lower_DALY
			
			gen prev_m_nm_ = mean_prev
			gen prev_u_nm_ = upper_prev
			gen prev_l_nm_ = lower_prev
			
			gen dth_m_pc_ = mean_cf_death
			gen dth_u_pc_ = upper_cf_death
			gen dth_l_pc_ = lower_cf_death
			
			gen yll_m_pc_ = mean_cf_YLL
			gen yll_u_pc_ = upper_cf_YLL
			gen yll_l_pc_ = lower_cf_YLL
			
			gen yld_m_pc_ = mean_cf_YLD
			gen yld_u_pc_ = upper_cf_YLD
			gen yld_l_pc_ = lower_cf_YLD
			
			gen daly_m_pc_ = mean_cf_DALY
			gen daly_u_pc_ = upper_cf_DALY
			gen daly_l_pc_ = lower_cf_DALY
			
			keep cause geo_sex age_year dth_* yll_* yld_* daly_* prev_*
		
		// add in the treemap cause
			merge m:1 cause using `new_causes', keep(match) nogen
			drop cause
		
		// reshape so that we have a row for each geo/sex and a column for each age/year
			compress
			reshape wide dth_* yll_* yld_* daly_* prev_*, i(geo_sex cause_viz) j(age_year) string
		
		
		// store the formatted results
			tempfile est_`g'
			save `est_`g'', replace
		}

	// put the pieces back together
		clear
		foreach g in country region super_region global {
		** foreach g in global {
			append using `est_`g''
		}
		compress

	// get variables in the right order (EXTREMELY IMPORTANT when using INFILE for mysql, because otherwise the data will be scrambled)
		order geo_sex cause_viz, first
		local previous_var "cause_viz"
		foreach v in dth yll yld daly prev {
			if "`v'" == "prev" local sfxs m_nm l_nm u_nm
			else local sfxs m_nm l_nm u_nm m_pc l_pc u_pc
			foreach t of local sfxs {
				forvalues a = 1 / `num_ages' {
					forvalues y = 1 / `num_years' {
						order `v'_`t'_`a'_`y', after(`previous_var')
						local previous_var "`v'_`t'_`a'_`y'"
					}
				}
			}
		}

	// upload to the server
		outsheet using "$tmp_dir/gbdx_cfs.txt", replace nolabel noquote nonames
		** outsheet using "$tmp_dir/gbdx_cfs.csv", comma replace
		odbc exec("DROP TABLE IF EXISTS gbdx_cfs_new;"), dsn($dsn)
		odbc exec("CREATE TABLE gbdx_cfs_new(geo_sex varchar(6), cause_viz VARCHAR(`len_cause')) PARTITION BY KEY (cause_viz) PARTITIONS `num_causes';"), dsn($dsn)
		quietly {
			foreach v in dth yll yld daly prev {
				if "`v'" == "prev" local sfxs m_nm l_nm u_nm
				else local sfxs m_nm l_nm u_nm m_pc l_pc u_pc
				foreach t of local sfxs {
					forvalues a = 1 / `num_ages' {
						forvalues y = 1 / `num_years' {
							odbc exec("ALTER TABLE gbdx_cfs_new ADD COLUMN `v'_`t'_`a'_`y' FLOAT;"), dsn($dsn)
						}
					}
				}
			}
		}
		odbc exec("LOAD DATA LOCAL INFILE '$tmp_dir/gbdx_cfs.txt' INTO TABLE gbdx_cfs_new FIELDS TERMINATED BY '\t' LINES TERMINATED BY '\n';"), dsn($dsn)
		odbc exec("ALTER TABLE gbdx_cfs_new ADD INDEX (geo_sex), ADD INDEX (cause_viz), ADD INDEX (geo_sex, cause_viz);"), dsn($dsn)
		odbc exec("DROP TABLE IF EXISTS gbdx_cfs_${this_date};"), dsn($dsn) 
		odbc exec("CREATE TABLE gbdx_cfs_${this_date} SELECT * FROM gbdx_cfs_new;"), dsn($dsn)
		odbc exec("DROP TABLE IF EXISTS gbdx_cfs;"), dsn($dsn) 
		odbc exec("ALTER TABLE gbdx_cfs_new RENAME TO gbdx_cfs;"), dsn($dsn)
}


if ${upload_risks} == 1 {
// create table for estimates by RF
	// put predictions into a single wide table
		** foreach g in global {
		foreach g in global country region super_region {
		
		// load in envelope/pop at each level of the hierarchy
			if "`g'" == "country" {
				odbc load, exec("SELECT * FROM r_`g' WHERE `year_clause';") clear dsn($dsn)
				rename iso3 geo
			}
			else if "`g'" == "region" {
				odbc load, exec("SELECT * FROM r_`g' WHERE `year_clause';") clear dsn($dsn)
				generate geo = "R_" + region
			}
			else if "`g'" == "super_region" {
				odbc load, exec("SELECT * FROM r_`g' WHERE `year_clause';") clear dsn($dsn)
				generate geo = "SR_" + super_region
			}
			else if "`g'" == "global" {
				odbc load, exec("SELECT * FROM r_`g' WHERE `year_clause';") clear dsn($dsn)
				rename dev_status geo
			}
		
		// keep just 1980-2011
			rename age age_data
			merge m:1 age_data using `new_ages', keep(match) nogen
			rename year year_name
			merge m:1 year_name using `new_years', keep(match) nogen
		
		// group by geographic unit and sex
			generate sex_string = "M" if sex == 1
			replace sex_string = "F" if sex == 2
			generate geo_sex = geo + "_" + sex_string
		
		// create a variable for year and age
			generate age_year = string(age_viz) + "_" + string(year_viz)
		
		// keep just the relevant variables
			gen dth_pc_ = mean_death_pct / 100 // * envelope_death_pct / 100
			gen dth_nm_ = mean_death_abs
			gen yll_pc_ = mean_YLL_pct / 100 // * envelope_YLL_pct / 100
			gen yll_nm_ = mean_YLL_abs
			gen yld_pc_ = mean_YLD_pct / 100 // * envelope_YLD_pct / 100
			gen yld_nm_ = mean_YLD_abs
			gen daly_pc_ = mean_DALY_pct / 100 // * envelope_DALY_pct / 100
			gen daly_nm_ = mean_DALY_abs
			keep cause risk geo_sex age_year dth_* yll_* yld_* daly_*
		
		// add in the treemap cause
			merge m:1 cause using `new_causes', keep(match) nogen
			drop cause
		
		// keep only risks in the list
			merge m:1 risk using `risks', keep(match) nogen
		
		// reshape so that we have a row for each geo/sex & cause & risk and a column for each age/year
			compress
			reshape wide dth_* yll_* yld_* daly_*, i(geo_sex cause_viz risk) j(age_year) string
		
		// store the formatted results
			tempfile rf_`g'
			save `rf_`g'', replace
		}


	// put the pieces back together
		clear
		foreach g in country region super_region global {
		** foreach g in global {
			append using `rf_`g''
		}
		compress
		
	// get variables in the right order (EXTREMELY IMPORTANT when using INFILE for mysql, because otherwise the data will be scrambled)
		order geo_sex cause_viz risk, first
		local previous_var "risk"
		foreach v in dth yll yld daly {
			foreach t in nm pc {
				forvalues a = 1 / `num_ages' {
					forvalues y = 1 / `num_years' {
						capture confirm variable `v'_`t'_`a'_`y'
						if _rc generate `v'_`t'_`a'_`y' = 0
						order `v'_`t'_`a'_`y', after(`previous_var')
						local previous_var "`v'_`t'_`a'_`y'"
					}
				}
			}
		}

	// upload to the server
		outsheet using "$tmp_dir/gbdx_rfs.txt", replace nolabel noquote nonames
		odbc exec("DROP TABLE IF EXISTS gbdx_rfs_new;"), dsn($dsn)
		odbc exec("CREATE TABLE gbdx_rfs_new(geo_sex varchar(6), cause_viz VARCHAR(`len_cause'), risk VARCHAR(`rf_len')) PARTITION BY KEY (risk) PARTITIONS `num_risks';"), dsn($dsn)
		quietly {
			foreach v in dth yll yld daly {
				foreach t in nm pc {
					forvalues a = 1 / `num_ages' {
						forvalues y = 1 / `num_years' {
							odbc exec("ALTER TABLE gbdx_rfs_new ADD COLUMN `v'_`t'_`a'_`y' FLOAT;"), dsn($dsn)
						}
					}
				}
			}
		}
		odbc exec("LOAD DATA LOCAL INFILE '$tmp_dir/gbdx_rfs.txt' INTO TABLE gbdx_rfs_new FIELDS TERMINATED BY '\t' LINES TERMINATED BY '\n';"), dsn($dsn)
		odbc exec("ALTER TABLE gbdx_rfs_new ADD INDEX (geo_sex), ADD INDEX (cause_viz), ADD INDEX (risk), ADD INDEX (risk, geo_sex), ADD INDEX (geo_sex, cause_viz);"), dsn($dsn)
		odbc exec("DROP TABLE IF EXISTS gbdx_rfs_${this_date};"), dsn($dsn) 
		odbc exec("CREATE TABLE gbdx_rfs_${this_date} SELECT * FROM gbdx_rfs_new;"), dsn($dsn)
		odbc exec("DROP TABLE IF EXISTS gbdx_rfs;"), dsn($dsn) 
		odbc exec("ALTER TABLE gbdx_rfs_new RENAME TO gbdx_rfs;"), dsn($dsn)		
}

// download offline version
	if ${submit_offline} == 1 {
		!/usr/local/bin/SGE/bin/lx24-amd64/qsub -N "offline_GBDx_dataset" "/home/j/Project/GBD/GBDx/code/submit_create_offline_GBDx_dataset.sh"
	}
		
