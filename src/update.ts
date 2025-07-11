/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    update.ts
*/

/*
    Import TS modules
*/

import { grppRepoEntry } from './import';
import { grpp_convertLangVar, langDatabase } from './lang';
import { grpp_displayMainLogo, grpp_getLogoString } from './utils';
import { APP_COMPILED_AT, APP_HASH, APP_VERSION, grpp_updateRepoData, grpp_updateDatabaseSettings, grppSettings, originalCwd, update_skipProcessComplete, update_onlyQueuePriorityRepos } from './main';
import { checkConnection, converMsToHHMMSS, convertArrayToString, createLogEntry, execReasonListCheck, isValidJSON, openOnTextEditor, parsePercentage, parsePositive, runExternalCommand, runExternalCommand_Defaults, runExternalCommand_output, spliceArrayIntoChunks, trimString, updateConsoleLine, consoleTextStyle, changeTextColorNumber } from './tools';

/*
    Require node modules
*/

import * as module_os from 'os';
import * as module_fs from 'fs';
import * as module_path from 'path';
import * as module_readLine from 'readline';

/*
    Interfaces
*/

// Batch update file
interface batchUpdate_list {
    list:string[],
    skippedRepos:string[]
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

    // Flag that indicates if an aborted / failed update was detected
    failedUpdateDetected = !1,

    // Console dimensions
    consoleDimensions:consoleDimensions =  { x: 0, y: 0 };

// Update results
const grpp_updateResults:batchUpdate_results = { ...batchUpdateResults_Defaults };

/*
    Functions
*/

/**
    * Check if can start batch update
*/
export async function grpp_checkBatchUpdateProcess(){

    // Check if we have some internet connection
    await checkConnection().then(function(){

        // Declare const, test if there is repos to be updated, if GRPP update process is running and check if can start update process
        const
            reasonList:string[] = [],
            startCheck = function(){
                execReasonListCheck(reasonList, langDatabase.update.errorUnableStartUpdate, grpp_startBatchUpdate);
            };

        failedUpdateDetected = !1;
        if (grppSettings.repoEntries.length === 0) reasonList.push(langDatabase.update.errorUnableStartUpdate_noRepos);
        if (module_fs.existsSync(`${process.cwd()}/.temp/`) === !0){

            // Clear screen, display update results and ask if user wants to open exported log
            grpp_displayMainLogo(!0);
            const readLine = module_readLine.createInterface({ input: process.stdin, output: process.stdout });
            readLine.question(langDatabase.update.warnFoundBrokenBatchRun, async function(answer){

                // Close readline and check if user wants to check update data
                readLine.close();
                if (answer.toLowerCase() === langDatabase.common.confirmChar){
                    failedUpdateDetected = !0;
                    grpp_createBatchUpdateReport(grpp_checkBatchUpdateProcess);
                } else {
                    reasonList.push(langDatabase.update.errorUnableStartUpdate_updateRunning);
                    startCheck();
                }

            });

        } else {
            startCheck();
        }

    });

}

/**
    * Update GRPP repo
    * @param path [string] Path to repo that will be updated
*/
export async function grpp_updateRepo(path:string){
    return new Promise<void>(function(resolve){

        // Declare reasonList const, check if repo exists on database and check if can continue
        const reasonList:string[] = [];
        if (grppSettings.repoEntries[path] === void 0) reasonList.push(grpp_convertLangVar(langDatabase.update.errorUnableUpdateRepo_repoNotFound, [path]));
        execReasonListCheck(reasonList, langDatabase.update.errorUnableUpdateRepo, async function(){

            // Get current repo data and start fetching updates
            const currentRepoData:grppRepoEntry = grppSettings.repoEntries[path];
            await runExternalCommand('git fetch --all', { ...runExternalCommand_Defaults, chdir: `${process.cwd()}/repos/${path}`, enableConsoleLog: !1, removeBlankLines: !0 }).then(function(processOutput:runExternalCommand_output){

                // Bump current repo, measure fetch time duration and check if process output any data
                grpp_updateResults.currentRepo++;
                if (processOutput.stdData.length === 0){
                    createLogEntry(grpp_convertLangVar(langDatabase.update.repoUpToDate, [currentRepoData.name]));
                } else {

                    // Declare vars and check if current output had any errors
                    var errorCounter = 0;
                    [
                        'fatal: ',
                        'error: ',
                        'warning: '
                    ].forEach(function(currentSample){
                        if (processOutput.stdData.indexOf(currentSample) !== -1){

                            // Check for false-positive errors
                            [
                                `\'--no-show-forced-updates\' or run \'git config fetch.showForcedUpdates false\'`
                            ].forEach(function(falsePositive){
                                if (currentSample.indexOf(falsePositive) === -1) errorCounter++;
                            })

                        }
                    });

                    // Check if fetch process printed any data without errors (update)
                    if (errorCounter === 0){

                        // Print update data, push process output to update data and bump update counter
                        createLogEntry(grpp_convertLangVar(langDatabase.update.repoUpdateData, [processOutput.stdData]));
                        grpp_updateResults.updateList.push(processOutput.stdData);

                        // Update current repo data
                        currentRepoData.lastUpdatedOn = new Date().toString();
                        grpp_updateRepoData(path, currentRepoData);

                    } else {
                        grpp_updateResults.errorList.push(`${currentRepoData.url}\n${processOutput.stdData}`);
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

    // Create batch file path and check if batch file exists
    const batchFilePath = `${originalCwd}/.temp/GRPP_BATCH.json`;
    if (module_fs.existsSync(batchFilePath) === !0){

        // Read batch update file, set total repos var on update results and start processing repos
        const batchFile:batchUpdate_list | any = JSON.parse(module_fs.readFileSync(batchFilePath, 'utf-8'));
        grpp_updateResults.totalRepos = batchFile.list[id].length;
        for (const repoIndex in batchFile.list[id]){

            // Process current repo and output current status
            await grpp_updateRepo(batchFile.list[id][repoIndex]).then(function(){

                // Reset chdir and create / update current process result
                process.chdir(originalCwd);
                module_fs.writeFileSync(`${module_path.parse(batchFilePath).dir}/GRPP_BATCH_RES_${id}.json`, JSON.stringify(grpp_updateResults), 'utf-8');

            });

        }
        process.exit();

    } else {
        createLogEntry(grpp_convertLangVar(langDatabase.update.errorBatchFileNotFound, [batchFilePath]), 'error');
    }

}

/**
    * Sort repos to be updated
    * @param repoList [string[]] List to be sorted
    * @returns [string[]] New list with sorted items
*/
async function grpp_sortBatchList(repoList:string[]):Promise<string[]> {
    return new Promise<string[]>(function(resolve){

        var updateList:string[] = [],
            priorityRepos:string[] = [];

        repoList.forEach(function(currentRepo){

            // Get current repo data and check if can update
            const repoData:grppRepoEntry = grppSettings.repoEntries[currentRepo];
            if (repoData.canUpdate === !0){

                if (repoData.isPriority === !0){
                    priorityRepos.push(currentRepo);
                } else {
                    updateList.push(currentRepo);
                }

            } else {
                skippedRepos.push(currentRepo);
            }

        });

        // Put priority repos first if priority list isn't empty and return sorted list
        if (priorityRepos.length !== 0){

            // Create update list and check if only priority repos should be updated
            updateList = [ ...priorityRepos, ...updateList ];
            if (update_onlyQueuePriorityRepos === !0){
                updateList = priorityRepos;
            }

        }
        totalReposQueued = updateList.length;
        resolve(updateList);

    });
}

/**
    * Start GRPP update process
*/
async function grpp_startBatchUpdate(){

    // Set current time to measure update time, set tempDir var and check if it exists. If so, remove it and create a new one
    var completedRunners = 0;
    tempDir = structuredClone(`${process.cwd()}/.temp`);
    startUpdateTime = structuredClone(performance.now());
    if (module_fs.existsSync(tempDir) === !0) module_fs.rmSync(tempDir, { recursive: !0 });
    module_fs.mkdirSync(tempDir);

    // Split update list on given runners, create GRPP batch file and set total res files / queued repos vars
    createLogEntry(`INFO - Creating update list...`);
    const
        updateList = await grpp_sortBatchList(Object.keys(grppSettings.repoEntries)),
        chunkList = spliceArrayIntoChunks(updateList, grppSettings.maxReposPerList);
    module_fs.writeFileSync(`${tempDir}/GRPP_BATCH.json`, JSON.stringify({ list: chunkList, skippedRepos }), 'utf-8');
    totalResFiles = structuredClone(chunkList.length);

    // Clear console screen, create log entry and spawn processes
    grpp_displayMainLogo(!1);
    createLogEntry(grpp_convertLangVar(langDatabase.update.startBatchUpdate, [totalResFiles, grppSettings.maxReposPerList]));
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
                grpp_createBatchUpdateReport(process.exit);
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
    updateConsoleLine(0, 9, `${consoleTextStyle.reset}${langDatabase.update.batchStatus}\n`);
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
                updateConsoleLine(0, 11, `──┬ ${grpp_convertLangVar(langDatabase.update.batch_overallProgress, [parsePercentage(reposProcessed, totalReposQueued), reposProcessed, totalReposQueued])}`);
                updateConsoleLine(0, 13, `  ├ ${grpp_convertLangVar(langDatabase.update.batch_updateCounter, [changeTextColorNumber(updateCounter, consoleTextStyle.fgGreen)])}`);
                updateConsoleLine(0, 14, `  └ ${grpp_convertLangVar(langDatabase.update.batch_errorCounter, [changeTextColorNumber(errorCounter, consoleTextStyle.fgRed)])}\n\n${langDatabase.update.batchProcessList}\n\n`);
            }

            // Update entryChar if there is only one process and update elapsed time line
            if (totalResFiles === 1) entryChar = '-->';
            updateConsoleLine(0, 12, `  ├ ${grpp_convertLangVar(langDatabase.update.batch_elapsedTime, [converMsToHHMMSS(parsePositive(performance.now() - startUpdateTime))])}`);

            // Check if process finished - if so, update checkbox char and update each process line
            if (batchResData.currentRepo > (batchResData.totalRepos - 1)) checkboxChar = `[${consoleTextStyle.fgGreen}✓${consoleTextStyle.reset}]`;
            updateConsoleLine(0, (currentFile + 18), grpp_convertLangVar(langDatabase.update.batchProcess, [
                entryChar,
                checkboxChar,
                currentFile,
                parsePercentage(batchResData.currentRepo, batchResData.totalRepos),
                batchResData.currentRepo,
                batchResData.totalRepos,
                changeTextColorNumber(batchResData.updateList.length, consoleTextStyle.fgGreen),
                changeTextColorNumber(batchResData.errorList.length, consoleTextStyle.fgRed),
                enableLineBreak
            ]));

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
    * Create batch update report
    * @param postAction [Function] function to be executed after generating update report
*/
async function grpp_createBatchUpdateReport(postAction:Function){

    // Create vars
    var baseLog = '',
        updateDetails = '',
        brokenUpdateString = '',
        errorList:string[] = [],
        updateList:string[] = [],
        errorString = langDatabase.update.noErrorsRun,
        updateString = langDatabase.update.noUpdatesRun,
        skippedReposString = langDatabase.update.noSkippedReposRun;

    // Create consts
    const
        time = new Date(),
        tempSettings = grppSettings,
        tempPath = `${process.cwd()}/.temp`,
        updateDurationMs = parsePositive(startUpdateTime - performance.now()),
        readLine = module_readLine.createInterface({ input: process.stdin, output: process.stdout }),
        fileName = `GRPP_BATCH_${time.toString().replaceAll(':', '_').replaceAll(' ', '_').slice(0, 24)}`,
        exportTxtPath = `${process.cwd()}/logs/txt/${fileName}.txt`,
        exportJsonPath = `${process.cwd()}/logs/json/${fileName}.json`;

    // Stop res file watchers
    resWatcherList.forEach(function(currentWatcher){
        currentWatcher.close();
    });

    // Check if batch file exists
    if (module_fs.existsSync(`${tempPath}/GRPP_BATCH.json`) === !0){

        // Process batch res files and remove .temp dir
        for (var currentResFile = 0; currentResFile < totalResFiles; currentResFile++){

            // Get file path and check if file exists
            const filePath = `${tempPath}/GRPP_BATCH_RES_${currentResFile}.json`;
            if (module_fs.existsSync(filePath) === !0){

                // Get file data and get errors / updates
                const updateData:batchUpdate_results = JSON.parse(module_fs.readFileSync(filePath, 'utf-8'));
                errorList = [...errorList, ...updateData.errorList];
                updateList = [...updateList, ...updateData.updateList];

            } else {
                brokenUpdateString = langDatabase.update.missingResFile;
            }

        }
        module_fs.rmSync(`${process.cwd()}/.temp`, { recursive: !0 });

        // Process errors, update and skipped repos lists
        if (errorList.length > 0) errorString = processUpdateArrays(errorList);
        if (updateList.length > 0) updateString = processUpdateArrays(updateList);
        if (skippedRepos.length > 0) skippedReposString = convertArrayToString(skippedRepos);

        // Set string vars
        updateDetails = grpp_convertLangVar(langDatabase.update.resultDetails, [updateString, errorString]);
        baseLog = grpp_convertLangVar(langDatabase.update.resultPage, [
            process.cwd(),
            module_os.userInfo().username,
            totalResFiles,
            converMsToHHMMSS(updateDurationMs),
            updateDurationMs,
            totalReposQueued,
            Object.keys(grppSettings.repoEntries).length,
            skippedRepos.length,
            updateList.length,
            errorList.length
        ]);

        // Update GRPP Settings file data
        tempSettings.runCounter++;
        tempSettings.lastRun = time.toString();
        tempSettings.updateRuntime = (tempSettings.updateRuntime + updateDurationMs);
        grpp_updateDatabaseSettings(tempSettings);

        // Check if log dir exists, if not, create them and write log / json files
        [
            'logs',
            'logs/txt',
            'logs/json'
        ].forEach(function(currentPath){
            if (module_fs.existsSync(`${process.cwd()}/${currentPath}`) === !1) module_fs.mkdirSync(`${process.cwd()}/${currentPath}`);
        });
        module_fs.writeFileSync(exportJsonPath, JSON.stringify({
            errorList,
            updateList,
            totalResFiles,
            totalReposQueued,
            updateDurationMs,
            skippedRepos,
            totalReposPreserved: Object.keys(grppSettings.repoEntries).length,
        }), 'utf-8');
        module_fs.writeFileSync(exportTxtPath, trimString(grpp_convertLangVar(langDatabase.update.logTemplate, [
            grpp_getLogoString(!0),
            APP_VERSION,
            APP_HASH,
            APP_COMPILED_AT,
            new Date().toString(),
            process.argv.toString().replaceAll(',', ' '),
            baseLog,
            updateDetails
        ]) + brokenUpdateString), 'utf-8');

        // Checks if needs to show post-update message
        if (update_skipProcessComplete === !1 && failedUpdateDetected === !1){

            // Clear screen, display update results and ask if user wants to open exported log
            grpp_displayMainLogo(!0);
            readLine.question(grpp_convertLangVar(langDatabase.update.infoProcessComplete, [baseLog, exportTxtPath]), async function(answer){

                // Close readline and check if user wants to check update data
                readLine.close();
                if (answer.toLowerCase() === langDatabase.common.confirmChar){
                    await openOnTextEditor(exportTxtPath).then(process.exit);
                } else {
                    postAction();
                }

            });

        } else {
            grpp_displayMainLogo(!0);
            createLogEntry(langDatabase.common.processComplete);
            postAction();
        }

    } else {
        createLogEntry(langDatabase.update.unableFindBatchFile);
        postAction();
    }

}

// Export module
export * from './update';