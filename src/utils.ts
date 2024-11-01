/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    utils.ts

    Some functions from this file were ported from TMS Engine
*/

/*
    Require node modules
*/

import * as module_dns from 'dns';
import { grppSettings } from './main';

/*
    Functions
*/

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
export function execReasonListCheck(reasonList:string[], warnMsg:string, action:Function) {

	// Check if can execute action
	if (reasonList.length === 0){
		return action();
	} else {
        throw warnMsg;
	}

}

/**
    * Check web connection
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

// Export module
export * from './utils';