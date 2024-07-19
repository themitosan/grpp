/*
    Git Repos Preservation Project (GRPP)
    init.js
*/

/*
    Import node modules
*/

const module_fs = require('fs');

/*
    Variables
*/

// Settings
var cSettings = structuredClone(JSON.parse(module_fs.readFileSync('src/json/settings_template.json', 'utf-8')));

/*
    Functions
*/

/**
    * Main function
*/
function initProject(){

    // Check if settings file exists
    if (module_fs.existsSync('settings.json') === !1){
        console.info('INFO - Creating settings file, please wait...');
        module_fs.writeFileSync('settings.json', JSON.stringify(cSettings), 'utf-8');
    } else {
        console.info('INFO - Loading settings file...')
        cSettings = structuredClone(JSON.parse(module_fs.readFileSync('settings.json', 'utf-8')));
    }

    // Check if main repo dir exists
    if (module_fs.existsSync(cSettings.clonePath) === !1){

        // Check if git clone path exists
        try {
            console.info(`INFO - Creating git clone path: ${cSettings.clonePath}`);
            module_fs.mkdirSync(cSettings.clonePath);
        } catch (err) {
            throw `ERROR: Unable to create git clone path!\nReason: ${err}`;
        }

    }

}

// Start main function
initProject();