/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    main.ts
*/

/*
    Import TS modules
*/

import { grpp_getUserRepos } from "./getUserRepos";
import { grpp_startRepairDatabase } from "./repair";
import { createLogEntry, preventMinMax } from "./tools";
import { grpp_importBatch, grpp_startImport, grppRepoEntry } from "./import";
import { grpp_checkBatchUpdateProcess, grpp_processBatchFile, grpp_updateRepo } from "./update";
import { grpp_displayHelp, grpp_displayMainLogo, grpp_exportRemotes, grpp_getRepoInfo, grpp_printStatus } from './utils';

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

const 

    // Settings max value
    maxValue = 99999,

    // Temp settings to be appended on main settings file
    tempSettings:grppSettingsFile | any = {};

export var 

    // Is silent mode active
    enableSilentMode = !1,

    // App settings
    grppSettings:grppSettingsFile = { ...grppSettingsFile_Defaults };

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
        module_fs.writeFileSync(`${process.cwd()}/grpp_settings.json`, JSON.stringify(grppSettings, void 0, 4), 'utf-8');
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
    if (module_fs.existsSync(`${path}/repos`) === !1) module_fs.mkdirSync(`${path}/repos`);
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
    * Remove repo from database
    * @param path [string] Repo to be removed from database 
*/
export function grpp_removeRepo(path:string){
    if (grppSettings.repoEntries[path] !== void 0){
        delete grppSettings.repoEntries[path];
        grpp_saveSettings();
    } else {
        createLogEntry(`WARN - Unable to find ${path} on repo database!`);
    }
}

/**
    * Check if current arg is valid
    * @param arg [string] Arg to be checked
*/
function checkFlagIsValid(arg:string):string {

    var res = '',
        handleDatabase = ['-', '/'];

    if (arg.slice(0, 2) === '--') res = arg.slice(2, arg.length);
    if (handleDatabase.indexOf(arg.slice(0, 1)) !== -1) res = arg.slice(1, arg.length);
    return res;

}

/**
    * GRPP main function
*/
async function init(){

    /*
        Process settings flags
    */
    for (var i = 0; i < process.argv.length; i++){
        const currentFlag = checkFlagIsValid(process.argv[i]);

        // Check if needs to enable silent mode
        if (currentFlag.indexOf('silent') !== -1) enableSilentMode = !0;

        // Set max repos a batch file should have
        if (currentFlag.indexOf('maxReposPerList=') !== -1) tempSettings.maxReposPerList = preventMinMax(Number(currentFlag.replace('maxReposPerList=', '')), 1, maxValue);

        // Set max fetch pages
        if (currentFlag.indexOf('setMaxFetchPages=') !== -1) tempSettings.maxPages = preventMinMax(Number(currentFlag.replace('setMaxFetchPages=', '')), 1, maxValue);

        // Set web test url
        if (currentFlag.indexOf('setConnectionTestURL=') !== -1) tempSettings.connectionTestURL = currentFlag.replace('setConnectionTestURL=', '');

        // Set starting fetch page
        if (currentFlag.indexOf('setStartPage=') !== -1) tempSettings.fetchStartPage = preventMinMax(Number(currentFlag.replace('setStartPage=', '')), 0, maxValue);

        // Set GRPP path
        if (currentFlag.indexOf('path=') !== -1){

            // Set new path var and check if it exists. If not, try creating it
            const newPath = currentFlag.replace('path=', '');
            if (module_fs.existsSync(newPath) === !1) module_fs.mkdirSync(newPath);
            process.chdir(newPath);

        }

    }

    // Display main logo, create vars and check if needs to display help string
    grpp_displayMainLogo();
    var execFn:Function | null = null;
    if (process.argv.indexOf('help') === -1) createLogEntry('==> Use \"-help\" for more details\n');

    /*
        Process functions flags
    */
    for (var i = 0; i < process.argv.length; i++){
        const currentFlag = checkFlagIsValid(process.argv[i]);

        // Display help menu
        if (currentFlag.indexOf('help') !== -1){
            grpp_displayHelp();
            break;
        }

        // Print current stats
        if (currentFlag.indexOf('status') !== -1){
            execFn = grpp_printStatus;
            break;
        }

        // Save / update settings
        if (currentFlag.indexOf('saveSettings') !== -1){
            execFn = grpp_saveSettings;
            break;
        }

        // Initialize folder / path
        if (currentFlag.indexOf('init=') !== -1){
            grpp_initPath(currentFlag.replace('init=', ''));
            break;
        }
        if (currentFlag.indexOf('init') !== -1){
            grpp_initPath();
            break;
        }

        // Repair database
        if (currentFlag.indexOf('repair') !== -1){
            execFn = grpp_startRepairDatabase;
            break;
        }

        // Get user repos
        if (currentFlag.indexOf('getReposFrom=') !== -1){
            execFn = function(){
                grpp_getUserRepos(currentFlag.replace('getReposFrom=', ''));
            }
            break;
        }

        // Import repo
        if (currentFlag.indexOf('import=') !== -1){
            execFn = function(){
                grpp_startImport(currentFlag.replace('import=', ''));
            }
            break;
        }

        // Import repo from list
        if (currentFlag.indexOf('importList=') !== -1){
            execFn = function(){
                grpp_importBatch(module_fs.readFileSync(currentFlag.replace('importList=', ''), 'utf-8'));
            }
        }

        // Get info from a previously imported repo
        if (currentFlag.indexOf('getRepoData=') !== -1){
            execFn = function(){
                grpp_getRepoInfo(currentFlag.replace('getRepoData=', ''));
            }
            break;
        }

        // Update an specific repo
        if (currentFlag.indexOf('update=') !== -1){
            execFn = function(){
                grpp_updateRepo(currentFlag.replace('update=', ''));
            }
            break;
        }

        // Update all repos
        if (currentFlag.indexOf('updateAll') !== -1){
            execFn = grpp_checkBatchUpdateProcess;
            break;
        }

        // Process GRPP batch files
        if (currentFlag.indexOf('processBatchFile=') !== -1){
            execFn = async function(){
                await grpp_processBatchFile(Number(currentFlag.replace('processBatchFile=', '')));
            }
            break;
        }

        // Save repos url list
        if (currentFlag.indexOf('exportRemotes') !== -1){
            execFn = grpp_exportRemotes;
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