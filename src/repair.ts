/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    repair.ts
*/

/*
    Import TS modules
*/

import { grppRepoEntry, repoEntry_Defaults } from './import';
import { grpp_removeRepo, grpp_updateRepoData, grppSettings, repair_removeAllKeys } from './main';
import { convertArrayToString, createLogEntry, execReasonListCheck, getDirTree, parseINI, runExternalCommand, runExternalCommand_Defaults } from './tools';

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

var

    // Remove counter
    removeRepoCounter = 0,

    // Import sucess counter
    importSuccessCounter = 0,

    // Repair error list
    errorList:pushError[] = [];

/*
    Functions
*/

/**
    * Start repair database process
*/
export async function grpp_startRepairDatabase(){

    // Declare vars and check if GRPP update is running
    const reasonList:string[] = [];
    if (module_fs.existsSync(`${process.cwd()}/.temp/`) === !0) reasonList.push(`You can\'t execute this action while GRPP Update Process is running!`);

    // Check if can start repair process
    execReasonListCheck(reasonList, `WARN: Unable to perform GRPP repair!\nReason: ${convertArrayToString(reasonList)}`, async function(){

        /*
            Check for missing repo entries on grpp_settings.json
        */

        // Read current path dir structure
        const
            scanList:string[] = [],
            repoList = Object.keys(grppSettings.repoEntries),
            tempList = getDirTree(`${process.cwd()}/repos`, '.git');

        // Filter git folders
        createLogEntry(`INFO - Checking database files...`);
        tempList.forEach(function(currentFolder){
            if (currentFolder.toLowerCase().indexOf('.git') !== -1) scanList.push(currentFolder);
        });

        // Check if all available repos are listed on settings file
        if (scanList.length !== repoList.length){

            // Create log entry and start processing repo list
            createLogEntry(`WARN - Repo counter mismatch! [${repoList.length} on database vs. ${scanList.length} found on current scan]\nStarting repair process...\n\n(Depending of how many repos are available, this may take a while!)\n`, 'warn');
            for (const currentRepo in scanList){
                if (repoList.indexOf(scanList[currentRepo]) === -1) await grpp_repairAddMissingRepo(scanList[currentRepo]);
            }

            // Check if repo path exists
            for (const currentRepo in repoList){
                if (module_fs.existsSync(repoList[currentRepo]) !== !0) await grpp_removeRepoEntry(repoList[currentRepo]);
            }

            // Log process complete and log display error details if had any
            createLogEntry(`\nINFO - Repair process imported ${importSuccessCounter} repos and removed ${removeRepoCounter} repos entries with ${errorList.length} errors.\n`);
            if (errorList.length !== 0){
                createLogEntry(`==> Import errors:`);
                errorList.forEach(function(currentError:pushError){
                    createLogEntry(`Repo: ${currentError.repo}\nDetails: ${currentError.err}\n`);
                });
            }

        }

        /*
            Scan for missing entry keys on database entries
        */

        // Declare vars 
        var addedMissingKeys = 0,
            removeDeprecatedKeys = 0,
            fixedRepos:string[] = [];

        // Create log entry and start processing repos
        createLogEntry(`INFO - Checking missing keys on repos entries...`);
        Object.keys(grppSettings.repoEntries).forEach(function(currentRepo){

            // Get current repo data and check all keys
            const currentRepoData:grppRepoEntry | any = grppSettings.repoEntries[currentRepo];
            Object.keys(repoEntry_Defaults).forEach(function(currentKey:any){

                // Check if current key doesn't exists on current repo
                if (currentRepoData[currentKey as keyof typeof currentRepoData] === void 0){

                    // Create log entry, add missing key to current repo and update it's data
                    createLogEntry(`INFO - Adding missing key \"${currentKey}\" to ${currentRepo}...`);
                    currentRepoData[currentKey as keyof typeof currentRepoData] = repoEntry_Defaults[currentKey as keyof typeof repoEntry_Defaults];
                    grpp_updateRepoData(currentRepo, currentRepoData);

                    // Bump added missing keys counter and check if current repo was already fixed. If not, push to fixed list
                    if (fixedRepos.indexOf(currentRepo) === -1) fixedRepos.push(currentRepo);
                    addedMissingKeys++;

                }

            });

            // Check if all data on current repo are valid
            Object.keys(currentRepoData).forEach(function(currentKey:any){

                if (repoEntry_Defaults[currentKey as keyof typeof repoEntry_Defaults] === void 0){

                    createLogEntry(`INFO - Removing deprecated key from ${currentRepo}: ${currentKey}`);
                    delete currentRepoData[currentKey];
                    grpp_updateRepoData(currentRepo, currentRepoData);

                    if (fixedRepos.indexOf(currentRepo) === -1) fixedRepos.push(currentRepo);
                    removeDeprecatedKeys++;

                }

            });

            // Check if current path exists are present on current database entry (Usually present on on GRPP version 1.0.0)
            const repoPathWithCwd = `${process.cwd()}/repos/`;
            if (currentRepo.indexOf(repoPathWithCwd) !== -1){

                createLogEntry(`INFO - Updating repo entry from previous GRPP version: \"${currentRepo}\"`);
                grpp_updateRepoData(currentRepo.replace(repoPathWithCwd, ''), currentRepoData);
                grpp_removeRepo(currentRepo);

            }

        });

        // Create log entry if any repo was fixed.
        if (fixedRepos.length !== 0) createLogEntry(`INFO - GRPP added ${addedMissingKeys} missing keys and removed ${removeDeprecatedKeys} deprecated keys on ${fixedRepos.length} repos.`);

        /*
            Process complete
        */
        createLogEntry(`INFO - Repair complete!\n`);

    });

}

/**
    * Remove repo key from database
    * @param path [string] repo path
    * @returns [Promise] Resolve when input is provided
*/
async function grpp_removeRepoEntry(path:string){
    return new Promise<void>(function(resolve){

        // Remove repo function
        const removeRepo = function(){
            grpp_removeRepo(path);
            removeRepoCounter++;
        };

        // Check if needs to ask if user wants to remove current key from database
        if (repair_removeAllKeys === !1){

            // Declare readline const and check if user wants to remove repo entry
            const readline = module_readline.createInterface({ input: process.stdin, output: process.stdout });
            readline.question(`WARN - It seems that ${path} does not exists!\nDo you want to remove this entry from database? [Y/n] `, function(answer){
                readline.close();
                if (answer.toLowerCase() === 'y') removeRepo();
                resolve();
            });

        } else {
            removeRepo();
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
        if (module_fs.existsSync(`${path}/.git/config`) === !0){
            configPath = `${path}/.git/config`;
            createLogEntry(`WARN - It seems that ${module_path.parse(path).name}.git is not on bare format!`, 'warn');
        }

        // Check if config file exists
        if (module_fs.existsSync(configPath) === !0){

            // Create vars
            const
                gitConfig = parseINI(module_fs.readFileSync(configPath, 'utf-8')),
                originalCwd = structuredClone(process.cwd()),
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

            // Create log entry and start import process
            createLogEntry(`INFO - Importing missing repo: ${repoName} [${path}]`);
            await runExternalCommand('git config remote.origin.fetch "+refs/*:refs/*"', { ...runExternalCommand_Defaults, chdir: path })
            .then(function(){
                runExternalCommand(`git config --global --add safe.directory ${path}`, { ...runExternalCommand_Defaults, chdir: originalCwd });
            })
            .then(function(){
                grpp_updateRepoData(path.replace(process.cwd(), ''), repoData);
                importSuccessCounter++;
                resolve();
            });

        } else {

            // Create error msg, log, push error and resolve
            pushError(path, `Unable to read data from ${module_path.parse(path).name}.git because config file doesn\'t exists!\nGRPP will remove this repo entry from database...`);
            grpp_removeRepo(path);
            resolve();

        }

    });
}

/**
    * Push error to error list
    * @param repo [string] Repo path
    * @param err [string] Error details
*/
function pushError(repo:string, err:string){
    createLogEntry(`WARN - ${err}`, 'warn');
    errorList.push({ repo, err });
}

// Export module
export * from './repair';