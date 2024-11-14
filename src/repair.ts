/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    repair.ts
*/

/*
    Import TS modules
*/

import { grppRepoEntry } from './import';
import { grpp_removeRepo, grpp_updateRepoData, grppSettings } from './main';
import { createLogEntry, getDirTree, runExternalCommand, runExternalCommand_Defaults } from './tools';

/*
    Require node modules
*/

import * as module_fs from 'fs';
import * as module_ini from 'ini';
import * as module_path from 'path';

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

    // Repair sucess counter
    successCounter = 0,

    // Repair error list
    errorList:pushError[] = [];

/*
    Functions
*/

/**
    * Start repair database process
*/
export async function grpp_startRepairDatabase(){

    // Read current path dir structure
    const
        scanList:string[] = [],
        repoList = Object.keys(grppSettings.repoEntries),
        tempList = getDirTree(`${process.cwd()}/repos`, '.git');

    // Filter git folders
    tempList.forEach(function(currentFolder){
        if (currentFolder.toLowerCase().indexOf('.git') !== -1) scanList.push(currentFolder);
    });

    // Check if all available repos are listed on settings file
    if (scanList.length !== repoList.length){

        // Create log entry and start processing repo list
        createLogEntry(`WARN - Repo counter mismatch! [${repoList.length} on database vs. ${scanList.length} found on current scan]\nStarting repair process...\n\n(Depending of how many repos are available, this may take a while!)\n`);
        for (const currentRepo in scanList){
            if (repoList.indexOf(scanList[currentRepo]) === -1) await grpp_repairRepo(scanList[currentRepo]);
        }

        // Log process complete and log display error details if had any
        createLogEntry(`\nINFO - Repair process fixed ${successCounter} repos, with ${errorList.length} errors.\n`);
        if (errorList.length !== 0){
            createLogEntry(`==> Error list:`);
            errorList.forEach(function(currentError:pushError){
                createLogEntry(`Repo: ${currentError.repo}\nDetails: ${currentError.err}\n`);
            });
        }

    } else {
        createLogEntry(`INFO - There is no errors on repo database.\n`);
    }

}

/**
    * Repair current repo
    * @param path [string] Repo path to be imported
*/
async function grpp_repairRepo(path:string){
    return new Promise<void>(async function(resolve){

        // Declare config file path and check if current repo isn't bare
        var configPath = `${path}/config`;
        if (module_fs.existsSync(`${path}/.git/config`) === !0){
            configPath = `${path}/.git/config`;
            createLogEntry(`WARN - It seems that ${module_path.parse(path).name}.git is not on bare format!`);
        }

        // Check if config file exists
        if (module_fs.existsSync(configPath) === !0){

            // Create vars
            const
                gitConfig = module_ini.parse(module_fs.readFileSync(configPath, 'utf-8')),
                originalChdir = structuredClone(process.cwd()),
                repoUrl = gitConfig['remote "origin"'].url,
                urlData = repoUrl.split('/'),
                repoName = urlData[urlData.length - 1],
                repoOwner = urlData[urlData.length - 2],
                repoData:grppRepoEntry = {
                    repoUrl,
                    repoName,
                    repoOwner,
                    canUpdate: !0,
                    updateCounter: 0,
                    lastUpdatedOn: `Never`,
                    importDate: new Date().toString()
                };

            // Create log entry and start import process
            createLogEntry(`INFO - Importing missing repo: ${repoName}`);
            await runExternalCommand('git config remote.origin.fetch "+refs/*:refs/*"', { ...runExternalCommand_Defaults, chdir: path })
            .then(function(){
                runExternalCommand(`git config --global --add safe.directory ${path}`, { ...runExternalCommand_Defaults, chdir: originalChdir });
            })
            .then(function(){
                grpp_updateRepoData(path, repoData);
                successCounter++;
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
    createLogEntry(`WARN - ${err}`);
    errorList.push({ repo, err });
}

// Export module
export * from './repair';