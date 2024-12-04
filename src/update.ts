/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    update.ts
*/

/*
    Import TS modules
*/

import { grppRepoEntry } from './import';
import { consoleTextStyle } from './utils';
import { grpp_displayMainLogo } from './utils';
import { grpp_updateRepoData, grpp_updateSettings, grppSettings } from './main';
import { checkConnection, converMsToHHMMSS, convertArrayToString, createLogEntry, execReasonListCheck, isValidJSON, openOnTextEditor, parsePercentage, parsePositive, runExternalCommand, runExternalCommand_Defaults, runExternalCommand_output, spliceArrayIntoChunks, trimString, updateConsoleLine } from './tools';

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
    batchList:string[]
}

// Batch update results
interface batchUpdate_results {
    totalRepos:number,
    errorList:string[],
    currentRepo:number,
    updateList:string[]
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
const batchUpdateResults_Defaults:Pick <batchUpdate_results, 'errorList' | 'updateList' | 'currentRepo' | 'totalRepos'> = {
    totalRepos: 1,
    currentRepo: 0,
    errorList: [],
    updateList: []
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

    // Skipped repos
    skippedRepos:string[] = [],

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

        // Declare vars, test if there is repos to be updated, if GRPP update process is running and check if can start update process
        const reasonList:string[] = [];
        if (grppSettings.repoEntries.length === 0) reasonList.push('You must import any repo before starting GRPP Update process!');
        if (module_fs.existsSync(`${process.cwd()}/.temp/`) === !0) reasonList.push(`It seems that GRPP Update Process is running! Make sure to wait current update process ends before trying again.`);
        execReasonListCheck(reasonList, `ERROR - Unable to start update process!\nReason: ${convertArrayToString(reasonList)}`, grpp_startBatchUpdate);

    });

}

/**
    * Update GRPP repo
    * @param path [string] repo path
*/
export async function grpp_updateRepo(path:string){
    return new Promise<void>(function(resolve){

        // Declare reasonList const, check if repo exists on database and check if can continue
        const reasonList:string[] = [];
        if (grppSettings.repoEntries[path] === void 0) reasonList.push(`Unable to find the following path on database: ${path}`);
        execReasonListCheck(reasonList, `ERROR: Unable to update repo!\nReason: ${convertArrayToString(reasonList)}\n`, async function(){

            // Get current repo data and start fetching updates
            const currentRepoData:grppRepoEntry = grppSettings.repoEntries[path];
            await runExternalCommand('git fetch --all', { ...runExternalCommand_Defaults, chdir: `${process.cwd()}/repos/${path}`, enableConsoleLog: !1, removeBlankLines: !0 }).then(function(processOutput:runExternalCommand_output){

                // Bump current repo, measure fetch time duration and check if process output any data
                grpp_updateResults.currentRepo++;
                if (processOutput.stdData.length === 0){
                    createLogEntry(`INFO - ${currentRepoData.name} is up to date!`);
                } else {

                    // Declare vars and check if current output had any errors
                    var errorCounter = 0;
                    [
                        'fatal: ',
                        'error: ',
                        'warning: '
                    ].forEach(function(currentSample){
                        if (processOutput.stdData.indexOf(currentSample) !== -1) errorCounter++;
                    });

                    // Check if fetch process printed any data without errors (update)
                    if (errorCounter === 0){

                        // Print update data, push process output to update data and bump update counter
                        createLogEntry(`INFO - Update data:\n${processOutput.stdData}`);
                        grpp_updateResults.updateList.push(processOutput.stdData);

                        // Update current repo data
                        currentRepoData.updateCounter++;
                        currentRepoData.lastUpdatedOn = new Date().toString();
                        grpp_updateRepoData(path, currentRepoData);

                    } else {
                        grpp_updateResults.errorList.push(processOutput.stdData);
                    }

                }
                resolve();
            
            });

        });

    });
}

/**
    * Process batch file
    * @param id [number] batch list id
*/
export async function grpp_processBatchFile(id:number){

    // Create consts
    const
        originalCwd = structuredClone(process.cwd()),
        batchFilePath = `${originalCwd}/.temp/GRPP_BATCH.json`;

    // Check if batch file exists
    if (module_fs.existsSync(batchFilePath) === !0){

        // Read batch update file, set total repos var on update results and start processing repos
        const batchFile:batchUpdate_list | any = JSON.parse(module_fs.readFileSync(batchFilePath, 'utf-8'));
        grpp_updateResults.totalRepos = batchFile.batchList[id].length;
        for (const repoIndex in batchFile.batchList[id]){

            // Process current repo and output current status
            const repoEntry = batchFile.batchList[id][repoIndex];
            await grpp_updateRepo(repoEntry).then(function(){

                // Reset chdir and create / update current process result
                process.chdir(originalCwd);
                module_fs.writeFileSync(`${module_path.parse(batchFilePath).dir}/GRPP_BATCH_RES_${id}.json`, JSON.stringify(grpp_updateResults), 'utf-8');

            });

        }
        process.exit();

    } else {
        createLogEntry(`ERROR - Unable to locate batch file with id ${id}!\nPath: ${batchFilePath}`, 'error');
    }

}

/**
    * Start GRPP update process
*/
async function grpp_startBatchUpdate(){

    // Declare vars
    const originalCwd = structuredClone(process.cwd());
    var completedRunners = 0,
        updateList:string[] = [],
        priorityRepos:string[] = [];

    // Set current time to measure update time, set tempDir var and check if it exists. If so, remove it and create a new one
    tempDir = structuredClone(`${process.cwd()}/.temp`);
    startUpdateTime = structuredClone(performance.now());
    if (module_fs.existsSync(tempDir) === !0) module_fs.rmSync(tempDir, { recursive: !0 });
    module_fs.mkdirSync(tempDir);

    // Filter repos that cannot be updated
    createLogEntry(`INFO - Creating update list...`);
    Object.keys(grppSettings.repoEntries).forEach(function(currentRepo){

        // Get current repo data and check if can update
        const repoData:grppRepoEntry = grppSettings.repoEntries[currentRepo];
        if (repoData.canUpdate === !0){

            if (repoData.isPriority === !0){
                priorityRepos.push(currentRepo);
            } else {
                updateList.push(currentRepo);
            }
            totalReposQueued++;

        } else {
            skippedRepos.push(currentRepo);
        }

    });

    // Put priority repos first if priority list isn't empty
    if (priorityRepos.length !== 0) updateList = [ ...priorityRepos, ...updateList ];

    // Split update list on given runners, create GRPP batch files and set total res files / queued repos vars
    const chunkList = spliceArrayIntoChunks(updateList, grppSettings.maxReposPerList);
    module_fs.writeFileSync(`${tempDir}/GRPP_BATCH.json`, JSON.stringify({ batchList: chunkList }), 'utf-8');
    totalResFiles = structuredClone(chunkList.length);

    // Clear console screen, create log entry and spawn processes
    grpp_displayMainLogo(!1);
    createLogEntry(`INFO - Starting GRPP Batch Update process... (Creating ${totalResFiles} processes, with at max. ${grppSettings.maxReposPerList} repos per list)`);
    for (var currentList = 0; currentList < totalResFiles; currentList++){

        // Spawn process and start watching for batch res files
        runExternalCommand(`grpp --silent --path=${originalCwd} --processBatchFile=${currentList}`, { ...runExternalCommand_Defaults }).then(function(){
            completedRunners++;
        });

    }
    startCheckBatchResFiles();

    // Create wait interval, checking if all process exited - if so, reset chdir, process update data and clear interval
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

    // Declare counter vars
    var errorCounter = 0,
        updateCounter = 0,
        reposProcessed = 0;

    // Reset console color, print status and start processing all files
    updateConsoleLine(0, 9, `${consoleTextStyle.reset}==> Status:\n`);
    for (var currentFile = 0; currentFile < totalResFiles; currentFile++){

        // Get file data and check if is a valid JSON
        const fileData = module_fs.readFileSync(`${tempDir}/GRPP_BATCH_RES_${currentFile}.json`, 'utf-8');
        if (isValidJSON(fileData) === !0){

            // Declare vars
            var entryChar = '  ├',
                checkboxChar = '[ ]',
                enableLineBreak = '';

            // Change entry char if current file is the first one, declare batchResData and update counters
            if (currentFile === 0) entryChar = '──┬';
            const batchResData:batchUpdate_results = JSON.parse(fileData);
            reposProcessed = (reposProcessed + batchResData.currentRepo);
            errorCounter = (errorCounter + batchResData.errorList.length);
            updateCounter = (updateCounter + batchResData.updateList.length);

            // Update vars / overall process if is the last file
            if (currentFile === (totalResFiles - 1)){
                entryChar = '  └';
                enableLineBreak = '\n';
                updateConsoleLine(0, 11, `──┬ Overall Progress: ${parsePercentage(reposProcessed, totalReposQueued)}% [${reposProcessed} of ${totalReposQueued}]`);
                updateConsoleLine(0, 13, `  ├ Update counter: ${consoleTextStyle.fgGreen}${updateCounter}${consoleTextStyle.reset}
  └ Error counter: ${consoleTextStyle.fgRed}${errorCounter}${consoleTextStyle.reset}\n\n==> Process list:\n\n`);
            }

            // Update entryChar if there is only one process and update elapsed time line
            if (totalResFiles === 1) entryChar = '───';
            updateConsoleLine(0, 12, `  ├ Elapsed time: ${converMsToHHMMSS(parsePositive(performance.now() - startUpdateTime))}`);

            // Check if process finished. If so, update checkbox char and update each process line
            if (batchResData.currentRepo > (batchResData.totalRepos - 1)) checkboxChar = '[✓]';
            updateConsoleLine(0, (currentFile + 18), `${entryChar} ${checkboxChar} Process ${currentFile}: Status: ${parsePercentage(batchResData.currentRepo, batchResData.totalRepos)}% [${batchResData.currentRepo} of ${batchResData.totalRepos}] - Repos updated: ${consoleTextStyle.fgGreen}${batchResData.updateList.length}${consoleTextStyle.reset}, Errors: ${consoleTextStyle.fgRed}${batchResData.errorList.length}${consoleTextStyle.reset}${enableLineBreak}`);

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
        updateDetails = '',
        errorList:string[] = [],
        updateList:string[] = [],
        errorString = '...there was no errors on this run.',
        updateString = '...there was no updates on this run.',
        skippedReposString = '...there was no skipped repos on this run.';

    // Create consts
    const
        time = new Date(),
        tempSettings = grppSettings,
        updateDurationMs = parsePositive(startUpdateTime - performance.now()),
        readLine = module_readLine.createInterface({ input: process.stdin, output: process.stdout }),
        exportLogPath = `${process.cwd()}/logs/GRPP_BATCH_${time.toString().replaceAll(':', '_').replaceAll(' ', '_').slice(0, 24)}.txt`;

    // Stop res file watchers
    resWatcherList.forEach(function(currentWatcher){
        currentWatcher.close();
    });

    // Process batch res files and remove .temp dir
    for (var currentResFile = 0; currentResFile < totalResFiles; currentResFile++){

        // Get file data and get errors / updates
        const
            filePath = `${process.cwd()}/.temp/GRPP_BATCH_RES_${currentResFile}.json`,
            updateData:batchUpdate_results = JSON.parse(module_fs.readFileSync(filePath, 'utf-8'));

        errorList = [ ...errorList, ...updateData.errorList ];
        updateList = [ ...updateList, ...updateData.updateList ];

    }
    module_fs.rmSync(`${process.cwd()}/.temp`, { recursive: !0 });

    // Process errors, update and skipped repos lists
    if (errorList.length > 0) errorString = processUpdateArrays(errorList);
    if (updateList.length > 0) updateString = processUpdateArrays(updateList);
    if (skippedRepos.length > 0) skippedReposString = convertArrayToString(skippedRepos);

    // Set string vars
    updateDetails = `==> Updates:\n${updateString}\n\n==> Errors:\n${errorString}\n\n==> Skipped Repos:\n${skippedReposString}\n`;
    baseLog = `GRPP location: ${process.cwd()}

==> Results:

──┬ Processes: ${totalResFiles}
  ├ Update duration: ${converMsToHHMMSS(updateDurationMs)} [${updateDurationMs}ms]
  ├ Total repos queued: ${totalReposQueued} [From ${Object.keys(grppSettings.repoEntries).length} on database, ${skippedRepos.length} were skipped]
  ├ Repos updated on this run: ${updateList.length}
  └ Error counter: ${errorList.length}`;

    // Update GRPP Settings file data
    tempSettings.runCounter++;
    tempSettings.lastRun = time.toString();
    tempSettings.updateRuntime = (tempSettings.updateRuntime + updateDurationMs);
    grpp_updateSettings(tempSettings);

    // Check if log dir exists, if not, create it and write log data
    if (module_fs.existsSync(`${process.cwd()}/logs`) === !1) module_fs.mkdirSync(`${process.cwd()}/logs`);
    module_fs.writeFileSync(exportLogPath, `Git Repository Preservation Project [GRPP]\nCreated by TheMitoSan (@themitosan.bsky.social)\n\nLog created at ${time.toString()}\n\n${baseLog}\n\n${updateDetails}`, 'utf-8');

    // Clear screen, display update results and ask if user wants to open exported log
    grpp_displayMainLogo(!0);
    readLine.question(`INFO - Process complete!\n${baseLog}\n\nYou can see more details on gereated log file: ${exportLogPath}\n\nDo you want to open it? [Y/n] `, async function(answer){

        // Close readline and check if user wants to check update data
        readLine.close();
        if (answer.toLowerCase() === 'y'){
            await openOnTextEditor(exportLogPath).then(process.exit);
        } else {
            process.exit();
        }

    });

}

// Export module
export * from './update';