/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    getUserRepos.ts
*/

/*
    Import TS modules
*/

import { grpp_displayMainLogo } from './main';

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
export function grpp_getUserRepos(userName:string){

    // Create vars
    const nodeReadLine = module_readLine.createInterface({ input: process.stdin, output: process.stdout });
    var urlBase:string = '',
        canFetch:boolean = !0;

    // Prompt user
    nodeReadLine.question(`Please, insert where GRPP should seek repos:\n\n   1) GitHub (default)\n   2) GitLab\n   3) Gitea based server\n\nYour choice: `, function(usrAnswer){

        // Switch answer
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

}

/**
    * Prompt gitea base url 
*/
function promptGiteaUrl(userName:string){

    // Create vars and prompt base url
    var urlBase:string = '';
    const nodeReadLine = module_readLine.createInterface({ input: process.stdin, output: process.stdout });
    nodeReadLine.question('\nPlease, insert base domain where gitea server is hosted (Example: 192.168.15.200:3000)\nYour answer: ', function(giteaUrl){

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

        // Check if have results. If so, push to repo chunk
        if (fetchResult.length !== 0){
            fetchResult.forEach(function(cRepo:any){
                repoChunk.push(cRepo);
            });
        }

        if (fetchResult.length === 0 && repoChunk.length !== 0){
            processRepoChunk(repoChunk);
        } else {
            currentPage++;
            fetchData();
        }

    };

    // Fetch data
    const fetchData = function(){
        fetch(`${urlBase}${currentPage}`).then(function(fetchRes){

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
    fetchData();

}

/**
    * Process final fetch result
    * @param repoChunk [object] repo list 
*/
function processRepoChunk(repoChunk:any[]){

    // Declare vars, process repo list and trim last bit
    var repoList:string = '';
    const nodeReadLine = module_readLine.createInterface({ input: process.stdin, output: process.stdout });
    repoChunk.forEach(function(cRepo){
        repoList = `${repoList}${cRepo.clone_url}\n`;
    });
    repoList = repoList.slice(0, (repoList.length - 1));

    // Clear window and display info
    console.clear();
    grpp_displayMainLogo();
    nodeReadLine.question(`INFO - GRPP managed to find ${repoChunk.length} repos. Here is the full list:\n\n${repoList}\n\nHere is what you can do:\n\n   1) Import all repos\n   2) Save repo list on a file to import later\n\nYour choice: `, function(userAction){

        // Switch user action
        nodeReadLine.close();
        switch (userAction){

            // Import all files
            case '1':
                // WIP
                break;

            // Save file to import later
            case '2':
                console.clear();
                grpp_displayMainLogo();
                module_fs.writeFileSync(`${process.cwd()}/grpp_fetch_res.txt`, repoList, 'utf-8');
                console.info(`INFO - Process Complete!\nFile path: ${process.cwd()}/grpp_fetch_res.txt\n\nTo import repos from a file, use the following flag: \"--importList=PATH_TO_FILE\"\n`);
                break;

        }

    });

}

// Export module
export * from './getUserRepos';