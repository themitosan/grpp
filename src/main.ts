/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    main.ts
*/

/*
    Import TS modules
*/

import { grpp_getReposFrom } from './getReposFrom';
import { grpp_startRepairDatabase } from './repair';
import { createLogEntry, preventMinMax, getArgName } from './tools';
import { grpp_batchImport, grpp_startImport, grppRepoEntry } from './import';
import { grpp_checkBatchUpdateProcess, grpp_processBatchFile, grpp_updateRepo } from './update';
import { grpp_convertLangVar, grpp_displayLangList, grpp_loadLang, grpp_setLang, langDatabase } from './lang';
import { grpp_displayHelp, grpp_displayMainLogo, grpp_exportRemotes, grpp_getRepoInfo, grpp_printStatus } from './utils';

/*
    Require node modules
*/

import * as module_fs from 'fs';
import * as module_os from 'os';
import * as module_childProcess from 'child_process';

/*
    Special consts
*/

export const

    // App version
    APP_VERSION = '[APP_VERSION]',

    // App hash
    APP_HASH = '[APP_HASH]',

    // Compiled at
    APP_COMPILED_AT = '[APP_BUILD_DATE]';

/*
    Interfaces
*/

// GRPP Settings file
export interface grppSettingsFile {
    version:number,
    lastRun:string,
    maxPages:number,
    repoEntries:any,
    runCounter:number,
    userEditor:string,
    updateRuntime:number,
    fetchStartPage:number,
    maxReposPerList:number,
    prettyPrintJson:boolean,
    connectionTestURL:string
}

// GRPP User Settings
export interface grppUserSettings {
    lang:string
}

/*
    Defaults
*/

// Default settings file
export const grppSettingsFile_Defaults:any | Pick <grppSettingsFile, 'version' | 'lastRun' | 'repoEntries' | 'runCounter' | 'maxReposPerList' | 'maxPages' | 'connectionTestURL' | 'updateRuntime' | 'fetchStartPage' | 'userEditor' | 'prettyPrintJson'> = {
    maxPages: 5,
    runCounter: 0,
    repoEntries: {},
    lastRun: 'Never',
    updateRuntime: 0,
    fetchStartPage: 1,
    userEditor: 'nano',
    maxReposPerList: 50,
    prettyPrintJson: !1,
    version: APP_VERSION,
    connectionTestURL: '1.1.1.1'
}

// Default user settings
export const grppUserSettings_Defaults:Pick <grppUserSettings, 'lang'> = {
    lang: 'en-us'
}

/*
    Variables
*/

const 

    // Settings max number value
    maxValue = 99999,

    // Temp settings to be appended on main settings file
    tempSettings:grppSettingsFile | any = {};

export var

    // Is silent mode active
    enableSilentMode = !1,

    // Repair: remove all missing keys from database automatically
    repair_removeAllKeys = !1,

    // Update: skip process complete message
    update_skipProcessComplete = !1,

    // NPM global path
    NPM_GLOBAL_PATH = '',

    // App default working dir
    originalCwd = structuredClone(process.cwd()),

    // User settings
    grppUserSettings:grppUserSettings = { ...grppUserSettings_Defaults },

    // Database settings
    grppSettings:grppSettingsFile | any = { ...grppSettingsFile_Defaults };

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

                // Create request save var, load settings and check if needs to update settings file
                var requestSave = !1;
                grppSettings = { ...JSON.parse(module_fs.readFileSync(filePath, 'utf-8')), ...tempSettings };
                Object.keys(grppSettings).forEach(function(currentKey){
                    if (grppSettingsFile_Defaults[currentKey] === void 0){
                        delete grppSettings[currentKey];
                        requestSave = !0;
                    }
                });
                Object.keys(grppSettingsFile_Defaults).forEach(function(currentKey:any){
                    if (grppSettings[currentKey] === void 0){
                        grppSettings[currentKey] = grppSettingsFile_Defaults[currentKey];
                        requestSave = !0;
                    }
                });

                // Check if versio matches. If not, warn user to run repair mode
                if (grppSettings.version !== APP_VERSION){
                    createLogEntry(langDatabase.repair.warnDbVersinoMismatch, 'warn');
                    grppSettings.version = APP_VERSION;
                    grpp_saveSettings();
                }

                // Check if needs to update settings file and resolve
                if (requestSave !== !1) grpp_saveSettings();
                resolve();

            } catch (err) {
                reject(err);
            }

        } else {
            createLogEntry(langDatabase.main.warnPathNotInit, 'warn');
            grpp_initPath();
            resolve();
        }

    });
}

/**
    * Save GRPP settings
    * @param mode [string] Which settings file should be updated (Default: grpp_settings)
    * @param displayLog [boolean] Set true to display saving message on screen
*/
export async function grpp_saveSettings(mode:string = 'db', displayLog:boolean = !1){
    try {

        // Move to original chdir, create settings var and check if needs to format it
        process.chdir(originalCwd);
        var settingsData = JSON.stringify(grppSettings);
        if (mode === 'user') settingsData = JSON.stringify(grppUserSettings);
        if (grppSettings.prettyPrintJson === !0) settingsData = JSON.stringify(JSON.parse(settingsData), void 0, 4);
        
        // Check if needs to display message and swicth save mode
        if (displayLog === !0) createLogEntry(langDatabase.main.saveSettings);
        switch (mode){

            // User settings
            case 'user':
                module_fs.writeFileSync(`${module_os.userInfo().homedir}/.config/grpp/user_settings.json`, settingsData);
                break;

            // Database
            default:
                module_fs.writeFileSync(`${process.cwd()}/grpp_settings.json`, settingsData, 'utf-8');
                break;

        }

    } catch (err) {
        throw err;
    }
}

/**
    * Update database settings
    * @param data [grppSettingsFile] settings to be updated
*/
export function grpp_updateDatabaseSettings(data:any){
    grppSettings = { ...grppSettings, ...data };
    grpp_saveSettings();
}

/**
    * Update user settings
    * @param data [grppSettingsFile] settings to be updated
*/
export function grpp_updateUserSettings(data:any){
    grppUserSettings = { ...grppUserSettings, ...data };
    grpp_saveSettings('user');
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
    return new Promise<void>(function(resolve){
        if (grppSettings.repoEntries[path] !== void 0){
            delete grppSettings.repoEntries[path];
            grpp_saveSettings();
        } else {
            createLogEntry(grpp_convertLangVar(langDatabase.main.warnRepoNotFound, [path]), 'warn');
        }
        resolve();
    });
}
/**
    * Load user settings 
*/
function grpp_loadUserSettings(){

    // Check if user settings file / path exists
    const userSettingsFilePath = `${module_os.userInfo().homedir}/.config/grpp/user_settings.json`;
    if (module_fs.existsSync(userSettingsFilePath) === !1){

        // Try creating path and user settings file
        try {

            [
                `${module_os.userInfo().homedir}/.config`,
                `${module_os.userInfo().homedir}/.config/grpp`
            ].forEach(function(path){
                if (module_fs.existsSync(path) === !1) module_fs.mkdirSync(path);
            });
            module_fs.writeFileSync(userSettingsFilePath, JSON.stringify(grppUserSettings));

        } catch (err) {
            throw err;
        }

    } else {
        grppUserSettings = JSON.parse(module_fs.readFileSync(userSettingsFilePath, 'utf-8'));
    }

}

/**
    * Get NPM root path
    * This is required in order to load language files from grpp install path
*/
async function grpp_getNpmRootPath(){
    return new Promise<void>(function(resolve){

        try {

            // Run command to get global path and set NPM_GLOBAL_PATH value
            const childProcess = module_childProcess.exec(`npm root -g`);
            childProcess.stdout!.on('data', function(data){
                NPM_GLOBAL_PATH = data.replaceAll('\n', '');
            });

            // Check if grpp managed to get pathc correctly after process exit
            childProcess.on('exit', function(){
                if (module_fs.existsSync(NPM_GLOBAL_PATH) === !0){
                    resolve();
                } else {
                    throw grpp_convertLangVar(langDatabase.main.unableGetNpmRootPath_notFound, [NPM_GLOBAL_PATH]);
                }
            });

        } catch (err) {
            throw err;
        }

    });
}

/**
    * Checks if all args are valid
    * @param startIndex [number] process.argv starting position
*/
function checkArgIsValid(startIndex:number){
    
    // Declare vars
    const
        unknownArgs:string[] = [],
        argList = structuredClone(process.argv).splice(startIndex + 1),
        fnList = Object.keys(langDatabase.utils.help.fnList),
        fnArgsList = Object.keys(langDatabase.utils.help.fnArgsList),
        settingsList = Object.keys(langDatabase.utils.help.settingsList);

    // Process arg list and check if all of them exists on function / settings database
    for (var argIndex = 0; argIndex < argList.length; argIndex++){
        var currentArg = getArgName(argList[argIndex]);
        if (currentArg.indexOf('=') !== -1) currentArg = currentArg.slice(0, currentArg.indexOf('='));
        if ([fnList.indexOf(currentArg) !== -1, fnArgsList.indexOf(currentArg) !== -1, settingsList.indexOf(currentArg) !== -1 ].indexOf(!0) === -1) unknownArgs.push(currentArg);
    }

    // Check if needs to display unknown args list
    if (unknownArgs.length > 0) createLogEntry(grpp_convertLangVar(langDatabase.main.warnUnknownArgs, [unknownArgs]), 'warn');

}

/**
    * GRPP main function
*/
async function init(){

    // Change window title, load user settings, get NPM root path and load user language
    process.stdout.write('\x1b]2;Git Repo Preservarion Project (GRPP)\x1b\x5c');
    grpp_loadUserSettings();
    await grpp_getNpmRootPath().catch(function(err){
        createLogEntry(grpp_convertLangVar(langDatabase.main.unableGetNpmRootPath, [err]));
    })
    .then(grpp_loadLang);

    // Create vars
    var execFn:Function | null = null,
        grppCmdIndex:number | null = null;

    /*
        Process settings flags
    */
    for (var i = 0; i < process.argv.length; i++){

        // Create consts
        const
            currentArg = getArgName(process.argv[i]),
            saveSettings = function(){
                grpp_saveSettings('user', !0);
            };

        // Check if current flag is grpp call
        if (process.argv[i].indexOf('/grpp') !== -1 && i < (process.argv.length - 1)) grppCmdIndex = i;

        // Check if needs to enable silent mode
        if (currentArg.indexOf('silent') !== -1) enableSilentMode = !0;

        // Repair: Check if will remove all missing keys from database automatically
        if (currentArg.indexOf('removeAllKeys') !== -1) repair_removeAllKeys = !0;

        // Update: Skip process complete message
        if (currentArg.indexOf('skipUpdateReport') !== -1) update_skipProcessComplete = !0;

        // Set max repos a batch file should have
        if (currentArg.indexOf('maxReposPerList=') !== -1){
            tempSettings.maxReposPerList = preventMinMax(Math.floor(Number(currentArg.replace('maxReposPerList=', ''))), 1, maxValue);
            execFn = saveSettings;
        }

        // User settings: Set lang
        if (currentArg.indexOf('setLang=') !== -1) grpp_setLang(currentArg.replace('setLang=', ''));

        // Set max fetch pages
        if (currentArg.indexOf('setMaxFetchPages=') !== -1){
            tempSettings.maxPages = preventMinMax(Math.floor(Number(currentArg.replace('setMaxFetchPages=', ''))), 1, maxValue);
            execFn = saveSettings;
        }

        // Set web test url
        if (currentArg.indexOf('setConnectionTestURL=') !== -1){
            tempSettings.connectionTestURL = currentArg.replace('setConnectionTestURL=', '');
            execFn = saveSettings;
        }

        // Set starting fetch page
        if (currentArg.indexOf('setStartPage=') !== -1){
            tempSettings.fetchStartPage = preventMinMax(Math.floor(Number(currentArg.replace('setStartPage=', ''))), 0, maxValue);
            execFn = saveSettings;
        }

        // Set text editor
        if (currentArg.indexOf('setEditor') !== -1){
            tempSettings.userEditor = currentArg.replace('setEditor=', '');
            execFn = saveSettings;
        }

        // Set GRPP path
        if (currentArg.indexOf('path=') !== -1){

            // Set new path var and check if it exists. If not, try creating it
            const newPath = currentArg.replace('path=', '');
            if (module_fs.existsSync(newPath) === !1) module_fs.mkdirSync(newPath);
            originalCwd = structuredClone(newPath);
            process.chdir(newPath);

        }

    }

    // Display main logo, version and create execFn var
    grpp_displayMainLogo(!1);
    createLogEntry(grpp_convertLangVar(langDatabase.main.version, [APP_VERSION, APP_HASH, APP_COMPILED_AT]));
    createLogEntry(langDatabase.main.knowMore);

    // Check if grpp command position was found. If so, check if all arguments are valid
    if (grppCmdIndex !== null) checkArgIsValid(grppCmdIndex);

    /*
        Process functions flags
    */
    for (var i = 0; i < process.argv.length; i++){
        const currentArg = getArgName(process.argv[i]);

        // Display help menu
        if (currentArg.indexOf('help') !== -1){
            grpp_displayHelp();
            break;
        }

        // List all available lang options
        if (currentArg.indexOf('langList') !== -1){
            grpp_displayLangList();
            break;
        }

        // Print current stats
        if (currentArg.indexOf('status') !== -1){
            execFn = grpp_printStatus;
            break;
        }

        // Initialize folder / path
        if (currentArg.indexOf('init=') !== -1){
            grpp_initPath(currentArg.replace('init=', ''));
            break;
        }
        if (currentArg.indexOf('init') !== -1){
            grpp_initPath();
            break;
        }

        // Repair database
        if (currentArg.indexOf('repair') !== -1){
            execFn = grpp_startRepairDatabase;
            break;
        }

        // Get repos from user
        if (currentArg.indexOf('getReposFrom=') !== -1){
            execFn = function(){
                grpp_getReposFrom(currentArg.replace('getReposFrom=', ''));
            }
            break;
        }

        // Import repo
        if (currentArg.indexOf('import=') !== -1){
            execFn = function(){
                grpp_startImport(currentArg.replace('import=', ''));
            }
            break;
        }

        // Import repo from list
        if (currentArg.indexOf('importList=') !== -1){
            execFn = function(){
                grpp_batchImport(module_fs.readFileSync(currentArg.replace('importList=', ''), 'utf-8'));
            }
        }

        // Get info from a previously imported repo
        if (currentArg.indexOf('getRepoData=') !== -1){
            execFn = function(){
                grpp_getRepoInfo(currentArg.replace('getRepoData=', ''));
            }
            break;
        }

        // Update an specific repo
        if (currentArg.indexOf('update=') !== -1){
            execFn = function(){
                grpp_updateRepo(currentArg.replace('update=', ''));
            }
            break;
        }

        // Update all repos
        if (currentArg.indexOf('batch') !== -1){
            execFn = grpp_checkBatchUpdateProcess;
            break;
        }

        // Process GRPP batch files
        if (currentArg.indexOf('processBatchFile=') !== -1){
            execFn = async function(){
                await grpp_processBatchFile(Number(currentArg.replace('processBatchFile=', '')));
            }   
            break;
        }

        // Save repos url list
        if (currentArg.indexOf('exportRemotes') !== -1){
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
    if (execFn === null && process.argv.length < 3) createLogEntry(grpp_convertLangVar(langDatabase.main.noArgsProvided, [module_os.userInfo().username]));

}

// Start GRPP
await init();