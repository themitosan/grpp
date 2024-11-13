/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    tools.ts

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

import * as module_fs from 'fs';
import * as module_dns from 'dns';
import * as module_childProcess from 'child_process';

/*
    Interfaces
*/

// Run external command options
export interface runExternalCommandOptions {
    chdir:string,
    onStdData:Function,
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
export const runExternalCommand_Defaults:Pick <runExternalCommandOptions, 'chdir' | 'removeBlankLines' | 'enableConsoleLog' | 'onStdData'> = {
    chdir: process.cwd(),
    enableConsoleLog: !0,
    removeBlankLines: !1,
    onStdData: function(){return;}
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
	* Get current percentage of a current number based on maximum factor
	* @param current [number] Current number to be checked
	* @param maximum [number] Maximum factor of current number
	* @returns [number] Percentage of current based on maximum factor.
*/
export function parsePercentage(current:number, maximum:number):number {
	return Math.floor((current / maximum) * 100);
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
    if (num < min) num = min;
    if (num > max) num = max;
    return num;
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
    * @param options [runExternalCommandOptions] chdir where commands will be executed (default: current working dir)
*/
export async function runExternalCommand(cmd:string, options:runExternalCommandOptions = { ...runExternalCommand_Defaults }){
    return new Promise<runExternalCommand_output>(function(resolve){

        // Change current working directory and declare some vars
        var stdData:string = '';
        process.chdir(options.chdir);
        const
            originalCwd = structuredClone(process.cwd()),
            execCmd = module_childProcess.exec(cmd);

        // Process std data
        execCmd.stderr?.on('data', function(data){
            options.onStdData(data);
            stdData = `${stdData}${data}\n`;
            if (options.enableConsoleLog === !0) createLogEntry(data);
        });
        execCmd.stdout?.on('data', function(data){
            options.onStdData(data);
            stdData = `${stdData}${data}\n`;
            if (options.enableConsoleLog === !0) createLogEntry(data);
        });

        // Reset chdir and resolve after closing process
        execCmd.on('exit', function(exitCode){

            // Check if had exit code and create log entry if it was higher than 1
            if (exitCode !== null && exitCode > 1)
                createLogEntry(`INFO - ${cmd} exited with code ${exitCode}`);
            
            // Create final string var and check if needs to clean output
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
    * @returns [any[]] array with smaller chunks
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

/**
    * Checks if a string can be parsed by JSON.parse
    * @param data [string] data to be checked
    * @returns [boolean] if data is a valid JSON or not
*/
export function isValidJSON(data:string):boolean {
    var res = !0;
    try {
        JSON.parse(data);
    } catch (err) {
        res = !1;
    }
    return res;
}

/**
	* Get all dirs from a specific location
	* @param dir [string] Path to be scanned
	* @returns [string[]] Array with folder names
*/
export function getDirTree(dir:string):string[] {

	// Create res var and checkDir function
	var res:string[] = [];
	const checkDir = function(path:string){

		// Scan current dir and check for subfolders
		module_fs.readdirSync(path, { withFileTypes: !0 }).filter(function(cEntry){
			if (cEntry.isDirectory() === !0){
				res.push(`${cEntry.parentPath}/${cEntry.name}`);
				checkDir(`${cEntry.parentPath}/${cEntry.name}`);
			}
		});

	}

	// Start dir scan and return result
	checkDir(dir);
	return res;

}

// Export module
export * from './tools';