/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    import.ts
*/

/*
    Import TS modules
*/

import { grppRepoEntry } from './database';
import { convertArrayToString, execReasonListCheck } from './utils';

/*
    Require node modules
*/

import * as module_fs from 'fs';

/*
    Functions
*/

/**
    * Start import process
    * @param url [string] git url to be imported
*/
export async function grpp_startImport(url:string){

    // Create vars before checking if can continue
    var reasonList:string[] = [];
    const
        urlData = url.split('/'),
        repoName = urlData[urlData.length - 1],
        repoOwner = urlData[urlData.length - 2],
        repoPath = `${process.cwd()}/${urlData[2]}/${repoOwner}/${repoName}`;

    // Check if repo already exists
    if (module_fs.existsSync(`${repoPath}/HEAD`) === !0){
        reasonList.push('This repo already exists on filesystem!');
    }

    // Check if can continue
    execReasonListCheck(reasonList, `WARN - Unable to clone repo!\nReason: ${convertArrayToString(reasonList)}`, function(){

        // Create new repo entry var
        const newRepoEntry:grppRepoEntry = {
            repoPath,
            repoName,
            repoOwner,
            repoUrl: url,
            canUpdate: !0,
            updateCounter: 0,
            lastUpdatedOn: 'Never'
        };

    });

}

// Export module
export * from './import';