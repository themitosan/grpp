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
import { grpp_flagList } from './database';

/*
    Require node modules
*/

import * as module_dns from 'dns';
import * as module_childProcess from 'child_process';

/*
    Functions
*/

/**
    * Print GRPP status
*/
export function grpp_printStatus(){
    console.info(`==> GRPP Status:\n    Current path: ${process.cwd()}\n`);
    console.info(`   ┌ Total times GRPP Update executed: ${grppSettings.runCounter}`);
    console.info(`   ├ Total GRPP Update runtime: ${converMsToHHMMSS(grppSettings.updateRuntime)} [${grppSettings.updateRuntime} ms]`);
    console.info(`   ├ Last time GRPP Update was executed: ${grppSettings.lastRun}`);
    console.info(`   └ Total repos preserved: ${grppSettings.repoEntries.length}\n`);
}

/**
    * Display main logo
*/
export function grpp_displayMainLogo(){
    console.clear();
    console.info("\n   <=============================================================>");
    console.info("   <=|          Git Repo Preservation Project (GRPP)           |=>");
    console.info("   <=|     Created by Juliana (@julianaheartz.bsky.social)     |=>");
    console.info("   <=============================================================>");
    console.info("   <=|             A classic quote from an old one:            |=>");
    console.info("   <=|                   \"Quem guarda, \x1b[1;32mt\x1b[1;33me\x1b[1;34mm\x1b[0m!\"                   |=>");
    console.info("   <=============================================================>\n");
}

/**
    * Display help menu
*/
export function grpp_displayHelp(){
    console.info("   <=============================================================>");
    console.info('   <=|        Here is a list of all available commands:        |=>');
    console.info("   <=============================================================>\n");
    Object.keys(grpp_flagList).forEach(function(currentFlag:any){
        console.info(`──┬── ${currentFlag}\n  └── ${grpp_flagList[currentFlag]}\n`);
    });
}

/**
    * Prevent number being lower than a specified value
    * @param num [number] input number
    * @param min [number] minimum value
    * @param max [number] maximum value
    * @returns fixed number 
*/
export function preventMinMax(num:number, min:number = 0, max:number = 1):number {

    // Declare vars and check num value
    var res:number = min;
    if (num < min){
        num = min;
    }
    if (num > max){
        num = max;
    }

    // Return value
    return res;

}

/**
	* Convert array to string, replacing comma with defined value (default: break line)
	* @param str - array to be converted
	* @param rep - values to be instead of comma
	* @returns string converted from array
*/
export function convertArrayToString(str:string[], rep:string = '\n'):string {
	return str.toString().replace(RegExp(',', 'gi'), rep);
}

/**
	* Execute reasonList check
	* @param reasonList list with reasons to not continue
	* @param warnMsg Base warn message informing that was unable to proceed
	* @param action function to be executed if reasonList is empty
*/
export function execReasonListCheck(reasonList:string[], warnMsg:string, action:Function, onError:Function = function(){return;}) {

	// Check if can execute action
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
export async function checkConnection() {
    return new Promise(function(resolve, reject){
        module_dns.lookup(grppSettings.connectionTestURL, function(err, address){
            if (err){
                reject(err);
            };
            resolve(address);
        });
    });
};

/**
    * Run external commands
    * @param cmd [string] command to be executed
    * @param chdir [string] chdir where commands will be executed
    * @param postAction [Function] function to be executed after process exit
*/
export function runExternalCommand(cmd:string, chdir:string = process.cwd(), postAction:Function){

    // Change current working directory and declare some vars
    process.chdir(chdir);
    const
        originalCwd = structuredClone(process.cwd()),
        execCmd = module_childProcess.exec(cmd);

    // Print data
    execCmd.stderr?.on('data', function(data){
        console.info(data);
    });
    execCmd.stdout?.on('data', function(data){
        console.info(data);
    });

    // Execute actions after closing process
    execCmd.on('exit', function(){
        process.chdir(originalCwd);
        postAction();
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

// Export module
export * from './utils';