/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    utils.ts
*/

/*
    Import TS modules
*/

import { grppSettings } from './main';
import { grppRepoEntry } from './import';
import { grpp_commandList, grpp_optionList } from './database';
import { converMsToHHMMSS, convertArrayToString, createLogEntry, execReasonListCheck, trimString } from './tools';

/*
    Require node modules
*/

import * as module_fs from 'fs';

/*
    Functions
*/

/**
    * Print GRPP status
*/
export function grpp_printStatus(){
    createLogEntry(`==> GRPP Status:\n    Current path: ${process.cwd()}\n`);
    createLogEntry(`──┬ Total times GRPP Update executed: ${grppSettings.runCounter}`);
    createLogEntry(`  ├ Total GRPP Update runtime: ${converMsToHHMMSS(grppSettings.updateRuntime)} [${grppSettings.updateRuntime} ms]`);
    createLogEntry(`  ├ Last time GRPP Update was executed: ${grppSettings.lastRun}`);
    createLogEntry(`  └ Total repos preserved: ${Object.keys(grppSettings.repoEntries).length}\n`);
}

/**
    * Clear screen and display main logo
*/
export function grpp_displayMainLogo(){
    console.clear();
    createLogEntry("\n   <=============================================================>");
    createLogEntry("   <=|          Git Repo Preservation Project (GRPP)           |=>");
    createLogEntry("   <=|     Created by Juliana (@julianaheartz.bsky.social)     |=>");
    createLogEntry("   <=============================================================>");
    createLogEntry("   <=|             A classic quote from an old one:            |=>");
    createLogEntry("   <=|                   \"Quem guarda, \x1b[1;32mt\x1b[1;33me\x1b[1;34mm\x1b[0m!\"                   |=>");
    createLogEntry("   <=============================================================>\n");
}

/**
    * Display help menu
*/
export function grpp_displayHelp(){
    createLogEntry('==> Function list:\n');
    Object.keys(grpp_commandList).forEach(function(currentFlag:any){
        createLogEntry(`${currentFlag}\n${grpp_commandList[currentFlag]}\n`);
    });
    createLogEntry('==> Options list:\n');
    Object.keys(grpp_optionList).forEach(function(currentFlag:any){
        createLogEntry(`${currentFlag}\n${grpp_optionList[currentFlag]}\n`);
    });
}

/**
    * Get repo info
    * @param path [string] database path to repo
*/
export function grpp_getRepoInfo(path:string){

    // Declare vars
    var reasonList:string[] = [],
        repoIndex:number | null = grpp_getRepoIndex(path);

    // Start checking conditions and check if can continue
    if (grppSettings.repoEntries.length < 1) reasonList.push('You must import any repo before using this option.');
    if (path.length < 1) reasonList.push('You must provide repo path!');
    if (repoIndex === null) reasonList.push(`Unable to find repo with provided path!`);
    execReasonListCheck(reasonList, `ERROR - Unable to get repo info!\nReason: ${convertArrayToString(reasonList)}`, function(){

        // Get repo data
        const 
            fullPath:string = Object.keys(grppSettings.repoEntries)[repoIndex!],
            currentRepoData:grppRepoEntry = grppSettings.repoEntries[fullPath];
        createLogEntry(`==> Repo info:\n\n${JSON.stringify(currentRepoData, null, 4)}\n`);
    
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
    createLogEntry(`INFO - Saving repos url list...`);
    module_fs.writeFileSync(`${process.cwd()}/grpp_urls.txt`, trimString(res), 'utf-8');

}

// Export module
export * from './utils';