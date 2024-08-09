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
var cSettings = structuredClone(JSON.parse(module_fs.readFileSync('src/json/settings_template.json', 'utf-8'))),
    repoList = [];

const

    // Current repo name
    repoName = getRepoName(process.argv[2]),
    
    // String separator
    separator = '=================================================';

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
        },

        // Unable to acess repo
        unableAccess: {
            message: `Unable to access ${process.argv[2]}. Make sure that you have internet and server is available.`,
            str: ['fatal: unable to access ', ': Failed to connect to ', 'after ', 'ms: Could not connect to server']
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

                    // Read clone path to get total items preserved and log info!
                    repoList = module_fs.readdirSync(cSettings.clonePath);
                    console.info(`INFO - Set \x1b[33m${repoName}\x1b[0m dir as a safe dir closed with code ${data}!\n\n==============[ Process complete! ]==============\n  ┌ Repo name: \x1b[33m${repoName}\x1b[0m\n  └ Total repos preserved: \x1b[33m${repoList.length}\x1b[0m\n${separator}\n`);

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