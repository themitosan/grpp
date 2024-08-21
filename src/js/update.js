/*
    Git Repos Preservation Project (GRPP)
    update.js [WIP]
*/

/*
    Import node modules
*/

const
    module_fs = require('fs'),
    module_path = require('path'),
    module_child_process = require('child_process');

/*
    Variables and Consts
*/

// Lock exec
var lockExec = !1,
    execLogData;

const
    
    // User settings
    grppSettings = structuredClone(JSON.parse(module_fs.readFileSync('settings.json'))),

    // Git error database
    errorDatabase = structuredClone({

        // Repo takedown
        dmcaTakedown: {
            message: 'This repo is unavailable due to DMCA takedown.',
            str: ['remote: Repository unavailable due to DMCA takedown.']
        },

        // Auth failed
        authFailed: {
            message: 'Unable to get repo data due failed authentication.',
            str: [`fatal: Authentication failed for %REPO_NAME%`]
        },

        // Repo already exists
        repoExists: {
            message: 'This repo already exists on current database!',
            str: [`fatal: destination path %REPO_URL% already exists and is not an empty directory.`]
        },

        // Unable to acess repo
        unableAccess: {
            message: `Unable to access . Make sure that you have internet and server is available.`,
            str: ['fatal: unable to access ', ': Failed to connect to ', 'after ', 'ms: Could not connect to server']
        }

    });

/*
    Functions
*/

/*
    Spawn command
*/
function spawnCommand(cmd, args){

    // Check if exec command is active
    if (lockExec === !1){

        var strData = '';
        const spawnProcess = module_child_process.spawn(cmd, args);

        spawnProcess.stderr.on('data', function(data){
            strData = `${strData}\n${data.toString()}`;
        });
        spawnProcess.stdin.on('data', function(data){
            strData = `${strData}\n${data.toString()}`;
        });
        spawnProcess.stdout.on('data', function(data){
            strData = `${strData}\n${data.toString()}`;
        });

        spawnProcess.on('exit', function(data){
            strData = `${strData}\nProcess closed with exit code ${data}`;
        });

    }

}

/*
    Parse number polarity
*/
function parsePolarity(val){
    return (val - val - val);
}

// Check if can start main update process
function checkProcess(){

    // Create vars and check if lock file exists
    var reasonList = [];
    if (module_fs.existsSync('grpp_lock') === !1){
        reasonList.push('lock file was found!');
    }

    // Check if clone dir exists
    if (module_fs.existsSync(grppSettings.clonePath) !== !0){
        reasonList.push(`Clone dir (${grppSettings.clonePath}) was not found!`);
    } else {

        // Check if clone dir has repos to be updated
        if (module_fs.readdirSync(grppSettings.clonePath).length === 0){
            reasonList.push('There is no repos to be updated on clone path');
        }

    }

    /*
        Check if can start main process
    */
    if (reasonList.length === 0 || process.argv.indexOf('--skipCheck') !== -1){
        startProcess();
    } else {
        throw `ERROR - Unable to start GRPP!\nReasons:\n${reasonList.toString().replace(RegExp(',', 'gi'), '\n')}`;
    }

}

// Start main process
function startProcess(){

    // Get start time and warn if skipCheck flag is active
    const timeStart = performance.now();
    if (process.argv.indexOf('--skipCheck') !== -1){
        console.warn('WARN - Secutiry checks was disabled! (--skipCheck flag was detected)')
    }

    // Set root path const, create lock file (if required) and move to repos dir
    const rootPath = structuredClone(process.cwd());
    if (process.argv.indexOf('--skipCheck') === -1){
        console.info('INFO - Creating lock file...');
        module_fs.writeFileSync('grpp_lock', `### GRPP LOCK FILE ###\n#This file is meant to be removed by grpp itself.\n#If this file exists and grpp isn't running, this means that something went wrong on previous update attempt.`, 'utf-8');
    }
    process.chdir(grppSettings.clonePath);

    // Create update var list and check if need to trim repos from ignore list
    var updateList = module_fs.readdirSync(grppSettings.clonePath);
    if (process.argv.indexOf('--skipIgnoreList') === -1 && grppSettings.ignoreList.length !== 0){

        // Process ignore list
        grppSettings.ignoreList.forEach(function(cRepo){
            if (updateList.indexOf(cRepo) !== -1){
                updateList.splice(updateList.indexOf(cRepo), 1);
            }
        });

    }

    /*
        Start main update process
    */

    // Log start
    console.info(`===\n=== Starting update process ===\n===\n\n
        Clone path: ${grppSettings.clonePath}\n
        Repos to be updated: ${updateList.length} (${module_fs.readdirSync(grppSettings.clonePath).length} in total, ${grppSettings.ignoreList.length} to be skipped)\n`);

    const updateRepo = function(repoName){
        // WIP
    }

    /*
        Finish process
    */

    // Return chdir and remove lock file
    process.chdir(rootPath);
    if (module_fs.existsSync('grpp_lock') === !0){
        module_fs.unlinkSync('grpp_lock');
    }
    const elapsedTime = parsePolarity(timeStart - performance.now());

    console.info('=== Process Complete ===');

}

// Init process
checkProcess();