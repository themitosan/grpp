/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    main.ts
*/

/*
    Import TS modules
*/

import { grpp_initPath } from "./init";
import { preventMinMax } from "./utils";
import { grpp_startUpdate } from "./update";
import { grpp_startImport } from "./import";
import { grpp_getUserRepos } from "./getUserRepos";
import { grpp_flagList, grppSettingsFile, grppSettingsFile_Defaults } from "./database";

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
    * Display main logo
*/
export function grpp_displayMainLogo(){
    console.info("\n   <=============================================================>");
    console.info("   <=|          Git Repo Preservation Project (GRPP)           |=>");
    console.info("   <=|     Created by Juliana (@julianaheartz.bsky.social)     |=>");
    console.info("   <=============================================================>");
    console.info("   <=|             A classic quote from an old one:            |=>");
    console.info("   <=|                   \"Quem guarda, \x1b[1;32mt\x1b[1;33me\x1b[1;34mm\x1b[0m!\"                   |=>");
    console.info("   <=============================================================>\n");
}

/**
    * Display help menu
*/
function grpp_displayHelp(){
    console.info("   <=============================================================>");
    console.info('   <=|        Here is a list of all available commands:        |=>');
    console.info("   <=============================================================>\n");
    Object.keys(grpp_flagList).forEach(function(currentFlag:any){
        console.info(`===> ${currentFlag}\n     ${grpp_flagList[currentFlag]}\n`);
    });
}

/**
    * Load settings
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
    * Initialize GRPP before running any action
    * @param postAction [Function] function to be executed after initialization
*/
async function grpp_init(postAction:Function){
    grpp_loadSettings()
    .then(function(){ postAction(); });
}

/**
    * Start main app
*/
async function startApp(){

    // Declare vars
    var execFn:Function | null = null;

    // Clear console, display main logo and check if needs to display help string
    console.clear();
    grpp_displayMainLogo();
    if (process.argv.indexOf('--help') === -1){
        console.info("   <=============================================================>");
        console.info('   <=|           Use \"--help\" in order to know more.           |=>');
        console.info("   <=============================================================>\n");
    }

    // Process run flags for settings
    for (var i = 0; i < process.argv.length; i++){
        const currentFlag = process.argv[i];

        // Set max runners
        if (currentFlag.indexOf('--setMaxRunners=') !== -1){
            grppSettings.runners = preventMinMax(Number(currentFlag.replace('--setMaxRunners=', '')), 0, 1000);
        }

        // Set max fetch pages
        if (currentFlag.indexOf('--setMaxFetchPages=') !== -1){
            grppSettings.maxPages = preventMinMax(Number(currentFlag.replace('--setMaxFetchPages=', '')), 0, 1000);
        }

        // Set working path
        if (currentFlag.indexOf('--setPath=') !== -1){
            process.chdir(`\"${currentFlag.replace('--setPath=', '')}\"`);
        }

        // Set web test url
        if (currentFlag.indexOf('--setConnectionTestURL=') !== -1){
            grppSettings.connectionTestURL = currentFlag.replace('--setConnectionTestURL=', '');
        }

    }

    // Process run flags for settings
    for (var i = 0; i < process.argv.length; i++){
        const currentFlag = process.argv[i];

        // Display help menu
        if (currentFlag.indexOf('--help') !== -1){
            grpp_displayHelp();
            break;
        }

        // Check if is init
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
            // WIP
        }

        // Start GRPP update process
        if (currentFlag.indexOf('--startUpdate') !== -1){
            execFn = grpp_startUpdate;
            break;
        }

    }

    // If have functions to execute, run init process and then, execute it!
    if (execFn !== null){
        execFn();
    }

    // Check if no flags were provided
    if (execFn === null && process.argv.length < 3){
        console.info("   <=============================================================>");
        console.info("   | ...Since no args were provided, We wish you a great day! <3 |");
        console.info("   <=============================================================>\n");
    }

}

// Start GRPP
startApp();