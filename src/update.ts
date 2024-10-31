/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    update.ts
*/

/*
    Import TS modules
*/

import { grpp_loadSettings } from './main';

/*
    Functions
*/

/**
    * Start GRPP update process
*/
export function grpp_startUpdate(){

    // Load settings before moving on
    grpp_loadSettings(function(){
        // WIP
    });

}

// Export module
export * from './update';