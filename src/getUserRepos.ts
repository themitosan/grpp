/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    getUserRepos.ts
*/

/*
    Import TS modules
*/

import { grppSettings } from './main';
import { grpp_importBatch } from './import';
import { checkConnection, convertArrayToString, execReasonListCheck, grpp_displayMainLogo } from './utils';

/*
    Require node modules
*/

import * as module_fs from 'fs';
import * as module_readLine from 'node:readline';

/*
    Functions
*/

/**
    * Get user repos
    * @param userName [string] user name
*/
export async function grpp_getUserRepos(userName:string){

    // Check if we have internet connection
    await checkConnection().then(function(){

        // Create vars
        const nodeReadLine = module_readLine.createInterface({ input: process.stdin, output: process.stdout });
        var urlBase:string = '',
            canFetch:boolean = !0,
            reasonList:string[] = [];

        // Check if username was provided
        if (userName.length < 1){
            reasonList.push('You must provide a username!');
        }

        // Check if can prompt user
        execReasonListCheck(reasonList, `ERROR - Unable to seek repos from user!\nReason: ${convertArrayToString(reasonList)}`, function(){
        
            // Prompt user, close nodeReadLine and switch user input
            nodeReadLine.question(`Please, insert where GRPP should seek repos:\n\n   1) GitHub (default)\n   2) GitLab\n   3) Gitea based server\n\nYour choice: `, function(usrAnswer){
                nodeReadLine.close();
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
                if (canFetch === !0){
                    startUserFetch(urlBase);
                }
            
            });
        });

    }).catch(function(err){
        throw `ERROR - Unable to proceed because GRPP failed to connect to internet!\nDetails: ${err}\n`;
    });

}

/**
    * Prompt Gitea base url
*/
function promptGiteaUrl(userName:string){

    // Create vars and prompt base url
    var urlBase:string = '';
    const nodeReadLine = module_readLine.createInterface({ input: process.stdin, output: process.stdout });
    nodeReadLine.question('\nPlease, insert base domain where gitea server is hosted (Example: \"192.168.1.150:3000\")\nYour answer: ', function(giteaUrl){

        // Set url, start user fetch and close readline
        urlBase = `http://${giteaUrl}/api/v1/users/${userName}/repos?per_page=100&page=`;
        startUserFetch(urlBase);
        nodeReadLine.close();

    });
    
}

/**
    * Process fetch user repos
    * @param urlBase [string] url to fetch user data
*/
function startUserFetch(urlBase:string){

    // Declare vars
    var currentPage = 1,
        repoChunk:any[] = [];

    /*
        Declare functions
    */

    // Process fetch result
    const processFetchRes = function(fetchResult:any){

        // Create error string and check if there is repos available
        var errorList:string[] = [];
        if (fetchResult.length === 0 && repoChunk.length === 0){
            errorList.push('No repos available for this user.');
        }

        // Check if had 404 error
        if (fetchResult['status'] !== void 0 && fetchResult['status'].toString() === "404"){
            errorList.push(fetchResult.status);
        }

        // Check if can continue
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
        console.info(`INFO - Fetching url: ${fetchUrl}`);
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
    console.info(`INFO - Starting fetch process...`);
    fetchData();

}

/**
    * Process final fetch result
    * @param resultArray [object] repo list 
*/
function processRepoChunk(resultArray:any[]){

    // Declare vars, process repo list and trim last bit
    var repoList:string = '';
    const nodeReadLine = module_readLine.createInterface({ input: process.stdin, output: process.stdout });
    resultArray.forEach(function(cRepo){
        repoList = `${repoList}${cRepo.clone_url}\n`;
    });
    repoList = repoList.slice(0, (repoList.length - 1));

    // Clear window and display info
    console.clear();
    grpp_displayMainLogo();
    nodeReadLine.question(`INFO - GRPP managed to find ${resultArray.length} repos. Here is the full list:\n\n${repoList}\n\nHere is what you can do:\n\n   1) Import all repos\n   2) Save repo list on a file to import later\n\nYour choice: `, function(userAction){

        // Close nodeReadLine and switch user action
        nodeReadLine.close();
        switch (userAction){

            // Import all files
            case '1':
                grpp_importBatch(repoList);
                break;

            // Save file to import later
            case '2':
                console.clear();
                grpp_displayMainLogo();
                module_fs.writeFileSync(`${process.cwd()}/grpp_fetch_res.txt`, repoList, 'utf-8');
                console.info(`INFO - Process Complete!\nFile path: ${process.cwd()}/grpp_fetch_res.txt\n\nTo import repos from a file, use the following flag: \"--importList=PATH_TO_FILE\"\n`);
                break;

            // Default
            default:
                grpp_importBatch(repoList);
                break;

        }

    });

}

// Export module
export * from './getUserRepos';