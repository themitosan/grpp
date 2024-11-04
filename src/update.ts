/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    update.ts
*/

/*
    Import TS modules
*/

import { grppSettings } from './main';
import { grppRepoEntry } from './database';
import { checkConnection, convertArrayToString, execReasonListCheck, spliceArrayIntoChunks } from './utils';

/*
    Require node modules
*/

import * as module_childProcess from 'child_process';

/*
    Functions
*/

/**
    * Check if can start update
*/
export async function grpp_checkBeforeUpdateProcess(){

    // Check if we have some internet connection
    await checkConnection().then(function(){

        // Declare vars and check if there is repos to be updated
        var reasonList:string[] = [];
        if (grppSettings.repoEntries.length === 0){
            reasonList.push('You must import any repo before starting GRPP update process!');
        }

        // Check if can start
        execReasonListCheck(reasonList, `ERROR - Unable to start update process!\nReason: ${convertArrayToString(reasonList)}`, startUpdateAll);

    }).catch(function(err){
        throw `ERROR - Unable to start update process because GRPP connection test failed!\nDetails: ${err}\n`;
    });

}

/**
    * Update GRPP Repo
    * @param hash [string] repo hash identifier
*/
export async function grpp_updateRepo(hash:string){
    // WIP
}

/**
    * Start GRPP update process [WIP]
*/
function startUpdateAll(){

    // Declare vars
    var completedRunners = 0,
        updateList:grppRepoEntry[] = [];

    // Filter repos that cannot be updated
    grppSettings.repoEntries.forEach(function(currentRepo:grppRepoEntry){
        if (currentRepo.canUpdate === !0){
            updateList.push(currentRepo);
        } else {
            console.warn(`WARN - Skipping ${currentRepo.repoName} (${currentRepo.repoPath}) because it was disabled!`);
        }
    });

    // Split update list on given runners
    updateList = spliceArrayIntoChunks(updateList, grppSettings.threads);
    console.info(updateList.length);

}

// Export module
export * from './update';