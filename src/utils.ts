/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    utils.ts
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

// Export module
export * from './utils';