/*
    Git Repos Preservation Project (GRPP)
    getSettingsData.js
*/

/*
    Import node modules
*/

const module_fs = require('fs');

/*
    Variables
*/

// Default settings
const cSettings = structuredClone(JSON.parse(module_fs.readFileSync('settings.json', 'utf-8')));

/*
    Functions
*/

/**
    * Main function
*/
function getSettingsData(){

    // Return clone path
    if (process.argv.indexOf('--getClonePath')){
        console.info(cSettings.clonePath);
    }

    // Return ignore list
    if (process.argv.indexOf('--getIgnoreList')){
        console.info(cSettings.ignoreList.toString().replace(RegExp(',', 'gi'), ' '));
    }

}

// Start main function
getSettingsData();