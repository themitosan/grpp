/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    repair.ts
*/

/*
    Import TS modules
*/

import { grppRepoEntry } from './import';
import { grpp_updateRepoData, grppSettings } from './main';
import { createLogEntry, getDirTree, runExternalCommand, runExternalCommand_Defaults } from './tools';

/*
    Require node modules
*/

import * as module_fs from 'fs';
import * as module_ini from 'ini';

/*
    Functions
*/

/**
    * Repair database
*/
export async function grpp_startRepairDatabase(){

    // Read current path dir structure
    const
        scanList:string[] = [],
        tempList = getDirTree(`${process.cwd()}/repos`),
        repoList = Object.keys(grppSettings.repoEntries);
    
    // Filter git folders
    tempList.forEach(function(currentFolder){
        if (module_fs.readdirSync(currentFolder).indexOf('HEAD') !== -1) scanList.push(currentFolder);
    });

    // Check if all available repos are listed on settings file
    if (scanList.length !== repoList.length){

        // Create log entry and start processing repo list
        createLogEntry(`WARN - Repo counter mismatch! [${repoList.length} on database vs. ${scanList.length} found on current scan]`);
        for (const currentRepo in scanList){
            if (repoList.indexOf(scanList[currentRepo]) === -1) await grpp_repairRepo(scanList[currentRepo]);
        }
        createLogEntry(`\nINFO - Repair process complete!\n`);

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
       
        // Create vars
        const
            gitConfig = module_ini.parse(module_fs.readFileSync(`${path}/config`, 'utf-8')),
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
            resolve();
        });

    });
}

// Export module
export * from './repair';