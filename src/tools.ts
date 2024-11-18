/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    tools.ts

    Some functions from this file were ported from TMS Engine
*/

/*
    Import TS modules
*/

import { grppSettings } from './main';
import { consoleTextStyle } from './database';

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
    * Better clear console
    * Based on lukeed console-clear project
    * URL: https://github.com/lukeed/console-clear
    * @param removeHistory [boolean] set true to fully clear console, removing history
*/
export function consoleClear(removeHistory:boolean = !1){
    if (removeHistory === !0){
        process.stdout.write('\x1B[2J\x1B[3J\x1B[H\x1Bc');
    } else {
        console.clear();
    }
}

/**
    * Create log entry only if silent flag is not present
    * @param data content to print on screen
    * @param color [string] Text display mode
*/
export function createLogEntry(data:any, color:string = 'reset'){
    if (process.argv.indexOf('silent') === -1) console.log(`${consoleTextStyle[color as keyof typeof consoleTextStyle]}${data}`);
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
            var finalStd = trimString(stdData);
            if (options.removeBlankLines === !0){

                // Create temp var and process all lines
                var tempString = '';
                finalStd.split('\n').forEach(function(currentLine){
                    if (currentLine !== '') tempString = `${tempString}${currentLine}\n`;
                });
                finalStd = trimString(tempString);

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
    const res:any[] = [];
    while (target.length > 0){
        const chunk:any[] = target.splice(0, chunkSize);
        res.push(chunk);
    }
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
    * @param stopLocation [string] String pattern that will prevent looking data on subdirs.
	* @returns [string[]] Array with folder names
*/
export function getDirTree(dir:string, stopLocation:string = ''):string[] {

	// Create res var and checkDir function
	var res:string[] = [];
	const checkDir = function(path:string){

		// Scan current dir and check for subfolders
		module_fs.readdirSync(path, { withFileTypes: !0 }).filter(function(cEntry){
			if (cEntry.isDirectory() === !0){

                // Create current dir var, push current dir to res and check if can continue
                const currentDir = `${cEntry.parentPath}/${cEntry.name}`;
				res.push(currentDir);
                if (currentDir.indexOf(stopLocation) === -1) checkDir(currentDir);

            }
		});

	}

	// Start dir scan and return result
	checkDir(dir);
	return res;

}

/**
    * Trim last chars from string
    * @param str [string] String to be trimmed
    * @param length [number] Length of trim (Default: 1)
    * @returns [string] String trimmed 
*/
export function trimString(str:string, length:number = 1):string {
    return str.slice(0, (str.length - length));
}

// Export module
export * from './tools';