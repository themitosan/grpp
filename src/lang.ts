/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    lang.ts
*/

/*
    Import TS modules
*/

import { grpp_displayMainLogo } from './utils';
import { NPM_GLOBAL_PATH, grpp_updateUserSettings, grppUserSettings } from './main';
import { convertArrayToString, createLogEntry, execReasonListCheck, isValidJSON } from './tools';

/*
    Require node modules
*/

import * as module_fs from 'fs';

/*
    Variables
*/

// Lang database
export var langDatabase:any = {

    "common": {
        "confirmChar": "y",
        "processComplete": "INFO - Process complete!",
        "errorBatchUpdateRunning": "You can't execute this action while GRPP update is running!",
        "unknown": "Unknown"
    },

    "main": {

        "warnUnknownArgs": "WARN - Unknown args: \"%VAR_0%\"\n",

        "warnPathNotInit": "WARN - Unable to load settings because this location isn't initialized! GRPP will initialize this folder before moving on...",
        "version": "Version: %VAR_0% [%VAR_1%]\nCompiled at %VAR_2%\n",
        "knowMore": "==> Use \"--help\" for more details.\n",
        "noArgsProvided": "==> Since no args / flags were provided, We wish someone called %VAR_0% a great day! <3\n",

        "unableGetNpmRootPath": "ERROR - Unable to get NPM root path!\nReason: %VAR_0%",
        "unableGetNpmRootPath_notFound": "Path not found! (%VAR_0%)",

        "warnRepoNotFound": "WARN - Unable to find %VAR_0% on repo database!",

        "saveSettings": "INFO - Saving settings..."

    },

    "getReposFrom": {

        "errorUnableSeekUserRepos": "ERROR - Unable to seek repos!\nReason: %VAR_0%",
        "errorUnableSeekUserRepos_noUserName": "You must provide a username!",

        "questionReposHost": "Please specify where \"%VAR_0%\" repos are hosted:\n\n    1) GitHub (default)\n    2) GitLab\n    3) Gitea based server\n\nAnswer: ",
        "questionGiteaUrl": "\nPlease, insert base domain where gitea server is hosted (Example: \"192.168.1.150:3000\")\nURL: ",

        "errorNoReposAvailable": "No repos available for this user.",
        "errorFetchNotOk": "ERROR - Unable to fetch repo data!\nReason: %VAR_0% [Status: %VAR_1%]",

        "infoFetchUrl": "INFO - Fetching URL: %VAR_0%",

        "questionFetchRepoList": "INFO - GRPP managed to find %VAR_0% repos. Here is the full list:\n\n%VAR_1%\n\nHere is what you can do:\n\n    1) Import all repos (default)\n    2) Edit current list on text editor (%VAR_2%)\n    3) Save repo list on a file to import later\n    4) Cancel\n\nYour choice: ",
        "saveFileImportLater": "INFO - Process Complete!\nFile path: %VAR_0%/grpp_fetch_res.txt\n\nTo import repos from a file, use the following flag: \"--importList=PATH_TO_FILE\"\n"

    },

    "import": {

        "startCloneProcess": "INFO - Staring clone process...",
        "setGitFetchAllRefs": "INFO - Setting git config remote to fetch all refs from origin...",
        "setPathSafe": "INFO - GRPP will set %VAR_0% path as safe...",
        "cloneProcessComplete": "\nINFO - Process complete!\nRepo name: %VAR_0%\nPath: %VAR_1%\n",

        "batchCurrentRepo": "INFO - [%VAR_0% of %VAR_1%] Clonning URL: %VAR_2%",

        "warnUnableCloneRepo": "WARN - Unable to clone repo!\nReason: %VAR_0%\n",
        "warnUnableCloneRepo_noUrl": "You must provide a git url to import!",
        "warnUnableCloneRepo_repoExists": "This repo already exists on filesystem!\nPath: %VAR_0%",
        "warnUnableCloneRepo_updateRunning": "You can't import any repo while GRPP Update Process is running!"

    },

    "utils": {

        "help": {

            "welcomeStr": "Hi %VAR_0% - hopes for a great day!\nAll options displayed below can be triggered by using \"-\", \"--\" or even \"/\" (without quotes).\n\n==> Function list:\n",
            "fnArgsStr": "==> Functions with args:\n",
            "settingsStr": "==> Settings list:\n",

            "fnList": {
                "help": "Display this menu.",
                "batch": "GRPP will update all imported repos, excluding disabled repos.",
                "priority": "[Use this flag with \"--batch\"] Only update repos with \"isPriority\" value set as \"true\".",
                "skipUpdateReport": "[Use this flag with \"--batch\"] Skip post update message.",
                "status": "Display GRPP status from a initialized dir.",
                "silent": "Only print errors on screen.",
                "exportRemotes": "Export all clone urls from previously imported git repos into a file (grpp_urls.txt)",
                "repair": "This option will fix current database, linking any repo that is not present or removing any repo entry that doesn't exists.",
                "removeAllKeys": "Add this flag along \"--repair\" to automatically remove all missing keys from database. (USE WITH CARE!)",
                "langList": "List all available languages GRPP can be displayed."
            },

            "fnArgsList": {
                "init": "[PATH] Set a location where GRPP will initialize and backup your repos.\nYou can also just use \"--init\" to initialize where you currently are!",
                "import": "[GIT_URL] Imports a git repository to database.",
                "importList": "[PATH] Import a list of git repositories from a text file.",
                "path": "[PATH] Set GRPP current working directory.",
                "update": "[PATH] Updates a previously imported repo.",
                "getReposFrom": "[USERNAME] Attempts to list / import all repos from a specified user.",
                "getRepoData": "[PATH] Get information about a previously imported repo.",
                "processBatchFile": "[NUMBER] Loads / updates all repos in a list generated by \"--batch\" option.\nIMPORTANT: It's not recommended using this option manually.",
            },

            "settingsList": {
                "setLang": "[LANG] Set which language GRPP should be displayed. You can see the lang available list by using \"--langList\" option.",
                "maxReposPerList": "[NUMBER] Set how many repos a GRPP Batch Update list should have.",
                "setStartPage": "[NUMBER] Set which page GRPP should start fetching user repos from git hosting website.",
                "setMaxFetchPages": "[NUMBER] Set maximum of pages GRPP will fetch from remote on get user repos process.",
                "setConnectionTestURL": "[URL] Set URL which GRPP will use to test internet connection.",
                "setEditor": "[EDITOR] Set which text editor GRPP should use to open text files. (Default: nano)",
                "minifySettings": "[BOOLEAN] Set if GRPP should minify settings files (Default: true)"
            }

        },

        "getRepoInfo": {
            "errorUnableGetRepoInfo": "ERROR - Unable to get repo info!\nReason: %VAR_0%\n",
            "errorUnableGetRepoInfo_pathEmpty": "You must provide repo path!",
            "errorUnableGetRepoInfo_repoNull": "Unable to find repo: %VAR_0%",
            "errorUnableGetRepoInfo_noReposAvailable": "You must import any repo before using this option.",
            "repoData": "==> Repo data:\n\n%VAR_0%\n"
        },

        "exportRemotes": "INFO - Saving repos URL list...",
        "grppStatus": "==> GRPP Status:\n    Current path: %VAR_0%\n\n──┬ GRPP update run conter: %VAR_1%\n  ├ Last GRPP update run: %VAR_2%\n  ├ GRPP update runtime: %VAR_3% [%VAR_4% ms]\n  ├ Repos preserved: %VAR_5%\n  └ Disabled repos: %VAR_6% [%VAR_7% will be queued on batch update]\n"

    },

    "repair": {

        "warnUnablePerformRepair": "WARN - Unable to perform repair!\nReason: %VAR_0%",

        "infoCheckDatabaseFiles": "INFO - Checking repo list...",

        "databaseLengthMismatch": "WARN - Repo counter mismatch! [%VAR_0% on database vs. %VAR_1% found on current scan]\nStarting repair process...\n\n(Depending of how many repos are available, this may take a while!)\n",

        "importRemoveStatus": "\nINFO - Repair process imported %VAR_0% repos and removed %VAR_1% repos entries with %VAR_2% errors.\n",
        "importRemoveError": "==> Import / Remove errors:",
        "importRemoveDetails": "Repo: %VAR_0%\nDetails: %VAR_1%\n",

        "infoCheckMissingKeys": "INFO - Checking missing keys on repos entries...",
        "infoAddMissingKey": "INFO - Adding missing key \"%VAR_0%\" to %VAR_1%...",
        "infoRemoveKey": "INFO - Removing deprecated key from %VAR_0%: %VAR_1%",

        "removePathFromKey": "INFO - Removing path from current repo entry: \"%VAR_0%\"",
        "infoAddRemoveKeys": "INFO - GRPP added %VAR_0% missing keys and removed %VAR_1% deprecated keys on %VAR_2% repos.",
        "infoRepairComplete": "\nINFO - Repair complete!\n",

        "confirmRemoveRepoDatabase": "WARN - It seems that %VAR_0% does not exists!\nDo you want to remove this entry from database? [Y/n] ",

        "warnRepoNotBare": "WARN - It seems that %VAR_0%.git is not on bare format!",
        "importMissingRepo": "INFO - Importing missing repo: %VAR_0% [%VAR_1%]",

        "errorConfigFileNotExists": "Unable to read data from %VAR_0%.git because config file doesn't exists!\nGRPP will remove this repo entry from database...",
        "pushErrorWarn": "WARN - %VAR_0%",

        "warnDbVersinoMismatch": "WARN - It seems that your database version is from another grpp version!\nMake sure to run grpp on repair mode to prevent any possible issues."

    },

    "update": {

        "errorUnableStartUpdate": "ERROR - Unable to start update process!\nReason: %VAR_0%",
        "errorUnableStartUpdate_noRepos": "You must import any repo in order to continue!",
        "errorUnableStartUpdate_updateRunning": "It seems that GRPP Update Process is running! Make sure to wait current update process ends before trying again.",

        "errorUnableUpdateRepo": "ERROR - Unable to update repo!\nReason: %VAR_0%\n",
        "errorUnableUpdateRepo_repoNotFound": "Unable to find following entry on database: %VAR_0%",

        "repoUpToDate": "INFO - %VAR_0% is up to date!",
        "repoUpdateData": "INFO - Update data:\n%VAR_0%",

        "errorBatchFileNotFound": "ERROR - Unable to locate batch file!\nPath: %VAR_0%",

        "startBatchUpdate": "INFO - Starting GRPP Batch Update process... (Creating %VAR_0% processes, with at max. %VAR_1% repos per list)",

        "batchStatus": "==> Batch update:",
        "batch_overallProgress": "Overall Progress: %VAR_0%% [%VAR_1% of %VAR_2%]",
        "batch_updateCounter": "Update counter: %VAR_0%",
        "batch_errorCounter": "Error counter: %VAR_0%",
        "batch_elapsedTime": "Elapsed time: %VAR_0%",
        "batchProcessList": "==> Process list:",

        "batchProcess": "%VAR_0% %VAR_1% Process %VAR_2% - Progress: %VAR_3%% [%VAR_4% of %VAR_5%] - Repos updated: %VAR_6%, Errors: %VAR_7%%VAR_8%",

        "noErrorsRun": "...there was no errors on this run.",
        "noUpdatesRun": "...there was no updates on this run.",
        "noSkippedReposRun": "...there was no skipped repos on this run.",

        "resultDetails": "==> Updates:\n%VAR_0%\n\n==> Errors:\n%VAR_1%\n",

        "resultPage": "Backup path: %VAR_0%\n\n==> Results:\n\n──┬ User: %VAR_1%\n  ├ Processes: %VAR_2%\n  ├ Update duration: %VAR_3% [%VAR_4% ms]\n  ├ Total repos queued: %VAR_5% [From %VAR_6% on database, %VAR_7% were skipped]\n  ├ Repos updated on this run: %VAR_8%\n  └ Error counter: %VAR_9%",

        "logTemplate": "%VAR_0%\nVersion: %VAR_1% [%VAR_2%]\nCompiled at %VAR_3%\n\nLog created at %VAR_4%\nRun args: %VAR_5%\n%VAR_6%\n\n%VAR_7%",
        "infoProcessComplete": "INFO - Process complete!\n%VAR_0%\n\nYou can see more details on gereated log file: %VAR_1%\n\nDo you want to open it? [Y/n] ",

        "warnFoundBrokenBatchRun": "WARN: GRPP found an incomplete batch run attempt!\nDo you want to save a report with current data? [Y/n] ",

        "warnBrokenBatchRun": "\nWARN: This report was created from an aborted / incomplete run!\n",
        "unableFindBatchFile": "WARN: Unable to create report because batch file was not found!",
        "missingResFile": "\nWARN: One of the result files was not found, making this report incomplete."

    },

    "lang": {
        "unableSetLang": "ERROR - Unable to set lang!\nReason: %VAR_0%",
        "unableSetLang_fileNotFound": "Unable to locate lang file: %VAR_0%",
        "errorUnableLoadLang": "ERROR - Unable to load lang %VAR_0%!\nReason: %VAR_1%",
        "errorUnableLoadLang_fileNotFound": "Unable to load lang \"%VAR_0%\" because it was not found or is not a valid file.",
        "errorUnableLoadLang_keyMismatch": "Key counter mismatch from main lang database!\n\"%VAR_0%\" is not present on lang file!\n\nPlease fix lang file or reset user settings lang to \"en-us\".",
        "displayLangList": "==> Here is the list of all available languages you can pick:\n\n%VAR_0%\n\nTo set, run \"grpp --setLang=[LANG]\". (Without quotes)\n"
    }

};

/*
    Functions
*/

/**
    * Display lang list 
*/
export function grpp_displayLangList(){

    // Create lang list var and read all available langs on grpp lang path
    const langList = ['en-us'];
    module_fs.readdirSync(`${NPM_GLOBAL_PATH}/grpp/Lang`).forEach(function(currentLangFile){
        langList.push(currentLangFile.replace('.json', ''));
    });
    createLogEntry(grpp_convertLangVar(langDatabase.lang.displayLangList, [convertArrayToString(langList)]));

}

/**
    * Set GRPP display language
    * @param newLang [string] Lang file prefix
*/
export function grpp_setLang(newLang:string){

    // Create canChangeLang var and check if new language isn't default and file exists
    const reasonList:string[] = [];
    if (newLang !== 'en-us' && module_fs.existsSync(`${NPM_GLOBAL_PATH}/grpp/Lang/${newLang}.json`) !== !0) reasonList.push(grpp_convertLangVar(langDatabase.lang.unableSetLang_fileNotFound, [newLang]));

    // Check if can update lang
    execReasonListCheck(reasonList, langDatabase.lang.unableSetLang, function(){
        grpp_updateUserSettings({ lang: newLang });
    });

}

/**
    * Load user language
*/
export async function grpp_loadLang(){

    // Check if needs to change language
    if (grppUserSettings.lang !== 'en-us'){

        // Create langPath const and check if file exists / is a valid JSON
        const langPath = `${NPM_GLOBAL_PATH}/grpp/Lang/${grppUserSettings.lang}.json`;
        if (module_fs.existsSync(langPath) === !0 && isValidJSON(module_fs.readFileSync(langPath, 'utf-8')) === !0){

            // Check lang keys
            await checkLangKeys(JSON.parse(module_fs.readFileSync(langPath, 'utf-8'))).catch(function(err){
                grpp_displayMainLogo(!0);
                createLogEntry(grpp_convertLangVar(langDatabase.lang.errorUnableLoadLang, [grppUserSettings.lang, err]));
                process.exit();
            });

        } else {
            createLogEntry(grpp_convertLangVar(langDatabase.lang.errorUnableLoadLang_fileNotFound, [grppUserSettings.lang]));
        }

    }

}

/**
    * Check if all lang keys matches default lang
    * @param langKeys [object] Lang file data parsed as json
*/
async function checkLangKeys(langKeys:any){
    return new Promise<void>(function(resolve){

        // Create missingKeys var and check object function
        const
            missingKeys:string[] = [],
            checkObject = function(currentObject:any, sampleObject:any){

            // Create object array and start check process
            const objectArray = Object.keys(currentObject);
            for (var keyIndex = 0; keyIndex < objectArray.length; keyIndex++){

                // Get current key and check if sample object contains it
                const currentKey = objectArray[keyIndex];
                if (sampleObject[currentKey] === void 0){
                    missingKeys.push(currentKey);
                    break;
                }

                // Check if current key is an object
                if (typeof currentObject[currentKey] === 'object') checkObject(currentObject[currentKey], sampleObject[currentKey]);

            }

        }

        // Start check process and check if current lang file is valid
        checkObject(langKeys, langDatabase);
        if (missingKeys.length === 0){
            langDatabase = structuredClone(langKeys);
            resolve();
        } else {
            throw grpp_convertLangVar(langDatabase.lang.errorUnableLoadLang_keyMismatch, [missingKeys]);
        }

    });
}

/**
    * Convert lang string
    * @param langStr [string] String to be processed
    * @param replaceList [any[]] List of values to be replaced on current string 
*/
export function grpp_convertLangVar(langStr:string, replaceList:any[]){
    replaceList.forEach(function(currentVar, currentIndex){
        langStr = langStr.replaceAll(`%VAR_${currentIndex}%`, currentVar);
    });
    return langStr;
}

// Export module
export * from './lang';