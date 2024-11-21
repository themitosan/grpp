/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    import.ts
*/

/*
    Import TS modules
*/

import { grpp_updateRepoData } from './main';
import { grpp_displayMainLogo } from './utils';
import { convertArrayToString, createLogEntry, execReasonListCheck, runExternalCommand, runExternalCommand_Defaults } from './tools';

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
            repoPath = `${process.cwd()}/repos/${urlData[2]}/${repoOwner}/${repoName}`;

        // Check conditions
        if (cloneURL.length === 0) reasonList.push('You must provide a git url to import!');
        if (module_fs.existsSync(`${repoPath}/HEAD`) === !0) reasonList.push(`This repo already exists on filesystem!\nPath: ${repoPath}`);
        if (module_fs.existsSync(`${process.cwd()}/.temp/`) === !0) reasonList.push(`You can\'t import any repo while GRPP Update Process is running!`);

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
                `${process.cwd()}/repos`,
                `${process.cwd()}/repos/${urlData[2]}`,
                `${process.cwd()}/repos/${urlData[2]}/${repoOwner}`
            ].forEach(function(cEntry){
                if (module_fs.existsSync(cEntry) === !1) module_fs.mkdirSync(cEntry);
            });

            // Start clone process
            await runExternalCommand(`git clone ${cloneURL} --bare --mirror --progress`, { ...runExternalCommand_Defaults, chdir: `${process.cwd()}/repos/${urlData[2]}/${repoOwner}` })
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
    grpp_displayMainLogo(!0);
    createLogEntry(`INFO - Starting clone process...\n`);
    const urlArray = urlList.split('\n');
    for (const url of urlArray){
        if (url.length > 0){
            createLogEntry(`INFO - [${(urlArray.indexOf(url) + 1)} of ${urlArray.length}] Clonning URL: ${url}`);
            await grpp_startImport(url);
        }
    }

}

// Export module
export * from './import';