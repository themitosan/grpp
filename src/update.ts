/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    update.ts
*/

/*
    Import TS modules
*/

import { grppRepoEntry } from './import';
import { grpp_displayMainLogo } from './utils';
import { grpp_updateRepoData, grpp_updateSettings, grppSettings } from './main';
import { checkConnection, converMsToHHMMSS, convertArrayToString, createLogEntry, execReasonListCheck, isValidJSON, parsePercentage, parsePositive, runExternalCommand, runExternalCommand_Defaults, runExternalCommand_output, spliceArrayIntoChunks } from './tools';

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
    totalRepos:number,
    errorData:string[],
    currentRepo:number,
    updateData:string[]
}

/*
    Defaults
*/

// Batch update results
const batchUpdateResults_Defaults:Pick <batchUpdate_results, 'errorData' | 'updateData' | 'currentRepo' | 'totalRepos'> = {
    totalRepos: 1,
    currentRepo: 0,
    errorData: [],
    updateData: []
}

/*
    Variables
*/

var

    // Batch res watcher list
    resWatcherList:module_fs.FSWatcher[] = [],

    // Temp dir used to write batch / res files
    tempDir = '',

    // Number of available processes / batch res files
    totalResFiles = 0,

    // Start batch update time
    startUpdateTime = 0,

    // Total repos queued to update
    totalReposQueued = 0;

// Update results
const grpp_updateResults:batchUpdate_results = { ...batchUpdateResults_Defaults };

/*
    Functions
*/

/**
    * Check if can start update
*/
export async function grpp_checkBatchUpdateProcess(){

    // Check if we have some internet connection
    await checkConnection().then(function(){

        // Declare vars, check if there is repos to be updated and check if can continue
        var reasonList:string[] = [];
        if (grppSettings.repoEntries.length === 0) reasonList.push('You must import any repo before starting GRPP Update process!');
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
        
            // Get current repo data and start fetching updates
            const currentRepoData:grppRepoEntry = grppSettings.repoEntries[path];
            await runExternalCommand('git fetch --all', { ...runExternalCommand_Defaults, chdir: path, enableConsoleLog: !1, removeBlankLines: !0 }).then(function(processOutput:runExternalCommand_output){
            
                // Bump current repo, measure fetch time duration and check if process output any data
                grpp_updateResults.currentRepo++;
                if (processOutput.stdData.length === 0) createLogEntry(`INFO - ${currentRepoData.repoName} is up to date!`);
            
                // Check if fetch process printed any data without errors (update)
                if (processOutput.stdData.length !== 0 && processOutput.stdData.indexOf('fatal: ') === -1){
                
                    // Print update data, push process output to update data and bump update counter
                    createLogEntry(`INFO - Update data:\n${processOutput.stdData}`);
                    grpp_updateResults.updateData.push(processOutput.stdData);
                
                    // Update current repo data
                    currentRepoData.updateCounter++;
                    currentRepoData.lastUpdatedOn = new Date().toString();
                    grpp_updateRepoData(path, currentRepoData);
                
                }

                // Check if we got any git error and resolve
                if (processOutput.stdData.indexOf('fatal: ') !== -1){
                    grpp_updateResults.errorData.push(processOutput.stdData);
                    console.warn(processOutput.stdData);
                }
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
    const batchFilePath = `${process.cwd()}/.temp/GRPP_BATCH_${id}.json`;
    if (module_fs.existsSync(batchFilePath) === !0){
        
        // Read batch update file, set total repos var on update results and start processing repos
        const batchFile:batchUpdate_list = JSON.parse(module_fs.readFileSync(batchFilePath, 'utf-8'));
        grpp_updateResults.totalRepos = batchFile.repoList.length;
        for (const repoIndex in batchFile.repoList){

            // Process current repo and output current status
            const repoEntry = batchFile.repoList[repoIndex];
            await grpp_updateRepo(repoEntry).then(function(){

                // Create / update current process result
                const resFilePath = `${module_path.parse(batchFilePath).dir}/GRPP_BATCH_RES_${id}.json`;
                module_fs.writeFileSync(resFilePath, JSON.stringify(grpp_updateResults, void 0, 4), 'utf-8');

            });

        }

        // Create log entry, save results, remove batch file and exit 
        process.exit();

    } else {
        console.error(`ERROR - Unable to locate batch file with id ${id}!\nPath: ${batchFilePath}`);
    }

}

/**
    * Start GRPP update process
*/
async function startUpdateAllRepos(){

    // Declare vars
    const originalCwd = structuredClone(process.cwd());
    var completedRunners = 0,
        updateList:string[] = [];

    // Set current time to measure update time, set tempDir var and check if it exists. If so, remove it and create a new one
    startUpdateTime = performance.now();
    tempDir = structuredClone(`${process.cwd()}/.temp`);
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
        module_fs.writeFileSync(`${tempDir}/GRPP_BATCH_${listIndex}.json`, JSON.stringify({ repoList: currentList }, void 0, 4), 'utf-8');
    });
    
    // Set total res files and repos queued vars and start update process
    totalResFiles = structuredClone(chunkList.length);
    totalReposQueued = structuredClone(updateList.length);
    createLogEntry(`INFO - Starting GRPP Batch Update process... (Creating ${chunkList.length} processes, with at max. ${grppSettings.maxReposPerList} repos per list)`);
    for (var currentList = 0; currentList < chunkList.length; currentList++){

        // Spawn process and start watching for batch res files
        runExternalCommand(`node ${process.argv[1]} --silent --path=${originalCwd} --processBatchFile=${currentList}`, { ...runExternalCommand_Defaults }).then(function(){
            completedRunners++;
        });

    }
    setTimeout(startCheckBatchResFiles, 2000);

    // Create wait interval, checking if all process exited. If so, reset chdir, process update data and clear interval
    const waitAllProcessExit = setInterval(function(){

        if (completedRunners > (chunkList.length - 1)){
            setTimeout(function(){
                process.chdir(originalCwd);
                batchUpdateComplete();
                clearInterval(waitAllProcessExit);
            });
        }
    }, 50);

}

/**
    * Start watching batch res files
*/
function startCheckBatchResFiles(){
    for (var currentFile = 0; currentFile < totalResFiles; currentFile++){
        resWatcherList.push(module_fs.watch(`${tempDir}/GRPP_BATCH_RES_${currentFile}.json`, { recursive: !0 }, updateBatchResStatus));
    }
}

/**
    * Render ongoing process on screen
*/
function updateBatchResStatus(){

    // Create temp string var and start processing all result files
    var tempString = '';
    for (var currentFile = 0; currentFile < totalResFiles; currentFile++){

        // Get file path and check if it exists / is a valid JSON file
        const filePath = `${tempDir}/GRPP_BATCH_RES_${currentFile}.json`;
        if (module_fs.existsSync(filePath) === !0 && isValidJSON(module_fs.readFileSync(filePath, 'utf-8')) === !0){
            const batchResData:batchUpdate_results = JSON.parse(module_fs.readFileSync(filePath, 'utf-8'));
            tempString = `${tempString}==> Process: ${currentFile}\nRes file: ${filePath}\nProgress: ${parsePercentage(batchResData.currentRepo, batchResData.totalRepos)}% [${batchResData.currentRepo} of ${batchResData.totalRepos}]\nRepos updated: ${batchResData.updateData.length}\nErrors: ${batchResData.errorData.length}\n\n`;

        }

    }

    // Clear screen, display main logo and log data
    grpp_displayMainLogo();
    createLogEntry(tempString);

}

/**
    * Process update arrays
    * @param updateList [string[]] List with errors / updates
    * @returns [string] String with updates / errors
*/
function processUpdateArrays(updateList:string[]):string {

    // Create res var and process update list
    var res = '';
    updateList.forEach(function(currentEntry){
        res = `${res}${currentEntry}\n\n`;
    });

    // Return res
    return res.slice(0, (res.length - 2));

}

/**
    * Batch update complete
*/
function batchUpdateComplete(){

    // Create vars
    var finalString = '',
        time = new Date(),
        errorList:string[] = [],
        updateList:string[] = [],
        errorString = '...there was no errors on this run.',
        updateString = '...there was no updates on this run.',
        updateDurationMs = parsePositive(startUpdateTime - performance.now());

    // Stop watchers
    resWatcherList.forEach(function(currentWatcher){
        currentWatcher.close();
    });

    // Process batch res files and remove .temp dir
    for (var currentResFile = 0; currentResFile < totalResFiles; currentResFile++){

        // Get file data and get errors / updates
        const
            filePath = `${process.cwd()}/.temp/GRPP_BATCH_RES_${currentResFile}.json`,
            resFileData:batchUpdate_results = JSON.parse(module_fs.readFileSync(filePath, 'utf-8'));

        errorList = [...errorList, ...resFileData.errorData];
        updateList = [...updateList, ...resFileData.updateData];

    }
    module_fs.rmSync(`${process.cwd()}/.temp`, { recursive: !0 });
    
    // Process update lists and create final string
    if (errorList.length > 0) errorString = processUpdateArrays(errorList);
    if (updateList.length > 0) updateString = processUpdateArrays(updateList);
    finalString = `Current path: ${process.cwd()}\n\n==> General info:\nParallel Threads: ${totalResFiles}\nUpdate duration: ${converMsToHHMMSS(updateDurationMs)} [${updateDurationMs}ms]\nTotal repos queued: ${totalReposQueued} [From ${Object.keys(grppSettings.repoEntries).length} listed, ${totalReposQueued} were queued]\n\n==> Update data:\n${updateString}\n\n==> Error data:\n${errorString}`;

    // Update GRPP Settings file data
    const tempSettings = grppSettings;
    tempSettings.runCounter++;
    tempSettings.lastRun = time.toString();
    tempSettings.updateRuntime = (tempSettings.updateRuntime + updateDurationMs);
    grpp_updateSettings(tempSettings);
    
    // Clear screen, display update results and remove temp dir
    grpp_displayMainLogo();
    createLogEntry(`INFO - Process complete!\n${finalString}\n`);

    // Check if log dir exists, if not, create it and write log data
    if (module_fs.existsSync(`${process.cwd()}/logs`) === !1) module_fs.mkdirSync(`${process.cwd()}/logs`);
    const exportLogPath = `${process.cwd()}/logs/GRPP_BATCH_${time.toString().replaceAll(':', '_').replaceAll(' ', '_').slice(0, 24)}.txt`;
    module_fs.writeFileSync(exportLogPath, `Git Repository Preservation Project [GRPP]\nCreated by Juliana (@julianaheartz.bsky.social)\n\nLog created at ${time.toString()}\n\n${finalString}`, 'utf-8');
    createLogEntry(`INFO - Exporting log data...\nPath: ${exportLogPath}\n`);

}

// Export module
export * from './update';