/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    update.ts
*/

/*
    Import TS modules
*/

import { grppRepoEntry } from './main';
import { grpp_updateRepoData, grpp_updateSettings, grppSettings } from './main';
import { checkConnection, convertArrayToString, execReasonListCheck, parsePositive, runExternalCommand, runExternalCommand_Defaults, runExternalCommand_output, spliceArrayIntoChunks } from './utils';

/*
    Functions
*/

/**
    * Check if can start update
*/
export async function grpp_checkBeforeUpdateProcess(){

    // Check if we have some internet connection
    await checkConnection().then(function(){

        // Declare vars, check if there is repos to be updated and check if can continue
        var reasonList:string[] = [];
        if (grppSettings.repoEntries.length === 0){
            reasonList.push('You must import any repo before starting GRPP update process!');
        }
        execReasonListCheck(reasonList, `ERROR - Unable to start update process!\nReason: ${convertArrayToString(reasonList)}`, startUpdateAll);

    }).catch(function(err){
        throw `ERROR - Unable to start update process because GRPP connection test failed!\nDetails: ${err}\n`;
    });

}

/**
    * Update GRPP Repo
    * @param path [string] repo path
*/
export async function grpp_updateRepo(path:string){

    // Declare vars and check if repo exists on database
    var reasonList:string[] = [];
    if (grppSettings.repoEntries[path] === void 0){
        reasonList.push(`Unable to find the following path on database: ${path}`);
    }

    // Check if can continue
    execReasonListCheck(reasonList, `ERROR: Unable to update repo!\nReason: ${convertArrayToString(reasonList)}\n`, async function(){

        // Declare vars
        var updateRuntime = 0,
            updateStartTime = performance.now();

        // Get current repo data and start fetching updates
        const currentRepoData:grppRepoEntry = grppSettings.repoEntries[path];
        await runExternalCommand('git fetch --all', { ...runExternalCommand_Defaults, chdir: path }).then(function(processOutput:runExternalCommand_output){

            // Set Check if there was updates
            updateRuntime = parsePositive(updateStartTime - performance.now());
            if (processOutput.stdData.length === 0){
                console.info(`INFO - ${currentRepoData.repoName} is up to date!`);
            }

            // Check if needs to update current repo data
            if (processOutput.stdData.length !== 0 && processOutput.stdData.indexOf('fatal: ') === -1){
                currentRepoData.updateCounter++;
                currentRepoData.lastUpdatedOn = new Date().toString();
                grpp_updateRepoData(currentRepoData, path);
            }

            // Update GRPP settings
            grpp_updateSettings({ updateRuntime });

        });
    });

}

/**
    * Start GRPP update process [WIP]
*/
function startUpdateAll(){

    // Declare vars
    var completedRunners = 0,
        updateList:string[] = [];

    // Filter repos that cannot be updated
    Object.keys(grppSettings.repoEntries).forEach(function(currentRepo){

        // Get current repo data and check if can update
        const repoData:grppRepoEntry = grppSettings.repoEntries[currentRepo];
        if (repoData.canUpdate === !0){
            updateList.push(currentRepo);
        } else {
            console.warn(`WARN - Skipping ${repoData.repoName} (${currentRepo}) because it was disabled!`);
        }

    });

    // Split update list on given runners
    updateList = spliceArrayIntoChunks(updateList, grppSettings.threads);
    console.info(updateList.length);

}

// Export module
export * from './update';