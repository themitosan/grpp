/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    import.ts
*/

/*
    Import TS modules
*/

import { grpp_updateRepoData } from './main';
import { convertArrayToString, createLogEntry, execReasonListCheck, grpp_displayMainLogo, runExternalCommand, runExternalCommand_Defaults } from './utils';

/*
    Require node modules
*/

import * as module_fs from 'fs';

/*
    Interfaces
*/

// GRPP Repo Entry
export interface grppRepoEntry {
    repoUrl:string,
    repoName:string,
    repoOwner:string,
    canUpdate:boolean,
    importDate:string,
    updateCounter:number,
    lastUpdatedOn:string
}

/*
    Variables
*/

// Current repo being imported
var currentRepo:grppRepoEntry;

/*
    Functions
*/

/**
    * Start import process
    * @param cloneURL [string] git url to be imported
*/
export async function grpp_startImport(cloneURL:string){
    return new Promise<void>(function(resolve){

        // Create vars before checking if can continue
        var reasonList:string[] = [];
        const
            date = new Date(),
            urlData = cloneURL.split('/'),
            repoName = urlData[urlData.length - 1],
            repoOwner = urlData[urlData.length - 2],
            originalChdir = structuredClone(process.cwd()),
            repoPath = `${process.cwd()}/${urlData[2]}/${repoOwner}/${repoName}`;

        // Check conditions
        if (module_fs.existsSync(`${repoPath}/HEAD`) === !0) reasonList.push(`This repo already exists on filesystem!\nPath: ${repoPath}`);
        if (cloneURL.length === 0) reasonList.push('You must provide a git url to import!');

        // Check if can continue
        execReasonListCheck(reasonList, `WARN - Unable to clone repo!\nReason: ${convertArrayToString(reasonList)}\n`, async function(){

            // Set current repo var
            currentRepo = {
                repoName,
                repoOwner,
                canUpdate: !0,
                updateCounter: 0,
                repoUrl: cloneURL,
                lastUpdatedOn: 'Never',
                importDate: date.toString()
            };

            // Start creating directory structure
            createLogEntry('INFO - Creating directory structure...');
            [
                `${process.cwd()}/${urlData[2]}`,
                `${process.cwd()}/${urlData[2]}/${repoOwner}`
            ].forEach(function(cEntry){
                if (module_fs.existsSync(cEntry) === !1) module_fs.mkdirSync(cEntry);
            });

            // Start clone process
            await runExternalCommand(`git clone ${cloneURL} --bare --mirror --progress`, { ...runExternalCommand_Defaults, chdir: `${process.cwd()}/${urlData[2]}/${repoOwner}` })
            .then(function(){
                createLogEntry('INFO - Setting git config to fetch all refs from origin...');
                runExternalCommand('git config remote.origin.fetch "+refs/*:refs/*"', { ...runExternalCommand_Defaults, chdir: repoPath });
            })
            .then(function(){
                createLogEntry(`INFO - Setting repo dir ${repoName} as safe...`);
                runExternalCommand(`git config --global --add safe.directory ${repoPath}`, { ...runExternalCommand_Defaults, chdir: originalChdir });
            })
            .then(function(){

                // Import to repo database and finish process
                grpp_updateRepoData(repoPath, currentRepo);
                createLogEntry(`\nINFO - Process complete!\nRepo path: ${repoPath}\n`);
                resolve();

            });

        }, resolve);

    });
}

/**
    * Import all repos from a list
    * @param urlList [string] string with urls to be imported
*/
export async function grpp_importBatch(urlList:string){

    // Clear screen, create url array and start processing it
    grpp_displayMainLogo();
    createLogEntry(`INFO - Starting clone process...\n`);
    const urlArray = urlList.split('\n');
    for (const url of urlArray){
        if (url.length > 0){
            createLogEntry(`INFO - [${(urlArray.indexOf(url) + 1)} of ${urlArray.length}] Processing URL: ${url}`);
            await grpp_startImport(url);
        }
    }

}

// Export module
export * from './import';