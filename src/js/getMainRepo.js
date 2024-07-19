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
var cSettings = structuredClone(JSON.parse(module_fs.readFileSync('src/json/settings_template.json', 'utf-8')));

/*
    Functions
*/

/**
    * Main function
*/
function getMainRepo(){

    // Check if settings file exists
    if (module_fs.existsSync('settings.json') === !1){
        module_fs.writeFileSync('settings.json', JSON.stringify(cSettings), 'utf-8');
    } else {
        cSettings = structuredClone(JSON.parse(module_fs.readFileSync('settings.json', 'utf-8')));
    }

    // Return clone path
    console.info(cSettings.clonePath);

}

// Start main function
getMainRepo();