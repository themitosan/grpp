/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    getReposFrom.ts
*/

/*
    Import TS modules
*/

import { grppSettings } from './main';
import { grpp_importBatch } from './import';
import { grpp_displayMainLogo } from './utils';
import { checkConnection, convertArrayToString, createLogEntry, execReasonListCheck, openOnTextEditor, trimString } from './tools';

/*
    Require node modules
*/

import * as module_fs from 'fs';
import * as module_readLine from 'readline';

/*
    Functions
*/

/**
    * Get repos from user
    * @param userName [string] user name
*/
export async function grpp_getReposFrom(userName:string){

    // Check if we have internet connection
    await checkConnection().then(function(){

        // Create vars
        const
            reasonList:string[] = [],
            readline = module_readLine.createInterface({ input: process.stdin, output: process.stdout });

        var urlBase:string = '',
            canFetch:boolean = !0;

        // Check if username was provided, if GRPP update is running and check if can continue
        if (userName.length < 1) reasonList.push('You must provide a username!');
        if (module_fs.existsSync(`${process.cwd()}/.temp/`) === !0) reasonList.push(`You can\'t execute this action while GRPP Update Process is running!`);
        execReasonListCheck(reasonList, `ERROR - Unable to seek repos from user!\nReason: ${convertArrayToString(reasonList)}`, function(){

            // Prompt user, close readline and switch user input
            readline.question(`Please, insert where GRPP should seek repos:\n\n    1) GitHub (default)\n    2) GitLab\n    3) Gitea based server\n\nYour choice: `, function(usrAnswer){
                readline.close();
                switch (usrAnswer){

                    // GitHub
                    case '1':
                        urlBase = `https://api.github.com/users/${userName}/repos?per_page=100&page=`;
                        break;

                    // GitLab
                    case '2':
                        urlBase = `https://gitlab.com/api/v4/users/${userName}/projects?per_page=100&page=`;
                        break;

                    // Gitea based server
                    case '3':
                        canFetch = !1;
                        promptGiteaUrl(userName);
                        break;

                    // Default (GitHub)
                    default:
                        urlBase = `https://api.github.com/users/${userName}/repos?per_page=100&page=`;
                        break;

                }

                // Start fetch process and close readLine
                if (canFetch === !0) startUserFetch(urlBase);

            });
        });

    });

}

/**
    * Prompt Gitea base url
*/
function promptGiteaUrl(userName:string){

    // Create vars and prompt base url
    var urlBase = '';
    const readline = module_readLine.createInterface({ input: process.stdin, output: process.stdout });
    readline.question('\nPlease, insert base domain where gitea server is hosted (Example: \"192.168.1.150:3000\")\nYour answer: ', function(giteaUrl){

        // Set url, start user fetch and close readline
        readline.close();
        urlBase = `http://${giteaUrl}/api/v1/users/${userName}/repos?per_page=100&page=`;
        startUserFetch(urlBase);

    });
    
}

/**
    * Process fetch user repos
    * @param urlBase [string] url to fetch user data
*/
function startUserFetch(urlBase:string){

    // Declare vars
    var repoChunk:any[] = [],
        currentPage = structuredClone(grppSettings.fetchStartPage);

    /*
        Declare functions
    */

    // Process fetch result
    const processFetchRes = function(fetchResult:any){

        // Create error string and check if there is repos available
        const errorList:string[] = [];
        if (fetchResult.length === 0 && repoChunk.length === 0) errorList.push('No repos available for this user.');

        // Check if had 404 error and if can continue
        if (fetchResult['status'] !== void 0 && fetchResult['status'].toString() === "404") errorList.push(fetchResult.status);
        if (errorList.length === 0){

            // Check if have results. If so, push to repo chunk
            if (fetchResult.length !== 0){
                fetchResult.forEach(function(cRepo:any){
                    repoChunk.push(cRepo);
                });
            }

            // Check if needs to continue fetch process
            if (fetchResult.length === 0 && repoChunk.length !== 0 || currentPage > (grppSettings.maxPages - 1)){
                processRepoChunk(repoChunk);
            } else {
                currentPage++;
                fetchData();
            }

        }

    };

    // Fetch data from remote
    const fetchData = function(){

        // Create fetch url, log and fetch data
        const fetchUrl = `${urlBase}${currentPage}`;
        createLogEntry(`INFO - Fetching url: ${fetchUrl}`);
        fetch(fetchUrl).then(function(fetchRes){

            // If fetch result is ok, process output. If not, get error data and display it
            if (fetchRes.ok === !0){
                fetchRes.json().then(function(fetchData){
                    processFetchRes(fetchData);
                });
            } else {
                fetchRes.text().then(function(err:any){
                    throw err;
                });
            }
        });

    };

    // Start process
    createLogEntry(`INFO - Starting fetch process...`);
    fetchData();

}

/**
    * Process final fetch result
    * @param resultArray [object] repo list 
*/
function processRepoChunk(resultArray:any[]){

    // Declare vars, process repo list and trim last bit
    var repoList = '';
    const readline = module_readLine.createInterface({ input: process.stdin, output: process.stdout });
    resultArray.forEach(function(cRepo){
        repoList = `${repoList}${cRepo.clone_url}\n`;
    });
    repoList = trimString(repoList);

    // Clear window and display info
    grpp_displayMainLogo(!0);
    const fetchResPath = `${process.cwd()}/grpp_fetch_res.txt`;
    readline.question(`INFO - GRPP managed to find ${resultArray.length} repos. Here is the full list:\n\n${repoList}\n\nHere is what you can do:\n\n    1) Import all repos (default)\n    2) Edit current list on text editor (${grppSettings.userEditor})\n    3) Save repo list on a file to import later\n    4) Cancel\n\nYour choice: `, function(userAction){

        // Close readline and switch user action
        readline.close();
        switch (userAction){

            // Import all files
            case '1':
                grpp_importBatch(repoList);
                break;

            // Edit list before importing
            case '2':
                grpp_editRepoListBeforeImport(repoList);
                break;

            // Save file to import later
            case '3':
                grpp_displayMainLogo(!0);
                module_fs.writeFileSync(fetchResPath, repoList, 'utf-8');
                createLogEntry(`INFO - Process Complete!\nFile path: ${process.cwd()}/grpp_fetch_res.txt\n\nTo import repos from a file, use the following flag: \"importList=PATH_TO_FILE\"\n`);
                break;

            // Cancel action
            case '4':
                process.exit();

            // Default
            default:
                grpp_importBatch(repoList);
                break;

        }

    });

}

/**
    * Edit repo list before importing
    * @param repoList [string] repo list that will be edited before importing
*/
async function grpp_editRepoListBeforeImport(repoList:string){
    const fetchResPath = `${process.cwd()}/grpp_fetch_res.txt`;
    module_fs.writeFileSync(fetchResPath, repoList, 'utf-8');
    await openOnTextEditor(fetchResPath).then(function(){
        grpp_importBatch(module_fs.readFileSync(fetchResPath, 'utf-8'));
        module_fs.unlinkSync(fetchResPath);
    });
}

// Export module
export * from './getReposFrom';