/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    getReposFrom.ts
*/

/*
    Import TS modules
*/

import { grppSettings } from './main';
import { grpp_batchImport } from './import';
import { grpp_displayMainLogo } from './utils';
import { grpp_convertLangVar, langDatabase } from './lang';
import { checkConnection, createLogEntry, execReasonListCheck, openOnTextEditor, trimString } from './tools';

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

        // Create consts and vars
        const
            reasonList:string[] = [],
            readline = module_readLine.createInterface({ input: process.stdin, output: process.stdout });

        var urlBase:string = '',
            canFetch:boolean = !0;

        // Check if username was provided, if GRPP update is running and check if can continue
        if (userName.length < 1) reasonList.push(langDatabase.getReposFrom.errorUnableSeekUserRepos_noUserName);
        if (module_fs.existsSync(`${process.cwd()}/.temp/`) === !0) reasonList.push(langDatabase.common.errorBatchUpdateRunning);
        execReasonListCheck(reasonList, langDatabase.getReposFrom.errorUnableSeekUserRepos, function(){

            // Prompt user, close readline and switch user input
            readline.question(grpp_convertLangVar(langDatabase.getReposFrom.questionReposHost, [userName]), function(usrAnswer){

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
    const readline = module_readLine.createInterface({ input: process.stdin, output: process.stdout });
    readline.question(langDatabase.getReposFrom.questionGiteaUrl, function(giteaUrl){

        // Close readline and start fetch process
        readline.close();
        startUserFetch(`http://${giteaUrl}/api/v1/users/${userName}/repos?per_page=100&page=`);

    });
    
}

/**
    * Process fetch user repos
    * @param urlBase [string] url to fetch user repos
*/
async function startUserFetch(urlBase:string){

    // Declare vars
    var repoChunk:any[] = [],
        currentPage = structuredClone(grppSettings.fetchStartPage);

    /*
        Declare functions
    */

    // Process fetch result
    const processFetchRes = async function(fetchResult:any){

        // Create consts and check fetch res
        const errorList:string[] = [];
        if (fetchResult.length === 0 && repoChunk.length === 0) errorList.push(langDatabase.getReposFrom.errorNoReposAvailable);
        if (fetchResult['status'] !== void 0 && fetchResult['status'].toString() === '404') errorList.push(fetchResult.status);

        // Check if can continue
        if (errorList.length === 0){

            // If fetch have repos, push all to repo chunk
            if (fetchResult.length !== 0) repoChunk = [ ...repoChunk, ...fetchResult ];

            // Check if needs to continue fetch process
            if (fetchResult.length === 0 && repoChunk.length !== 0 || currentPage > (grppSettings.maxPages - 1)){
                processRepoChunk(repoChunk);
            } else {
                currentPage++;
                await fetchData();
            }

        }

    };

    // Fetch data from remote
    const fetchData = async function(){

        // Create fetch url, log and fetch data
        const fetchUrl = `${urlBase}${currentPage}`;
        createLogEntry(grpp_convertLangVar(langDatabase.getReposFrom.infoFetchUrl, [fetchUrl]));

        try {

            // Fetch repo data and check if response is okay
            const response = await fetch(fetchUrl);
            if (response.ok === !0){
                const fetchJson = await response.json();
                await processFetchRes(fetchJson);
            } else {
                throw await response.json();
            }

        } catch (err:any) {
            grpp_displayMainLogo(!0);
            createLogEntry(grpp_convertLangVar(langDatabase.getReposFrom.errorFetchNotOk, [err.message, err.status]), 'error');
            process.exit();
        }

    };

    // Start process
    await fetchData();

}

/**
    * Process final fetch result
    * @param resultArray [object] repo list 
*/
function processRepoChunk(resultArray:any[]){

    // Declare vars and consts
    var repoList = '';
    const
        fetchResPath = `${process.cwd()}/grpp_fetch_res.txt`,
        readline = module_readLine.createInterface({ input: process.stdin, output: process.stdout });

    // Create import list and trim last line break
    resultArray.forEach(function(cRepo){
        repoList = `${repoList}${cRepo.clone_url}\n`;
    });
    repoList = trimString(repoList);

    // Clear window and display info
    grpp_displayMainLogo(!0);
    readline.question(grpp_convertLangVar(langDatabase.getReposFrom.questionFetchRepoList, [resultArray.length, repoList, grppSettings.userEditor]), function(userAction){

        // Close readline and switch user action
        readline.close();
        switch (userAction){

            // Import all files
            case '1':
                grpp_batchImport(repoList);
                break;

            // Edit list before importing
            case '2':
                grpp_editRepoListBeforeImport(repoList);
                break;

            // Save file to import later
            case '3':
                grpp_displayMainLogo(!0);
                module_fs.writeFileSync(fetchResPath, repoList, 'utf-8');
                createLogEntry(grpp_convertLangVar(langDatabase.getReposFrom.saveFileImportLater, [process.cwd()]));
                break;

            // Cancel action
            case '4':
                process.exit();

            // Default
            default:
                grpp_batchImport(repoList);
                break;

        }

    });

}

/**
    * Edit repo list before importing
    * @param repoList [string] repo list that will be edited before importing
*/
async function grpp_editRepoListBeforeImport(repoList:string){

    // Create file path const and write repo list
    const fetchResPath = `${process.cwd()}/grpp_fetch_res.txt`;
    module_fs.writeFileSync(fetchResPath, repoList, 'utf-8');

    // Open repo list on text editor, call batch import after exiting and remove repo list file
    await openOnTextEditor(fetchResPath).then(function(){
        grpp_batchImport(module_fs.readFileSync(fetchResPath, 'utf-8'));
        module_fs.unlinkSync(fetchResPath);
    });

}

// Export module
export * from './getReposFrom';