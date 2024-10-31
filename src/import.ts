/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    import.ts
*/

/*
    Import TS modules
*/

import { grppRepoEntry } from './database';
import { grpp_loadSettings } from './main';
import { convertArrayToString, execReasonListCheck } from './utils';

/*
    Functions
*/

/**
    * Start import process
    * @param url [string] git url to be imported
*/
export async function grpp_startImport(url:string){

    // Load settings before continue
    grpp_loadSettings(function(){

        // Create vars before checking if can continue
        var reasonList:string[] = [];
        const
            urlData = url.split('/'),
            repoName = urlData[urlData.length - 1],
            repoOwner = urlData[urlData.length - 2],
            repoPath = `${process.cwd()}/${urlData[2]}/${repoOwner}/${repoName}`,
            newRepoData:grppRepoEntry = {
                repoPath,
                repoName,
                repoOwner,
                repoUrl: url,
                updateCounter: 0,
                lastUpdatedOn: 'Never'
            };
    
        // Check if can continue
        execReasonListCheck(reasonList, `WARN - Unable to clone repo!\nReason: ${convertArrayToString(reasonList)}`, function(){
            // WIP
        });

    });

}

// Export module
export * from './import';