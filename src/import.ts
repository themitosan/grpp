/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    import.ts
*/

/*
    Import TS modules
*/

import { grppRepoEntry } from './database';
import { grpp_importRepoDatabase } from './main';
import { convertArrayToString, execReasonListCheck, grpp_displayMainLogo, runExternalCommand } from './utils';

/*
    Require node modules
*/

import * as module_fs from 'fs';

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

        // Check if repo already exists
        if (module_fs.existsSync(`${repoPath}/HEAD`) === !0){
            reasonList.push(`This repo already exists on filesystem!\nPath: ${repoPath}`);
        }

        // Check if no url was provided
        if (cloneURL.length === 0){
            reasonList.push('You must provide a git url to import!');
        }

        // Check if can continue
        execReasonListCheck(reasonList, `WARN - Unable to clone repo!\nReason: ${convertArrayToString(reasonList)}\n`, function(){

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
            console.info('INFO - Creating directory structure...');
            [
                `${process.cwd()}/${urlData[2]}`,
                `${process.cwd()}/${urlData[2]}/${repoOwner}`
            ].forEach(function(cEntry){

                // Check if folder exists. If not, create it
                if (module_fs.existsSync(cEntry) === !1){
                    module_fs.mkdirSync(cEntry);
                }

            });

            // Add repo to list
            const pushRepoToList = function(){
                
                // Create temp hash and import to repo database
                grpp_importRepoDatabase(currentRepo, repoPath);
                console.info(`\nINFO - Process complete!\nRepo path: ${repoPath}\n`);
                resolve();

            };

            // Set git to fetch all refs
            const getAllRefs = function(){
                console.info('INFO - Setting git config to fetch all refs from origin...');
                runExternalCommand('git config remote.origin.fetch "+refs/*:refs/*"', repoPath, setGitSafeDir);
            };

            // Set clone dir as safe
            const setGitSafeDir = function(){
                console.info(`INFO - Setting repo dir ${repoName} as safe...`);
                runExternalCommand(`git config --global --add safe.directory ${repoPath}`, originalChdir, pushRepoToList);
            };

            // Start clone process
            console.info('INFO - Starting clone process...');
            runExternalCommand(`git clone ${cloneURL} --bare --mirror --progress`, `${process.cwd()}/${urlData[2]}/${repoOwner}`, getAllRefs);

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
    console.info(`INFO - Starting cloning process...\n`);
    const urlArray = urlList.split('\n');
    for (const url of urlArray){
        if (url.length > 0){
            console.info(`INFO - [${(urlArray.indexOf(url) + 1)} of ${urlArray.length}] Processing URL: ${url}`);
            await grpp_startImport(url);
        }
    }

}

// Export module
export * from './import';