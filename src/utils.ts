/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    utils.ts
*/

/*
    Import TS modules
*/

import { grppSettings } from './main';
import { grppRepoEntry } from './import';
import { grpp_convertLangVar, langDatabase } from './lang';
import { consoleClear, converMsToHHMMSS, convertArrayToString, createLogEntry, execReasonListCheck, trimString } from './tools';

/*
    Require node modules
*/

import * as module_fs from 'fs';
import * as module_os from 'os';

/*
    Functions
*/

/**
    * Print GRPP status
*/
export function grpp_printStatus(){

    // Get total number of disabled repos
    var disabledRepos = 0;
    const repoList = Object.keys(grppSettings.repoEntries);
    repoList.forEach(function(repoPath){
        if (grppSettings.repoEntries[repoPath].canUpdate === !1) disabledRepos++;
    });

    // Display status
    createLogEntry(grpp_convertLangVar(langDatabase.utils.grppStatus, [
        process.cwd(),
        grppSettings.runCounter,
        grppSettings.lastRun,
        converMsToHHMMSS(grppSettings.updateRuntime),
        grppSettings.updateRuntime,
        repoList.length,
        disabledRepos,
        (repoList.length - disabledRepos)
    ]));

}

/**
    * Get logo string
    * @param removeColors [boolean] Set true to remove colors (Default: false) 
*/
export function grpp_getLogoString(removeColors:boolean = !1):string {

    var logo = `
    <=====================================================>
    <=|       Git Repo Preservation Project (GRPP)      |=>
    <=| Created by TheMitoSan (@themitosan.bsky.social) |=>
    <=|=================================================|=>
    <=|         A classic quote from an old one:        |=>
    <=|               \"Quem guarda, \x1b[1;32mt\x1b[1;33me\x1b[1;34mm\x1b[0m!\"               |=>
    <=====================================================>\n`;

    // Check if needs to remove color chars and return logo
    if (removeColors === !0){

        [
            '\x1b[1;32m',
            '\x1b[1;33m',
            '\x1b[1;34m',
            '\x1b[0m'
        ].forEach(function(currentChar){
            logo = logo.replace(currentChar, '');
        });

    }
    return logo;

}

/**
    * Clear screen and display main logo
*/
export function grpp_displayMainLogo(clear:boolean){
    consoleClear(clear);
    createLogEntry(grpp_getLogoString());
}

/**
    * Display help menu
*/
export function grpp_displayHelp(){

    grpp_displayMainLogo(!0);
    createLogEntry(grpp_convertLangVar(langDatabase.utils.help.welcomeStr, [module_os.userInfo().username]));
    Object.keys(langDatabase.utils.help.fnList).forEach(function(currentFlag:any){
        createLogEntry(`--${currentFlag}\n${langDatabase.utils.help.fnList[currentFlag]}\n`);
    });

    createLogEntry(langDatabase.utils.help.fnArgsStr);
    Object.keys(langDatabase.utils.help.fnArgsList).forEach(function(currentFlag:any){
        createLogEntry(`--${currentFlag}\n${langDatabase.utils.help.fnArgsList[currentFlag]}\n`);
    });

    createLogEntry(langDatabase.utils.help.settingsStr);
    Object.keys(langDatabase.utils.help.settingsList).forEach(function(currentFlag:any){
        createLogEntry(`--${currentFlag}\n${langDatabase.utils.help.settingsList[currentFlag]}\n`);
    });

}

/**
    * Get repo info
    * @param path [string] database path to repo
*/
export function grpp_getRepoInfo(path:string){

    // Declare vars and consts
    const reasonList:string[] = [];
    var repoIndex:number | null = grpp_getRepoIndex(path);

    // Test conditions to not get repo data
    if (path.length < 1) reasonList.push(langDatabase.utils.getRepoInfo.errorUnableGetRepoInfo_pathEmpty);
    if (module_fs.existsSync(`${process.cwd()}/.temp/`) === !0) reasonList.push(langDatabase.common.errorBatchUpdateRunning);
    if (grppSettings.repoEntries.length < 1) reasonList.push(langDatabase.utils.getRepoInfo.errorUnableGetRepoInfo_noReposAvailable);
    if (repoIndex === null) reasonList.push(grpp_convertLangVar(langDatabase.utils.getRepoInfo.errorUnableGetRepoInfo_repoNull, [path]));

    // Check if can get repo data
    execReasonListCheck(reasonList, langDatabase.utils.getRepoInfo.errorUnableGetRepoInfo, function(){

        // Get repo data
        const 
            fullPath = Object.keys(grppSettings.repoEntries)[repoIndex!],
            currentRepoData:grppRepoEntry = grppSettings.repoEntries[fullPath];
        createLogEntry(grpp_convertLangVar(langDatabase.utils.getRepoInfo.repoData, [JSON.stringify(currentRepoData, void 0, 4)]));
    
    });

}

/**
    * Get repo index
    * @param path [string] repo path
    * @return [number | null] Repo index or null if not found
*/
export function grpp_getRepoIndex(path:string):number | null {

    // Create variables and check if full path was provided
    var res:number | null = null;
    if (grppSettings.repoEntries[path] === void 0){

        // Start seeking current repo path
        const repoArray = Object.keys(grppSettings.repoEntries);
        for (var currentRepo = 0; currentRepo < repoArray.length; currentRepo++){

            // Check if found current repo
            if (repoArray[currentRepo].indexOf(path) !== -1){
                res = currentRepo;
                break;
            }

        }

    } else {
        res = Object.keys(grppSettings.repoEntries).indexOf(path);
    }

    // Return res
    return res;

}

/**
    * Export all remote urls
*/
export function grpp_exportRemotes(){

    // Create res var, process all repos and save file
    var res = '';
    Object.keys(grppSettings.repoEntries).forEach(function(currentRepo){
        res = `${res}${grppSettings.repoEntries[currentRepo].repoUrl}\n`;
    });
    createLogEntry(langDatabase.utils.exportRemotes);
    module_fs.writeFileSync(`${process.cwd()}/grpp_urls.txt`, trimString(res), 'utf-8');

}

// Export module
export * from './utils';