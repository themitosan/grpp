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
var cSettings = structuredClone(JSON.parse(module_fs.readFileSync('src/json/settings_template.json', 'utf-8')));

// Current repo name
const repoName = getRepoName(process.argv[2]);

/*
    Functions
*/

/**
    * Get repo name
    * @param str repo url
    * @returns repo name
*/
function getRepoName(str){
    var res = [];
    if (str !== void 0){
        res = str.split('/');
    }
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
        cSettings = structuredClone(JSON.parse(module_fs.readFileSync('settings.json', 'utf-8')));
    }

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
            str: [`fatal: destination path '${cSettings.clonePath}/${repoName}' already exists and is not an empty directory.`]
        }

    };

    // Check if can clone
    if (process.argv[2] !== void 0){

        // Spawn git clone command
        console.info(`INFO - Importing \x1b[33m${repoName}\x1b[0m - Please wait...`);
        const gitClone = module_child_process.spawn('git', ['clone', '--progress', '--bare', '--mirror', process.argv[2], `${cSettings.clonePath}/${repoName}`]);

        // Capture git data
        gitClone.stderr.on('data', function(data){
            msgData = `${msgData}${data}\n`;
            console.info(data.toString());
        });
        gitClone.stdout.on('data', function(data){
            msgData = `${msgData}${data}\n`;
            console.info(data.toString());
        });
        gitClone.stdin.on('data', function(data){
            msgData = `${msgData}${data}\n`;
            console.info(data.toString());
        });

        // Take action after process closing
        gitClone.on('exit', function(code){

            // Output exit code, cut final line break from git output and log it's data
            console.info(`INFO - Git closed with code ${code}.`);
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
                console.info('INFO - Now... Let\'s make it a safe directory.');

                // Mark current repo as a safe dir
                const makeTrust = module_child_process.spawn('git', ['config', '--global', '--add', 'safe.directory', `${process.cwd()}/${cSettings.clonePath}/${repoName}`]);
                makeTrust.on('exit', function(data){
                    console.info(`INFO - Set \x1b[33m${repoName}\x1b[0m dir as a safe dir closed with code ${data}!`);
                    console.info('\n=== Process complete! ===\n');
                });

            } else {

                // Create error message string and output data
                var errStr = '';
                errorList.forEach(function(cError){
                    errStr = `${errStr}${errorDatabase[cError].message}\n`;
                });
                console.error(`\x1b[31mERROR - Unable to clone ${repoName}!\n\x1b[0mReason: ${errStr.slice(0, errStr.length - 1)}\n`);

            }

        });

    } else {
        console.error('\x1b[31mERROR - You must provide a git url!\n');
    }

}

// Start main process
startCheck();