/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    main.ts
*/

/*
    Import TS modules
*/

import { grpp_getUserRepos } from "./getUserRepos";
import { grpp_importBatch, grpp_startImport, grppRepoEntry } from "./import";
import { grpp_checkBatchUpdateProcess, grpp_processBatchFile, grpp_updateRepo } from "./update";
import { createLogEntry, grpp_displayHelp, grpp_displayMainLogo, grpp_getRepoInfo, grpp_printStatus, grpp_syncDatabase, preventMinMax } from "./utils";

/*
    Require node modules
*/

import * as module_fs from 'fs';
import * as module_os from 'os';

/*
    Interfaces
*/

// GRPP Settings file
export interface grppSettingsFile {
    lastRun:string,
    maxPages:number,
    repoEntries:any,
    runCounter:number,
    updateRuntime:number,
    fetchStartPage:number,
    maxReposPerList:number,
    connectionTestURL:string
}

/*
    Defaults
*/

// Default settings file
export const grppSettingsFile_Defaults:Pick <grppSettingsFile, 'lastRun' | 'repoEntries' | 'runCounter' | 'maxReposPerList' | 'maxPages' | 'connectionTestURL' | 'updateRuntime' | 'fetchStartPage'> = {
    maxPages: 5,
    runCounter: 0,
    repoEntries: {},
    lastRun: 'Never',
    updateRuntime: 0,
    fetchStartPage: 1,
    maxReposPerList: 50,
    connectionTestURL: '1.1.1.1'
}

/*
    Variables
*/

// Temp settings to be appended on main settings file
const tempSettings:grppSettingsFile | any = {};

// App settings
export var grppSettings:grppSettingsFile = { ...grppSettingsFile_Defaults };

/*
    Functions
*/

/**
    * Load GRPP settings
*/
async function grpp_loadSettings(){
    return new Promise<void>(function(resolve, reject){

        // Create settings file path and check if it exists
        const filePath = `${process.cwd()}/grpp_settings.json`;
        if (module_fs.existsSync(filePath) === !0){

            // Try loading settings
            try {
                grppSettings = { ...JSON.parse(module_fs.readFileSync(filePath, 'utf-8')), ...tempSettings };
                resolve();
            } catch (err) {
                reject(err);
            }

        } else {
            console.warn(`WARN - Unable to load settings because this location isn\'t initialized! GRPP will initialize this folder before moving on...`);
            grpp_initPath();
            resolve();
        }

    });
}

/**
    * Save GRPP settings
*/
export async function grpp_saveSettings(){
    try {
        createLogEntry('INFO - Updating GRPP Settings file...');
        module_fs.writeFileSync(`${process.cwd()}/grpp_settings.json`, JSON.stringify(grppSettings), 'utf-8');
    } catch (err) {
        throw err;
    }
}

/**
    * Update GRPP settings
    * @param data [grppSettingsFile] settings to be updated
*/
export function grpp_updateSettings(data:any){
    grppSettings = { ...grppSettings, ...data };
    grpp_saveSettings();
}

/**
    * Initiaite GRPP path
    * @param path [string] path to be initialized (Default: current working dir)
*/
export function grpp_initPath(path:string = process.cwd()){
    if (module_fs.existsSync(`${path}/logs`) === !1) module_fs.mkdirSync(`${path}/logs`);
    if (module_fs.existsSync(`${path}/grpp_settings.json`) !== !0) module_fs.writeFileSync(`${path}/grpp_settings.json`, JSON.stringify(grppSettings), 'utf-8');
}

/**
    * Import repo to list
    * @param path [string] local repo path
    * @param repoData [grppRepoEntry] new repo to be imported / updated
*/
export function grpp_updateRepoData(path:string, repoData:grppRepoEntry){
    grppSettings.repoEntries[path] = repoData;
    grpp_saveSettings();
}

/**
    * Main function
*/
async function init(){

    // Display main logo, create vars and check if needs to display help string
    grpp_displayMainLogo();
    var execFn:Function | null = null;
    if (process.argv.indexOf('--help') === -1) createLogEntry('==> Use \"--help\" for more details\n');

    /*
        Process settings flags
    */
    for (var i = 0; i < process.argv.length; i++){
        const currentFlag = process.argv[i];

        // Set max repos a batch file should have
        if (currentFlag.indexOf('--maxReposPerList=') !== -1) tempSettings.maxReposPerList = preventMinMax(Number(currentFlag.replace('--maxReposPerList=', '')), 1, 1000);

        // Set max fetch pages
        if (currentFlag.indexOf('--setMaxFetchPages=') !== -1) tempSettings.maxPages = preventMinMax(Number(currentFlag.replace('--setMaxFetchPages=', '')), 1, 1000);

        // Set web test url
        if (currentFlag.indexOf('--setConnectionTestURL=') !== -1) tempSettings.connectionTestURL = currentFlag.replace('--setConnectionTestURL=', '');

        // Set starting fetch page
        if (currentFlag.indexOf('--setStartPage=') !== -1) tempSettings.fetchStartPage = preventMinMax(Number(currentFlag.replace('--setStartPage=', '')), 0, 9999);

        // Set GRPP path
        if (currentFlag.indexOf('--path=') !== -1){

            // Set new path var and check if it exists. If not, try creating it
            const newPath = currentFlag.replace('--path=', '');
            if (module_fs.existsSync(newPath) === !1) module_fs.mkdirSync(newPath);
            process.chdir(newPath);

        }

    }

    /*
        Process functions flags
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

        // Save / update settings
        if (currentFlag.indexOf('--saveSettings') !== -1){
            execFn = grpp_saveSettings;
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

        // Sync database [WIP]
        if (currentFlag.indexOf('--repairDatabase') !== -1){
            execFn = grpp_syncDatabase;
            break;
        }

        // Get user repos
        if (currentFlag.indexOf('--getUserRepos=') !== -1){
            execFn = function(){
                grpp_getUserRepos(currentFlag.replace('--getUserRepos=', ''));
            }
            break;
        }

        // Import repo
        if (currentFlag.indexOf('--import=') !== -1){
            execFn = function(){
                grpp_startImport(currentFlag.replace('--import=', ''));
            }
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
            break;
        }

        // Update an specific repo
        if (currentFlag.indexOf('--update=') !== -1){
            execFn = function(){
                grpp_updateRepo(currentFlag.replace('--update=', ''));
            }
            break;
        }

        // Update all repos
        if (currentFlag.indexOf('--updateAll') !== -1){
            execFn = grpp_checkBatchUpdateProcess;
            break;
        }

        // Process GRPP batch files
        if (currentFlag.indexOf('--processBatchFile=') !== -1){
            execFn = async function(){
                await grpp_processBatchFile(Number(currentFlag.replace('--processBatchFile=', '')));
            }
            break;
        }

    }

    // If have functions to execute, run init process and then, execute it!
    if (execFn !== null){
        await grpp_loadSettings().then(async function(){
            await execFn!();
        });
    }

    // Check if no flags were provided
    if (execFn === null && process.argv.length < 3) createLogEntry(`==> Since no args / flags were provided, We wish someone called ${module_os.userInfo().username} a great day! <3\n`);

}

// Start GRPP
await init();