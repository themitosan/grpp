/*
    Git Repos Preservation Project (GRPP)
    import.js
*/

/*
    Import node modules
*/

const
    module_fs = require('fs'),
    module_child_process = require('child_process');

/*
    Variables
*/

// Settings
var cSettings = {
    clonePath: "repos",
    ignoreList: []
};

// Current repo name
const repoName = getRepoName(process.argv[2]);

// Git clone error database
const errorDatabase = {

    // Repo takedown
    dmcaTakedown: {
        message: 'This repo is unavailable due to DMCA takedown.',
        str: ['remote: Repository unavailable due to DMCA takedown.']
    },

    // Auth failed
    authFailed: {
        message: 'Unable to get repo data due failed authentication.',
        str: [`fatal: Authentication failed for '${process.argv[2]}'`]
    },

    // Repo already exists
    repoExists: {
        message: 'This repo already exists on current database!',
        str: [`fatal: destination path 'git/${repoName}' already exists and is not an empty directory.`]
    }

};

/*
    Functions
*/

/**
    * Get repo name
    * @param str repo url
    * @returns repo name
*/
function getRepoName(str){
    var res = str.split('/');
    return res[res.length - 1];
}

/**
    * Start main process 
*/
function startCheck(){

    // Declare vars
    var msgData = '',
        errorList = [];

    // Check if settings file exists
    if (module_fs.existsSync('settings.json') !== !0){

        // Log settings not found and create a new file
        console.info(`INFO - Settings file was not found!\nCreating a new file on ${process.cwd()}`);
        module_fs.writeFileSync('settings.json', JSON.stringify(cSettings), 'utf-8');

    } else {
        cSettings = JSON.parse(module_fs.readFileSync('settings.json', 'utf-8'));
    }

    // Spawn git clone command
    console.info(`INFO - Importing \x1b[33m${repoName}\x1b[0m - Please wait...`);
    const gitClone = module_child_process.spawn('git', ['clone', '--progress', '--bare', '--mirror', process.argv[2], `${cSettings.clonePath}/${repoName}`]);

    // Capture git data
    gitClone.stderr.on('data', function(data){
        msgData = `${msgData}${data}\n`;
    });
    gitClone.stdout.on('data', function(data){
        msgData = `${msgData}${data}\n`;
    });
    gitClone.stdin.on('data', function(data){
        msgData = `${msgData}${data}\n`;
    });

    // Take action after process closing
    gitClone.on('exit', function(code){

        // Output exit code, cut final line break from git output and log it's data
        console.info(`INFO - Git clone command closed with code ${code}.`);
        msgData = msgData.slice(0, msgData.length - 1);

        // Process error list
        Object.keys(errorDatabase).forEach(function(cError){
            errorDatabase[cError].str.forEach(function(cStr){
                if (msgData.indexOf(cStr) !== -1){
                    errorList.push(cError);
                }
            });
        });

        // Check if we had any errors
        if (errorList.length === 0){
            
            // Log process
            console.info('INFO - No errors were detected during clone process!');

        } else {

            // Create error message string and output data
            var errStr = '';
            errorList.forEach(function(cError){
                errStr = `${errStr}${errorDatabase[cError].message}\n`;
            });
            console.error(`\x1b[31mERROR - Unable to clone ${repoName}!\n\x1b[0mReason: ${errStr.slice(0, errStr.length - 1)}\n\nGit output:\n${msgData}`);

        }

    });

}

// Start main process
startCheck();