/*
    Git Repos Preservation Project (GRPP)
    getMainRepo.js
*/

/*
    Import node modules
*/

const module_fs = require('fs');

/*
    Variables
*/

// Default settings
var cSettings = structuredClone(JSON.parse(module_fs.readFileSync('settings.json', 'utf-8')));

/*
    Functions
*/

/**
    * Main function
*/
function getMainRepo(){

    // Return clone path
    console.info(cSettings.clonePath);

}

// Start main function
getMainRepo();