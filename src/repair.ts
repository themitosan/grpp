/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    repair.ts
*/

/*
    Import TS modules
*/

import { grpp_convertLangVar, langDatabase } from './lang';
import { grppRepoEntry, repoEntry_Defaults } from './import';
import { grpp_removeRepo, grpp_updateRepoData, grppSettings, repair_removeAllKeys } from './main';
import { createLogEntry, execReasonListCheck, getDirTree, parseINI, runExternalCommand, runExternalCommand_Defaults } from './tools';

/*
    Require node modules
*/

import * as module_fs from 'fs';
import * as module_path from 'path';
import * as module_readline from 'readline';

/*
    Interfaces
*/

// Push error
interface pushError {
    err:string,
    repo:string
}

/*
    Variables
*/

// Current scan list
const scanList:string[] = [];

var

    // Remove counter
    removeRepoCounter = 0,

    // Import sucess counter
    importSuccessCounter = 0,

    // Repo entries array
    repoList:string[] = [],

    // Repair error list
    errorList:pushError[] = [];

/*
    Functions
*/

/**
    * Start repair database process
*/
export async function grpp_startRepairDatabase(){

    // Declare reasonList const and get repo entries
    const reasonList:string[] = [];
    repoList = structuredClone([...Object.keys(grppSettings.repoEntries)]);

    // Test conditions to not run repair process
    if (module_fs.existsSync(`${process.cwd()}/.temp/`) === !0) reasonList.push(langDatabase.common.errorBatchUpdateRunning);
    execReasonListCheck(reasonList, langDatabase.repair.warnUnablePerformRepair, async function(){

        // Filter git folders
        getDirTree(`${process.cwd()}/repos`, '.git').forEach(function(currentFolder){
            if (currentFolder.toLowerCase().indexOf('.git') !== -1) scanList.push(currentFolder.replace(`${process.cwd()}/repos/`, ''));
        });

        // Check missing entry keys, check missing repos and finish process
        await grpp_scanMissingEntryKeys();
        await grpp_checkMissingRepos().then(function(){
            createLogEntry(langDatabase.repair.infoRepairComplete);
        });

    });

}

/**
    * Check for missing repo entries on grpp_settings.json
*/
async function grpp_checkMissingRepos(){
    return new Promise<void>(async function(resolve){

        // Check if all available repos are listed on settings file
        createLogEntry(langDatabase.repair.infoCheckDatabaseFiles);
        if (scanList.length !== repoList.length){

            // Create log entry and start processing repo list
            createLogEntry(grpp_convertLangVar(langDatabase.repair.databaseLengthMismatch, [repoList.length, scanList.length]), 'warn');
            for (const currentRepo in scanList){
                if (repoList.indexOf(scanList[currentRepo]) === -1) await grpp_repairAddMissingRepo(scanList[currentRepo]);
            }

            // Check if repo path exists
            for (const currentRepo in repoList){
                if (module_fs.existsSync(`${process.cwd()}/repos/${repoList[currentRepo]}`) !== !0) await grpp_removeRepoEntry(repoList[currentRepo]);
            }

            // Log process complete and log display error details if had any
            createLogEntry(grpp_convertLangVar(langDatabase.repair.importRemoveStatus, [importSuccessCounter, removeRepoCounter, errorList.length]));
            if (errorList.length !== 0){
                createLogEntry(langDatabase.repair.importRemoveError);
                errorList.forEach(function(currentError:pushError){
                    createLogEntry(grpp_convertLangVar(langDatabase.repair.importRemoveDetails, [currentError.repo, currentError.err]));
                });
            }

        }
        resolve();

    });
}

/**
    * Scan for missing entry keys on database entries
*/
async function grpp_scanMissingEntryKeys(){
    return new Promise<void>(function(resolve){

        // Declare vars and consts
        var addedMissingKeys = 0,
            removeDeprecatedKeys = 0;
        
        const
            fixedRepos:string[] = [],
            repoPathWithCwd = `${process.cwd()}/repos/`;

        // Create log entry and start processing repos
        createLogEntry(langDatabase.repair.infoCheckMissingKeys);
        Object.keys(grppSettings.repoEntries).forEach(function(currentRepo){

            // Get current repo data and check all keys
            const currentRepoData:grppRepoEntry | any = grppSettings.repoEntries[currentRepo];
            Object.keys(repoEntry_Defaults).forEach(function(currentKey:any){

                // Check if current key doesn't exists on current repo
                if (currentRepoData[currentKey as keyof typeof currentRepoData] === void 0){

                    // Create log entry, add missing key to current repo and update it's data
                    createLogEntry(grpp_convertLangVar(langDatabase.repair.infoAddMissingKey, [currentKey, currentRepo]));
                    currentRepoData[currentKey as keyof typeof currentRepoData] = repoEntry_Defaults[currentKey as keyof typeof repoEntry_Defaults];
                    grpp_updateRepoData(currentRepo, currentRepoData);

                    // Bump added missing keys counter and check if current repo was already fixed - if not, push to fixed list
                    if (fixedRepos.indexOf(currentRepo) === -1) fixedRepos.push(currentRepo);
                    addedMissingKeys++;

                }

            });

            // Check if all data on current repo are valid
            Object.keys(currentRepoData).forEach(function(currentKey:any){

                if (repoEntry_Defaults[currentKey as keyof typeof repoEntry_Defaults] === void 0){

                    createLogEntry(grpp_convertLangVar(langDatabase.repair.infoRemoveKey, [currentRepo, currentKey]));
                    delete currentRepoData[currentKey];
                    grpp_updateRepoData(currentRepo, currentRepoData);

                    if (fixedRepos.indexOf(currentRepo) === -1) fixedRepos.push(currentRepo);
                    removeDeprecatedKeys++;

                }

            });

            // Check if current path exists are present on current database entry (Usually present on on GRPP version 1.0.0)
            if (currentRepo.indexOf(repoPathWithCwd) !== -1){

                createLogEntry(grpp_convertLangVar(langDatabase.repair.removePathFromKey, [currentRepo]));
                grpp_updateRepoData(currentRepo.replace(repoPathWithCwd, ''), currentRepoData);
                grpp_removeRepo(currentRepo);

            }

        });

        // Create log entry if any repo was fixed and resolve
        if (fixedRepos.length !== 0) createLogEntry(grpp_convertLangVar(langDatabase.repair.infoAddRemoveKeys, [addedMissingKeys, removeDeprecatedKeys, fixedRepos.length]));
        resolve();

    });
}

/**
    * Remove repo key from database
    * @param path [string] repo path
    * @returns [Promise] Resolve when input is provided
*/
async function grpp_removeRepoEntry(path:string){
    return new Promise<void>(function(resolve){

        // Check if needs to ask if user wants to remove current key from database
        if (repair_removeAllKeys === !1){

            // Declare readline const and check if user wants to remove repo entry
            const readline = module_readline.createInterface({ input: process.stdin, output: process.stdout });
            readline.question(grpp_convertLangVar(langDatabase.repair.confirmRemoveRepoDatabase, [path]), function(answer){
                readline.close();
                if (answer.toLowerCase() === langDatabase.common.confirmChar) removeRepo(path);
                resolve();
            });

        } else {
            removeRepo(path);
            resolve();
        }

    });
}

/**
    * Add missing repo
    * @param path [string] Repo path to be imported
*/
async function grpp_repairAddMissingRepo(path:string){
    return new Promise<void>(async function(resolve){

        // Declare config file path and check if current repo isn't bare
        var configPath = `${path}/config`;
        if (module_fs.existsSync(`${process.cwd()}/repos/${path}/.git/config`) === !0){
            configPath = `${path}/.git/config`;
            createLogEntry(grpp_convertLangVar(langDatabase.repair.warnRepoNotBare, [module_path.parse(path).name]), 'warn');
        }

        // Check if config file exists
        if (module_fs.existsSync(`${process.cwd()}/repos/${configPath}`) === !0){

            // Create vars
            const
                gitConfig = parseINI(module_fs.readFileSync(`${process.cwd()}/repos/${configPath}`, 'utf-8')),
                repoUrl = gitConfig['remote "origin"'].url,
                urlData = repoUrl.split('/'),
                repoName = urlData[urlData.length - 1],
                owner = urlData[urlData.length - 2],
                repoData:grppRepoEntry = {
                    owner,
                    url: repoUrl,
                    canUpdate: !0,
                    name: repoName,
                    isPriority: !1,
                    updateCounter: 0,
                    lastUpdatedOn: `Never`,
                    importDate: new Date().toString()
                };

            // Create path structure
            [
                `repos/${urlData[2]}`,
                `repos/${urlData[2]}/${owner}`
            ].forEach(function(cEntry){
                if (module_fs.existsSync(`${process.cwd()}/${cEntry}`) === !1) module_fs.mkdirSync(`${process.cwd()}/${cEntry}`);
            });

            // Create log entry and start import process
            createLogEntry(grpp_convertLangVar(langDatabase.repair.importMissingRepo, [repoName, path]));
            await runExternalCommand('git config remote.origin.fetch "+refs/*:refs/*"', { ...runExternalCommand_Defaults, chdir: `${process.cwd()}/repos/${path}` })
            .then(function(){
                grpp_updateRepoData(path, repoData);
                importSuccessCounter++;
                resolve();
            });

        } else {

            // Create error msg, log, push error and resolve
            pushError(path, grpp_convertLangVar(langDatabase.repair.errorConfigFileNotExists, [module_path.parse(path).name]));
            await grpp_removeRepo(path).then(resolve);

        }

    });
}

/**
    * Remove repo and bump removeRepoCounter
    * @param path [string] repo to be removed 
*/
function removeRepo(path:string){
    grpp_removeRepo(path);
    removeRepoCounter++;
}

/**
    * Push error to error list
    * @param repo [string] Repo path
    * @param err [string] Error details
*/
function pushError(repo:string, err:string){
    createLogEntry(grpp_convertLangVar(langDatabase.repair.pushErrorWarn, [err]), 'warn');
    errorList.push({ repo, err });
}

// Export module
export * from './repair';