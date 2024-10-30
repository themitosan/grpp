/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    main.ts
*/

/*
    Import TS module
*/

import { grpp_initPath } from "./init";
import { grppSettingsFile, grppSettingsFile_Defaults } from "./database";

/*
    Variables
*/

// App settings
export const grppSettings:grppSettingsFile = { ...grppSettingsFile_Defaults };

/*
    Functions
*/

/**
    * Display main logo 
*/
function showMainLogo(){
    console.info("\n   <============================================================>");
    console.info("   <==          Git Repo Preservation Project (GRPP)          ==>");
    console.info("   <==     Created by Juliana (@julianaheartz.bsky.social)    ==>");
    console.info("   <============================================================>");
    console.info("   <==             A classic quote from an old one:           ==>");
    console.info("   <==                   \"Quem guarda, \x1b[1;32mt\x1b[1;33me\x1b[1;34mm\x1b[0m!\"                  ==>");
    console.info("   <============================================================>\n");
}

/**
    * Start main app
*/
function startApp(){

    // Clear console and display main logo
    console.clear();
    showMainLogo();

    // Process run flags
    for (var i = 0; i < process.argv.length; i++){
        const currentFlag = process.argv[i];

        /*
            Settings
        */

        // Set max runners
        if (currentFlag.indexOf('--runners=') !== -1){
            grppSettings.runners = Number(currentFlag.replace('--runners=', ''));
            if (grppSettings.runners < 1){
                grppSettings.runners = 1;
            }
        }

        /*
            Functions
        */

        // Check if is init
        if (currentFlag.indexOf('--init=') !== -1){
            grpp_initPath(currentFlag.replace('--init=', ''));
            break;
        }
        if (currentFlag.indexOf('--init') !== -1){
            grpp_initPath();
            break;
        }

    }

    // If no args were provided
    if (process.argv.length < 3){
        console.info("   <============================================================>");
        console.info("     ...Since no args were provided, We wish you a great day! <3");
        console.info("   <============================================================>\n");
    }

}

// Start GRPP
startApp();