/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    update.ts
*/

/*
    Import TS modules
*/

import { checkConnection } from './utils';

/*
    Functions
*/

/**
    * Start GRPP update process
*/
export function grpp_startUpdate(){

    // Check if we have some internet connection
    checkConnection().then(function(){

        // WIP

    }).catch(function(err){
        throw `ERROR - Unable to start update process because GRPP connection test failed!\nDetails: ${err}\n`;
    });

}

// Export module
export * from './update';