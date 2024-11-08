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
    currentRepo:number,
    updateData:string[],
    errorCounter:number,
    updateCounter:number
}

/*
    Defaults
*/

// Batch update results
const batchUpdateResults_Defaults:Pick <batchUpdate_results, 'errorCounter' | 'errorData' | 'updateCounter' | 'updateData' | 'currentRepo'> = {
    errorData: [],
    updateData: [],
    currentRepo: 1,
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
    return new Promise<void>(function(resolve){

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
            
                // Bump current repo, measure fetch time duration and check if process output any data
                grpp_updateResults.currentRepo++;
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
                
                }

                // Check if we got any git error
                if (processOutput.stdData.indexOf('fatal: ') !== -1){
                    grpp_updateResults.errorCounter++;
                    grpp_updateResults.errorData.push(processOutput.stdData);
                    console.warn(processOutput.stdData);
                }
            
                // Update GRPP settings
                grpp_updateSettings({ updateRuntime });
                resolve();
            
            });
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
        for (const repoIndex in batchFile.repoList){

            // Process current repo and output current status
            const repoEntry = batchFile.repoList[repoIndex];
            await grpp_updateRepo(repoEntry).then(function(){
                const resFilePath = `${module_path.parse(batchFilePath).dir}/GRPP_BATCH_RES_${id}.json`;
                createLogEntry(`INFO - Saving batch result...\nPath: ${resFilePath}`);
                module_fs.writeFileSync(resFilePath, JSON.stringify(grpp_updateResults), 'utf-8');
            });

        }

        // Create log entry, save results, remove batch file and exit 
        module_fs.unlinkSync(batchFilePath);
        process.exit();

    } else {
        console.error(`ERROR - Unable to locate batch file with id ${id}!\nPath: ${batchFilePath}`);
    }

}

/**
    * Start GRPP update process [WIP]
*/
async function startUpdateAllRepos(){

    // Declare vars
    const originalCwd = structuredClone(process.cwd());
    var completedRunners = 0,
        updateList:string[] = [],
        tempDir = `${process.cwd()}/temp`;

    // Check if temp dir exists. If so, remove it and create a new one
    if (module_fs.existsSync(tempDir) === !0) module_fs.rmSync(tempDir, { recursive: !0 });
    module_fs.mkdirSync(tempDir);

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

    // Split update list on given runners and create GRPP batch files
    const chunkList = spliceArrayIntoChunks(updateList, grppSettings.maxReposPerList);
    chunkList.forEach(function(currentList:string[], listIndex){
        module_fs.writeFileSync(`${tempDir}/GRPP_BATCH_${listIndex}.json`, JSON.stringify({ repoList: currentList }), 'utf-8');
    });

    // Create log and create update processes
    createLogEntry(`INFO - Starting GRPP Batch Update Process... (Creating ${chunkList.length} processes, Max. ${grppSettings.maxReposPerList} per list)`);
    for (var currentList = 0; currentList < chunkList.length; currentList++){
        runExternalCommand(`node ${process.argv[1]} --silent --path=${originalCwd} --processBatchFile=${currentList}`, { ...runExternalCommand_Defaults }).then(function(){
            completedRunners++;
        });
    }

    // Create wait interval
    const waitAllThreadsExit = setInterval(function(){

        // Check if process completed
        if (completedRunners > (chunkList.length - 1)){
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

    }

}

/**
    * Batch update complete [WIP]
*/
function batchUpdateComplete(){
    console.info('INFO - Process complete!');
}

// Export module
export * from './update';