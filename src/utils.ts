/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    utils.ts

    Some functions from this file were ported from TMS Engine
*/

/*
    Import TS modules
*/

import { grppSettings } from './main';
import { grppRepoEntry } from './import';
import { grpp_commandList, grpp_optionList } from './database';

/*
    Require node modules
*/

import * as module_dns from 'dns';
import * as module_childProcess from 'child_process';

/*
    Interfaces
*/

// Run external command options
export interface runExternalCommandOptions {
    chdir:string,
    enableConsoleLog:boolean,
    removeBlankLines:boolean
}

// Run external command output
export interface runExternalCommand_output {
    stdData:string,
    exitCode:number | null
}

/*
    Defaults
*/

// Run external command options
export const runExternalCommand_Defaults:Pick <runExternalCommandOptions, 'chdir' | 'removeBlankLines' | 'enableConsoleLog'> = {
    chdir: process.cwd(),
    enableConsoleLog: !0,
    removeBlankLines: !1
};

/*
    Functions
*/

/**
    * Create log entry only if --silent flag is not present
    * @param data content to print on screen
*/
export function createLogEntry(data:any){
    if (process.argv.indexOf('--silent') === -1) console.info(data);
}

/**
	* Convert negative number to positive
	* @param number [number] Number to be converted
	* @returns [number] positive number
*/
export function parsePositive(n:number):number {
	var res = ((n - n) - n);
	if (res < 0) res = ((res - res) - res);
	return res;
}

/**
    * Prevent number being lower than a specified value
    * @param num [number] input number
    * @param min [number] minimum value
    * @param max [number] maximum value
    * @returns fixed number
*/
export function preventMinMax(num:number, min:number, max:number):number {

    // Declare vars, check num value and return res
    var res = min;
    if (num < min) num = min;
    if (num > max) num = max;
    return res;

}

/**
	* Convert array to string, replacing comma with defined value (Default: line-break [\n])
	* @param str [string] Array to be converted
	* @param rep [string] Values to be instead of comma
	* @returns [string] String converted from array
*/
export function convertArrayToString(str:string[], rep:string = '\n'):string {
	return str.toString().replace(RegExp(',', 'gi'), rep);
}

/**
	* Execute reasonList check
	* @param reasonList [string[]] String list with reasons to not continue
	* @param warnMsg [string] Base warn message informing that was unable to proceed
	* @param action [Function] Function to be executed if reasonList is empty
    * @param onError [Function] Function to be executed if reasonList isn't empty
*/
export function execReasonListCheck(reasonList:string[], warnMsg:string, action:Function, onError:Function = function(){return;}){
    if (reasonList.length === 0){
		action();
	} else {
        console.error(warnMsg);
        onError();
	}
}

/**
    * Check web connection
    * This function was written based on hurricane response on: https://stackoverflow.com/questions/54887025/get-ip-address-by-domain-with-dns-lookup-node-js
    * @returns Promise with result
*/
export async function checkConnection(){
    return new Promise(function(resolve, reject){
        module_dns.lookup(grppSettings.connectionTestURL, function(err, address){
            if (err) reject(err);
            resolve(address);
        });
    });
};

/**
    * Run external commands
    * @param cmd [string] command to be executed
    * @param options [] chdir where commands will be executed (default: current working dir)
*/
export async function runExternalCommand(cmd:string, options:runExternalCommandOptions = { ...runExternalCommand_Defaults }){
    return new Promise<runExternalCommand_output>(function(resolve){

        // Change current working directory and declare some vars
        var stdData:string = '';
        process.chdir(options.chdir);
        const
            originalCwd = structuredClone(process.cwd()),
            execCmd = module_childProcess.exec(cmd);

        // Print data
        execCmd.stderr?.on('data', function(data){
            stdData = `${stdData}${data}\n`;
            if (options.enableConsoleLog === !0) createLogEntry(data);
        });
        execCmd.stdout?.on('data', function(data){
            stdData = `${stdData}${data}\n`;
            if (options.enableConsoleLog === !0) createLogEntry(data);
        });

        // Reset chdir and resolve after closing process
        execCmd.on('exit', function(exitCode){

            // Log exit code, create final string var and check if needs to clean output
            createLogEntry(`INFO - ${cmd} exited with code ${exitCode}`);
            var finalStd = stdData.slice(0, (stdData.length - 1));
            if (options.removeBlankLines === !0){

                // Create temp var and process all lines
                var tempString = '';
                finalStd.split('\n').forEach(function(currentLine){
                    if (currentLine !== '') tempString = `${tempString}${currentLine}\n`;
                });
                finalStd = tempString.slice(0, (tempString.length - 1));

            }

            // Return working dir to current path, execute 
            process.chdir(originalCwd);
            resolve({ exitCode, stdData: finalStd });

        });

    });
}

/**
	* Convert ms to HH:MM:SS format
	* Original code: https://stackoverflow.com/questions/6312993/javascript-seconds-to-time-string-with-format-hhmmss
	* @param ms [number] ms to be converted
	* @returns [string] Time on HH:MM:SS format 
*/
export function converMsToHHMMSS(ms:number):string {
	const nDate = new Date(0);
	nDate.setSeconds(ms / 1000);
	return nDate.toISOString().substring(11, 19);
}

/**
    * Split array into chunks
    * Original code: https://stackabuse.com/how-to-split-an-array-into-even-chunks-in-javascript
    * @param arr [array] Array with objects
    * @param chunkSize [number] number of chinks main array will be splitted (default: 2)
    * @returns array with smaller chunks
*/
export function spliceArrayIntoChunks(target:any[], chunkSize:number = 2):any[] {

    // Define res var and process array
    const res:any[] = [];
    while (target.length > 0){
        const chunk:any[] = target.splice(0, chunkSize);
        res.push(chunk);
    }

    // Return result
    return res;

}

/*
    GRPP Utils
*/

/**
    * Print GRPP status
*/
export function grpp_printStatus(){
    createLogEntry(`==> GRPP Status:\n    Current path: ${process.cwd()}\n`);
    createLogEntry(`──┬ Total times GRPP Update executed: ${grppSettings.runCounter}`);
    createLogEntry(`  ├ Total GRPP Update runtime: ${converMsToHHMMSS(grppSettings.updateRuntime)} [${grppSettings.updateRuntime} ms]`);
    createLogEntry(`  ├ Last time GRPP Update was executed: ${grppSettings.lastRun}`);
    createLogEntry(`  └ Total repos preserved: ${Object.keys(grppSettings.repoEntries).length}\n`);
}

/**
    * Display main logo
*/
export function grpp_displayMainLogo(){
    console.clear();
    createLogEntry("\n   <=============================================================>");
    createLogEntry("   <=|          Git Repo Preservation Project (GRPP)           |=>");
    createLogEntry("   <=|     Created by Juliana (@julianaheartz.bsky.social)     |=>");
    createLogEntry("   <=============================================================>");
    createLogEntry("   <=|             A classic quote from an old one:            |=>");
    createLogEntry("   <=|                   \"Quem guarda, \x1b[1;32mt\x1b[1;33me\x1b[1;34mm\x1b[0m!\"                   |=>");
    createLogEntry("   <=============================================================>\n");
}

/**
    * Display help menu
*/
export function grpp_displayHelp(){
    createLogEntry('==> Function list:\n');
    Object.keys(grpp_commandList).forEach(function(currentFlag:any){
        createLogEntry(`─┬─ ${currentFlag}\n └─ ${grpp_commandList[currentFlag]}\n`);
    });
    createLogEntry('==> Option list:\n');
    Object.keys(grpp_optionList).forEach(function(currentFlag:any){
        createLogEntry(`─┬─ ${currentFlag}\n └─ ${grpp_optionList[currentFlag]}\n`);
    });
}

/**
    * Get repo info
    * @param path [string] database path to repo
*/
export function grpp_getRepoInfo(path:string){

    // Declare vars
    var reasonList:string[] = [],
        repoIndex:number | null = grpp_getRepoIndex(path);

    // Start checking conditions
    if (grppSettings.repoEntries.length < 1) reasonList.push('You must import any repo before using this option.');
    if (path.length < 1) reasonList.push('You must provide repo path!');
    if (repoIndex === null) reasonList.push(`Unable to find repo with provided path!`);

    // Check if can continue
    execReasonListCheck(reasonList, `ERROR - Unable to get repo info!\nReason: ${convertArrayToString(reasonList)}`, function(){

        // Get repo data
        const 
            fullPath:string = Object.keys(grppSettings.repoEntries)[repoIndex!],
            currentRepoData:grppRepoEntry = grppSettings.repoEntries[fullPath];
        createLogEntry(`==> Repo info:\n\n${JSON.stringify(currentRepoData, null, 4)}\n`);
    
    });

}

/**
    * Get repo index
    * @param path repo path
    * @return [number | null] Repo index or null if not found
*/
export function grpp_getRepoIndex(path:string):number | null {

    // Create variables and check if full path was provided
    var res:number | null = null;
    if (grppSettings.repoEntries[path] === void 0){

        // Start seeking current repo path
        const repoArray = Object.keys(grppSettings.repoEntries);
        for (var currentRepo = 0; currentRepo < repoArray.length; currentRepo++){

            // Check if found current repo
            if (repoArray[currentRepo].indexOf(path) !== -1){
                res = currentRepo;
                break;
            }
        }

    } else {
        res = Object.keys(grppSettings.repoEntries).indexOf(path);
    }

    // Return res
    return res;

}

/**
    * Sync database [WIP]
*/
export async function grpp_syncDatabase(){
    // WIP
}

// Export module
export * from './utils';