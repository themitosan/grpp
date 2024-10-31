/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    utils.ts

    Some functions from this file were ported from TMS Engine
*/

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
	* @param langError string from langDatabase with main warn message
	* @param action function to be executed can execute
*/
export function execReasonListCheck(reasonList:string[], langError:string, action:Function) {

	// Check if can execute action
	if (reasonList.length === 0){
		return action();
	} else {
        throw langError;
	}

}

// Export module
export * from './utils';