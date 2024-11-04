/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    main.ts
*/

/*
    Import TS modules
*/

import { grpp_initPath } from "./init";
import { grpp_getUserRepos } from "./getUserRepos";
import { grpp_checkBeforeUpdateProcess } from "./update";
import { grpp_importBatch, grpp_startImport } from "./import";
import { grppRepoEntry, grppSettingsFile, grppSettingsFile_Defaults } from "./database";
import { grpp_displayHelp, grpp_displayMainLogo, grpp_getRepoInfo, grpp_printStatus, preventMinMax } from "./utils";

/*
    Require node modules
*/

import * as module_fs from 'fs';

/*
    Variables
*/

export var

    // App settings
    grppSettings:grppSettingsFile = { ...grppSettingsFile_Defaults };

/*
    Functions
*/

/**
    * Load GRPP settings
    * @param postAction function to be executed ONLY after loading settings
*/
export async function grpp_loadSettings(){

    // Create settings file path and check if it exists
    const filePath = `${process.cwd()}/grpp_settings.json`;
    if (module_fs.existsSync(filePath) === !0){

        // Try loading settings
        try {
            grppSettings = JSON.parse(module_fs.readFileSync(filePath, 'utf-8'));
        } catch (err) {
            throw err;
        }

    } else {
        console.warn(`WARN - Unable to load settings because this location isn\'t initialized! GRPP will initialize this folder before moving on...`);
        grpp_initPath();
    }

}

/**
    * Save GRPP settings
*/
export async function grpp_saveSettings(){
    try {
        console.info('INFO - Updating GRPP Settings file...');
        module_fs.writeFileSync(`${process.cwd()}/grpp_settings.json`, JSON.stringify(grppSettings), 'utf-8');
    } catch (err) {
        throw err;
    }
}

/**
    * Initialize GRPP before running any action
    * @param postAction [Function] function to be executed after initialization
*/
async function grpp_init(postAction:Function){
    grpp_loadSettings().then(function(){ postAction(); });
}

/**
    * Import repo to list
    * @param newRepoData [grppRepoEntry] new repo to be imported
    * @param hash [string] repo hash identifier
*/
export function grpp_importRepoDatabase(newRepoData:grppRepoEntry, hash:string){
    grppSettings.repoEntries[hash] = newRepoData;
    grpp_saveSettings();
}

/**
    * Main function
*/
function init(){

    // Display main logo, create vars and check if needs to display help string
    grpp_displayMainLogo();
    var execFn:Function | null = null;
    if (process.argv.indexOf('--help') === -1){
        console.info("   <=============================================================>");
        console.info('   <=|           Use \"--help\" in order to know more.           |=>');
        console.info("   <=============================================================>\n");
    }

    /*
        Process run flags for settings
    */
    for (var i = 0; i < process.argv.length; i++){
        const currentFlag = process.argv[i];

        // Set max threads
        if (currentFlag.indexOf('--threads=') !== -1){
            grppSettings.threads = preventMinMax(Number(currentFlag.replace('--threads=', '')), 0, 1000);
        }

        // Set max fetch pages
        if (currentFlag.indexOf('--setMaxFetchPages=') !== -1){
            grppSettings.maxPages = preventMinMax(Number(currentFlag.replace('--setMaxFetchPages=', '')), 0, 1000);
        }

        // Set GRPP path
        if (currentFlag.indexOf('--path=') !== -1){

            try {

                // Set new path var and check if it exists. If not, try creating it
                const newPath = currentFlag.replace('--path=', '');
                if (module_fs.existsSync(newPath) === !1){
                    module_fs.mkdirSync(newPath);
                }
                process.chdir(newPath);

            } catch (err) {
                throw `ERROR - Unable to set GRPP Path!\nDetails: ${err}\n`;
            }

        }

        // Set web test url
        if (currentFlag.indexOf('--setConnectionTestURL=') !== -1){
            grppSettings.connectionTestURL = currentFlag.replace('--setConnectionTestURL=', '');
        }

        // Set starting fetch page
        if (currentFlag.indexOf('--setStartPage=') !== -1){
            grppSettings.fetchStartPage = preventMinMax(Number(currentFlag.replace('--setStartPage=', '')), 0, 9999);
        }

    }

    /*
        Process run flags for functions
    */
    for (var i = 0; i < process.argv.length; i++){
        const currentFlag = process.argv[i];

        // Display help menu
        if (currentFlag.indexOf('--help') !== -1){
            grpp_displayHelp();
            break;
        }

        // Print current stats
        if (currentFlag.indexOf('--status') !== -1){
            execFn = grpp_printStatus;
            break;
        }

        // Initialize folder / path
        if (currentFlag.indexOf('--init=') !== -1){
            grpp_initPath(currentFlag.replace('--init=', ''));
            break;
        }
        if (currentFlag.indexOf('--init') !== -1){
            grpp_initPath();
            break;
        }

        // Get user repos
        if (currentFlag.indexOf('--getUserRepos=') !== -1){
            execFn = function(){
                grpp_getUserRepos(currentFlag.replace('--getUserRepos=', ''));
            };
            break;
        }

        // Import repo
        if (currentFlag.indexOf('--import=') !== -1){
            execFn = function(){
                grpp_startImport(currentFlag.replace('--import=', ''));
            };
            break;
        }

        // Import repo from list
        if (currentFlag.indexOf('--importList=') !== -1){
            grpp_importBatch(module_fs.readFileSync(currentFlag.replace('--importList=', ''), 'utf-8'));
        }

        // Get info from a previously imported repo
        if (currentFlag.indexOf('--getRepoData=') !== -1){
            execFn = function(){
                grpp_getRepoInfo(currentFlag.replace('--getRepoData=', ''));
            }
        }

        // Start GRPP update process
        if (currentFlag.indexOf('--start') !== -1){
            execFn = grpp_checkBeforeUpdateProcess;
            break;
        }

    }

    // If have functions to execute, run init process and then, execute it!
    if (execFn !== null){
        grpp_init(execFn);
    }

    // Check if no flags were provided
    if (execFn === null && process.argv.length < 3){
        console.info("==> Since no args were provided, We wish you a great day! <3");
    }

}

// Start GRPP
init();