/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    init.ts
*/

/*
    Import TS modules
*/

import { grppSettings } from './main';

/*
    Import node modules
*/

import * as module_fs from 'fs';

/*
    Functions
*/

/**
    * Initiaite GRPP path
    * @param path [string] path to be initialized 
*/
export function grpp_initPath(path:string = process.cwd()){

    // Check if settings file exists
    console.info(`INFO - Creating settings file at \"${path}\"`);
    if (module_fs.existsSync(`${path}/grpp_settings.json`) !== !0){
        module_fs.writeFileSync(`${path}/grpp_settings.json`, JSON.stringify(grppSettings), 'utf-8');
        console.info('INFO - Process complete!\n');
    } else {
        console.warn('WARN - Unable to create settings file on selected location because it already exists!\n');
    }

}

// Export module
export * from './init';