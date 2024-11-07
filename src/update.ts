/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    update.ts
*/

/*
    Import TS modules
*/

import { grppRepoEntry } from './import';
import { grpp_updateRepoData, grpp_updateSettings, grppSettings } from './main';
import { checkConnection, convertArrayToString, createLogEntry, execReasonListCheck, grpp_displayMainLogo, parsePositive, runExternalCommand, runExternalCommand_Defaults, runExternalCommand_output, spliceArrayIntoChunks } from './utils';

/*
    Require node modules
*/

import * as module_fs from 'fs';
import * as module_path from 'path';

/*
    Interfaces
*/

// Batch update file
interface batchUpdate_list {
    repoList:string[]
}

// Batch update results
interface batchUpdate_results {
    errorData:string[],
    updateData:string[],
    errorCounter:number,
    updateCounter:number
}

/*
    Defaults
*/

// Batch update results
const batchUpdateResults_Defaults:Pick <batchUpdate_results, 'errorCounter' | 'errorData' | 'updateCounter' | 'updateData'> = {
    errorData: [],
    updateData: [],
    errorCounter: 0,
    updateCounter: 0
}

/*
    Variables
*/

// Update results
const grpp_updateResults:batchUpdate_results = { ...batchUpdateResults_Defaults };

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
        if (grppSettings.repoEntries.length === 0) reasonList.push('You must import any repo before starting GRPP update process!');
        execReasonListCheck(reasonList, `ERROR - Unable to start update process!\nReason: ${convertArrayToString(reasonList)}`, startUpdateAllRepos);

    });

}

/**
    * Update GRPP repo
    * @param path [string] repo path
*/
export async function grpp_updateRepo(path:string){

    // Declare vars and check if repo exists on database
    var reasonList:string[] = [];
    if (grppSettings.repoEntries[path] === void 0) reasonList.push(`Unable to find the following path on database: ${path}`);

    // Check if can continue
    execReasonListCheck(reasonList, `ERROR: Unable to update repo!\nReason: ${convertArrayToString(reasonList)}\n`, async function(){

        // Declare vars
        var updateRuntime = 0,
            updateStartTime = performance.now();

        // Get current repo data and start fetching updates
        const currentRepoData:grppRepoEntry = grppSettings.repoEntries[path];
        await runExternalCommand('git fetch --all', { ...runExternalCommand_Defaults, chdir: path, enableConsoleLog: !1, removeBlankLines: !0 }).then(function(processOutput:runExternalCommand_output){

            // Measure fetch time duration and check if process output any data
            updateRuntime = parsePositive(updateStartTime - performance.now());
            if (processOutput.stdData.length === 0) createLogEntry(`INFO - ${currentRepoData.repoName} is up to date!`);

            // Check if fetch process printed any data without errors (update)
            if (processOutput.stdData.length !== 0 && processOutput.stdData.indexOf('fatal: ') === -1){

                // Print update data, push process output to update data and bump update counter
                createLogEntry(`INFO - Update data:\n${processOutput.stdData}`);
                grpp_updateResults.updateData.push(processOutput.stdData);
                grpp_updateResults.updateCounter++;

                // Update current repo data
                currentRepoData.updateCounter++;
                currentRepoData.lastUpdatedOn = new Date().toString();
                grpp_updateRepoData(path, currentRepoData);

            } else {
                grpp_updateResults.errorCounter++;
                grpp_updateResults.errorData.push(processOutput.stdData);
                console.warn(processOutput.stdData);
            }

            // Update GRPP settings
            grpp_updateSettings({ updateRuntime });

        });
    });

}

/**
    * Process batch file
    * @param id [number] batch file id
*/
export async function grpp_processBatchFile(id:number){

    // Create batch file path const and check if exists
    const batchFilePath = `${process.cwd()}/temp/GRPP_BATCH_${id}.json`;
    if (module_fs.existsSync(batchFilePath) === !0){
        
        // Read batch update file and start processing repos
        const batchFile:batchUpdate_list = JSON.parse(module_fs.readFileSync(batchFilePath, 'utf-8'));
        for (const repoEntry in batchFile.repoList){

            // Process current repo and output current status
            await grpp_updateRepo(repoEntry).then(function(){
                console.clear();
                console.info(`%GRPP%${id},${batchFile.repoList.indexOf(repoEntry)},${batchFile.repoList.length},${grpp_updateResults.updateCounter},${grpp_updateResults.errorCounter}`);
            });

        }

        // Create log entry, save results, remove batch file and exit 
        const resFilePath = `${module_path.parse(batchFilePath).dir}/GRPP_BATCH_RES_${id}.json`;
        createLogEntry(`INFO - Saving batch result...\nPath: ${resFilePath}`);
        module_fs.writeFileSync(resFilePath, JSON.stringify(grpp_updateResults), 'utf-8');
        module_fs.unlinkSync(batchFilePath);
        process.exit();

    } else {
        console.error(`ERROR - Unable to locate batch file with id ${id}!\n`);
    }

}

/**
    * Start GRPP update process [WIP]
*/
function startUpdateAllRepos(){

    // Declare vars
    var completedRunners = 0,
        updateList:string[] = [],
        tempDir = `${process.cwd()}/temp`;
        
    // Create temp dir and filter repos that cannot be updated
    if (module_fs.existsSync(tempDir) !== !0) module_fs.mkdirSync(tempDir);
    Object.keys(grppSettings.repoEntries).forEach(function(currentRepo){

        // Get current repo data and check if can update
        const repoData:grppRepoEntry = grppSettings.repoEntries[currentRepo];
        if (repoData.canUpdate === !0){
            updateList.push(currentRepo);
        } else {
            console.warn(`WARN - Skipping ${repoData.repoName} (${currentRepo}) because it was disabled!`);
        }

    });

    // Split update list on given runners and create GRPP batch files
    spliceArrayIntoChunks(updateList, grppSettings.threads).forEach(function(currentList:string[], listIndex){
        module_fs.writeFileSync(`${tempDir}/GRPP_BATCH_${listIndex}.json`, JSON.stringify({ repoList: currentList }), 'utf-8');
    });

    // Create log and create update processes [WIP]
    createLogEntry(`INFO - Starting GRPP Batch Update process...`);
    for (var currentThread = 0; currentThread < grppSettings.threads; currentThread++){
        runExternalCommand(`node ${process.argv[1]} --path=${process.cwd()} --silent --processBatchFile=${currentThread}`, {
            
            ...runExternalCommand_Defaults,
            onStdData: function(data:string){
                processBatchStdData(data);
            }

        }).then(function(){
            completedRunners++;
        });
    }

    // Create wait interval
    const waitAllThreadsExit = setInterval(function(){

        // Check if process completed
        if (completedRunners > (grppSettings.threads - 1)){
            batchUpdateComplete();
            clearInterval(waitAllThreadsExit);
        }

    }, 50);

}

/**
    * Process stdData from batch update process [WIP]
    * @param stdData [string] output from batch update process
*/
function processBatchStdData(stdData:string){

    // Check if GRPP special string was found
    if (stdData.indexOf('%GRPP%') !== -1){

        // WIP Reference for later
        const
            runnerData = stdData.split(','),
            currentId = runnerData[0],
            currentRepo = runnerData[1],
            listLength = runnerData[2],
            updateCounter = runnerData[3],
            errorCounter = runnerData[4];

        grpp_displayMainLogo();

    }

}

/**
    * Batch update complete [WIP] 
*/
function batchUpdateComplete(){
    // WIP
}

// Export module
export * from './update';