/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    update.ts
*/

/*
    Import TS modules
*/

import { grppRepoEntry } from './import';
import { consoleTextStyle } from './database';
import { grpp_displayMainLogo } from './utils';
import { enableSilentMode, grpp_updateRepoData, grpp_updateSettings, grppSettings } from './main';
import { checkConnection, consoleClear, converMsToHHMMSS, convertArrayToString, createLogEntry, execReasonListCheck, isValidJSON, openOnTextEditor, parsePercentage, parsePositive, runExternalCommand, runExternalCommand_Defaults, runExternalCommand_output, spliceArrayIntoChunks, trimString } from './tools';

/*
    Require node modules
*/

import * as module_fs from 'fs';
import * as module_path from 'path';
import * as module_readLine from 'readline';

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

// Console res
interface consoleDimensions {
    x:number,
    y:number
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
    totalReposQueued = 0,

    // Console dimensions
    consoleDimensions:consoleDimensions =  { x: 0, y: 0 };

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

        // Declare vars, check if there is repos to be updated or if GRPP update process is running
        var reasonList:string[] = [];
        if (grppSettings.repoEntries.length === 0) reasonList.push('You must import any repo before starting GRPP Update process!');
        if (module_fs.existsSync(`${process.cwd()}/.temp/`) === !0) reasonList.push(`It seems that GRPP Update Process is running! Make sure to wait current update process ends before trying again.`);

        // Check if can start update process
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
                if (processOutput.stdData.length === 0){
                    createLogEntry(`INFO - ${currentRepoData.repoName} is up to date!`);
                } else {

                    // Declare vars and check if current output had any errors
                    var errorCounter = 0,
                        errorSamples = ['fatal: ', 'error: ', 'warning: '];

                    errorSamples.forEach(function(currentSample){
                        if (processOutput.stdData.indexOf(currentSample) !== -1) errorCounter++;
                    });

                    // Check if fetch process printed any data without errors (update)
                    if (errorCounter === 0){

                        // Print update data, push process output to update data and bump update counter
                        createLogEntry(`INFO - Update data:\n${processOutput.stdData}`);
                        grpp_updateResults.updateData.push(processOutput.stdData);

                        // Update current repo data
                        currentRepoData.updateCounter++;
                        currentRepoData.lastUpdatedOn = new Date().toString();
                        grpp_updateRepoData(path, currentRepoData);

                    } else {
                        grpp_updateResults.errorData.push(processOutput.stdData);
                    }

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
    startUpdateTime = structuredClone(performance.now());
    tempDir = structuredClone(`${process.cwd()}/.temp`);
    if (module_fs.existsSync(tempDir) === !0) module_fs.rmSync(tempDir, { recursive: !0 });
    module_fs.mkdirSync(tempDir);

    // Filter repos that cannot be updated
    Object.keys(grppSettings.repoEntries).forEach(function(currentRepo){

        // Get current repo data and check if can update
        const repoData:grppRepoEntry = grppSettings.repoEntries[currentRepo];
        if (repoData.canUpdate === !0){
            updateList.push(currentRepo);
            totalReposQueued++;
        } else {
            createLogEntry(`WARN - Skipping ${repoData.repoName} (${currentRepo}) because it was disabled!`);
        }

    });

    // Split update list on given runners, create GRPP batch files and set total res files / queued repos vars
    const chunkList = spliceArrayIntoChunks(updateList, grppSettings.maxReposPerList);
    chunkList.forEach(function(currentList:string[], listIndex){
        module_fs.writeFileSync(`${tempDir}/GRPP_BATCH_${listIndex}.json`, JSON.stringify({ repoList: currentList }, void 0, 4), 'utf-8');
    });
    totalResFiles = structuredClone(chunkList.length);

    // Clear console screen, create log entry and spawn processes
    consoleClear(!0);
    grpp_displayMainLogo();
    createLogEntry(`INFO - Starting GRPP Batch Update process... (Creating ${totalResFiles} processes, with at max. ${grppSettings.maxReposPerList} repos per list)`);
    for (var currentList = 0; currentList < totalResFiles; currentList++){

        // Spawn process and start watching for batch res files
        runExternalCommand(`grpp -silent -path=${originalCwd} -processBatchFile=${currentList}`, { ...runExternalCommand_Defaults }).then(function(){
            completedRunners++;
        });

    }
    if (enableSilentMode === !1) startCheckBatchResFiles();

    // Create wait interval, checking if all process exited. If so, reset chdir, process update data and clear interval
    const waitAllProcessExit = setInterval(function(){
        if (completedRunners > (totalResFiles - 1)){
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
    const checkInterval = setInterval(function(){

        // Create available file counter and check if all res files exists. If so, Clear screen, display main logo and start watching all
        var availableFiles = 0;
        for (var currentFile = 0; currentFile < totalResFiles; currentFile++){
            if (module_fs.existsSync(`${tempDir}/GRPP_BATCH_RES_${currentFile}.json`) === !0) availableFiles++;
        }
        if (availableFiles >= totalResFiles){
            grpp_displayMainLogo(!0);
            for (var currentFile = 0; currentFile < totalResFiles; currentFile++){
                resWatcherList.push(module_fs.watch(`${tempDir}/GRPP_BATCH_RES_${currentFile}.json`, { recursive: !0 }, processBatchResFiles));
            }
            clearInterval(checkInterval);
        }

    }, 20);
}

/**
    * Process batch res files
*/
function processBatchResFiles(){

    // Check if console dimensions have changed
    if (process.stdout.columns !== consoleDimensions.x || process.stdout.rows !== consoleDimensions.y){
        consoleDimensions.x = process.stdout.columns;
        consoleDimensions.y = process.stdout.rows;
        grpp_displayMainLogo(!0);
    }

    // Process all files and check if they are valid JSON files
    for (var currentFile = 0; currentFile < totalResFiles; currentFile++){

        // Get file path and check if it exists / is a valid JSON file
        const fileData = module_fs.readFileSync(`${tempDir}/GRPP_BATCH_RES_${currentFile}.json`, 'utf-8');
        if (isValidJSON(fileData) === !0){

            // Declare ASCII entry char and change it if current file is the last one
            var entryChar = '  ├',
                enableLineBreak = '';
            if (currentFile === (totalResFiles - 1)){
                entryChar = '  └';
                enableLineBreak = '\n';
            }

            // Read current res file and updated elapsed time
            const batchResData:batchUpdate_results = JSON.parse(fileData);
            module_readLine.cursorTo(process.stdout, 0, 9);
            process.stdout.write(`${consoleTextStyle.reset}──┬ Elapsed time: ${converMsToHHMMSS(parsePositive(performance.now() - startUpdateTime))}`);

            // Move to current console line correspondent to each process and update line
            module_readLine.cursorTo(process.stdout, 0, (currentFile + 10));
            process.stdout.write(`${entryChar} Process ${currentFile}: Status: ${parsePercentage(batchResData.currentRepo, batchResData.totalRepos)}% [${batchResData.currentRepo} of ${batchResData.totalRepos}] - Repos updated: ${consoleTextStyle.fgGreen}${batchResData.updateData.length}${consoleTextStyle.reset}, Errors: ${consoleTextStyle.fgRed}${batchResData.errorData.length}${consoleTextStyle.reset}${enableLineBreak}`);
        
        }

    }

}

/**
    * Process update arrays
    * @param updateList [string[]] List with errors / updates
    * @returns [string] String with updates / errors
*/
function processUpdateArrays(updateList:string[]):string {
    var res = '';
    updateList.forEach(function(currentEntry){
        res = `${res}${currentEntry}\n\n`;
    });
    return trimString(res, 2);
}

/**
    * Batch update complete
*/
async function batchUpdateComplete(){

    // Create vars
    var baseLog = '',
        time = new Date(),
        updateDetails = '',
        errorList:string[] = [],
        updateList:string[] = [],
        errorString = '...there was no errors on this run.',
        updateString = '...there was no updates on this run.',
        updateDurationMs = parsePositive(startUpdateTime - performance.now());
        
    // Create node readline interface and stop watchers
    const readLine = module_readLine.createInterface({ input: process.stdin, output: process.stdout });
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
    
    // Process error / update lists and set updateDetails var
    if (errorList.length > 0) errorString = processUpdateArrays(errorList);
    if (updateList.length > 0) updateString = processUpdateArrays(updateList);
    updateDetails = `==> Updates:\n${updateString}\n\n==> Errors:\n${errorString}`;

    // Set result page data
    baseLog = `GRPP location: ${process.cwd()}\n\n==> Results:\n
──┬ Processes: ${totalResFiles}
  ├ Update duration: ${converMsToHHMMSS(updateDurationMs)} [${updateDurationMs}ms]
  ├ Total repos queued: ${totalReposQueued} [From ${Object.keys(grppSettings.repoEntries).length} on database, ${totalReposQueued} were queued]
  ├ Repos updated on this run: ${updateList.length}
  └ Error counter: ${errorList.length}`;

    // Update GRPP Settings file data
    const tempSettings = grppSettings;
    tempSettings.runCounter++;
    tempSettings.lastRun = time.toString();
    tempSettings.updateRuntime = (tempSettings.updateRuntime + updateDurationMs);
    grpp_updateSettings(tempSettings);
    
    // Clear screen, display update results and remove temp dir
    grpp_displayMainLogo(!0);
    createLogEntry(`INFO - Process complete!\n${baseLog}\n`);

    // Check if log dir exists, if not, create it and write log data
    if (module_fs.existsSync(`${process.cwd()}/logs`) === !1) module_fs.mkdirSync(`${process.cwd()}/logs`);
    const exportLogPath = `${process.cwd()}/logs/GRPP_BATCH_${time.toString().replaceAll(':', '_').replaceAll(' ', '_').slice(0, 24)}.txt`;
    module_fs.writeFileSync(exportLogPath, `Git Repository Preservation Project [GRPP]\nCreated by TheMitoSan (@themitosan.bsky.social)\n\nLog created at ${time.toString()}\n\n${baseLog}\n\n${updateDetails}`, 'utf-8');

    // Ask if user wants to open exported log
    readLine.question(`You can see more details on gereated log file: ${exportLogPath}\nDo you want to open it? [Y/n] `, async function(answer){

        // Close readline and check if user wants to check update data
        readLine.close();
        if (answer.toLowerCase() === 'y'){
            await openOnTextEditor(grppSettings.userEditor, exportLogPath).then(process.exit);
        } else {
            process.exit();
        }

    });

}

// Export module
export * from './update';