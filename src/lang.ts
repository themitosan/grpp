/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    lang.ts
*/

/*
    Import TS modules
*/

import { grppUserSettings } from './main';

/*
    Require node modules
*/

import * as module_fs from 'fs';
import * as module_childProcess from 'child_process';

/*
    Variables
*/

// Lang database
export var langDatabase:any = {

    // Common strings
    common: {

        // This is the char used to confirm actions. Change it in order to confirm current action!
        confirmChar: 'y',

        errorBatchUpdateRunning: 'You can\'t execute this action while GRPP update is running!'

    },

    // main.ts
    main: {

        // Warnings
        warnPathNotInit: `WARN - Unable to load settings because this location isn\'t initialized! GRPP will initialize this folder before moving on...`,

        version: 'Version: %VAR_0% [%VAR_1%]\nCompiled at %VAR_2%\n',

        // Misc. strings
        knowMore: `==> Use \"--help\" for more details.\n`,
        noArgsProvided: `==> Since no args / flags were provided, We wish someone called %VAR_0% a great day! <3\n`

    },

    // getReposFrom.ts
    getReposFrom: {

        errorUnableSeekUserRepos: 'ERROR - Unable to seek repos!\nReason: %VAR_0%',
        errorUnableSeekUserRepos_noUserName: 'You must provide a username!',

        questionReposHost: 'Please specify where \"%VAR_0%\" repos are hosted:\n\n    1) GitHub (default)\n    2) GitLab\n    3) Gitea based server\n\nAnswer: ',
        questionGiteaUrl: '\nPlease, insert base domain where gitea server is hosted (Example: \"192.168.1.150:3000\")\nURL: ',

        errorNoReposAvailable: 'No repos available for this user.',
        errorFetchNotOk: 'ERROR - Unable to fetch repo data!\nReason: %VAR_0% [Status: %VAR_1%]',

        infoFetchUrl: 'INFO - Fetching URL: %VAR_0%',

        questionFetchRepoList: 'INFO - GRPP managed to find %VAR_0% repos. Here is the full list:\n\n%VAR_1%\n\nHere is what you can do:\n\n    1) Import all repos (default)\n    2) Edit current list on text editor (%VAR_2%)\n    3) Save repo list on a file to import later\n    4) Cancel\n\nYour choice: ',
        saveFileImportLater: 'INFO - Process Complete!\nFile path: %VAR_0%/grpp_fetch_res.txt\n\nTo import repos from a file, use the following flag: \"--importList=PATH_TO_FILE\"\n'

    },

    // import.ts
    import: {

        // Clone process
        startCloneProcess: 'INFO - Staring clone process...',
        setGitFetchAllRefs: 'INFO - Setting git config remote to fetch all refs from origin...',
        setPathSafe: 'INFO - GRPP will set %VAR_0% path as safe...',
        cloneProcessComplete: '\nINFO - Process complete!\nRepo name: %VAR_0%\nPath: %VAR_1%\n',

        // Batch import
        batchCurrentRepo: 'INFO - [%VAR_0% of %VAR_1%] Clonning URL: %VAR_2%',

        // Warnings
        warnUnableCloneRepo: `WARN - Unable to clone repo!\nReason: %VAR_0%\n`,
        warnUnableCloneRepo_noUrl: 'You must provide a git url to import!',
        warnUnableCloneRepo_repoExists: 'This repo already exists on filesystem!\nPath: %VAR_0%',
        warnUnableCloneRepo_updateRunning: 'You can\'t import any repo while GRPP Update Process is running!'

    },

    // utils.ts
    utils: {

        // Show help screen
        help: {

            // Common strings
            welcomeStr: 'Hi %VAR_0% - hopes for a great day!\nAll options displayed below can be triggered by using \"-\", \"--\" or even \"/\" (without quotes).\n\n==> Function list:\n',
            optionStr: '==> Options list:\n',
    
            // Help function list
            fnList: {
                help: `Display this menu.`,
                updateAll: `Update all imported repos`,
                status: `Display GRPP status from a initialized dir.`,
                silent: `Only print errors on screen.`,
                saveSettings: `Use this option to update current settings file.\nExample: \"grpp --setConnectionTestURL=1.1.1.1 --saveSettings\" will set main connection test to cloudflare dns and save it to settings file.`,
                exportRemotes: `Export all clone urls from previously imported git repos into a file (grpp_urls.txt)`,
                repair: `This option will fix current database, linking any repo that is not present or removing any repo entry that doesn't exists.`,
                removeAllKeys: 'Add this option allong \"--repair\" flag to automatically remove all missing keys from database.'
            },
    
            // Help option list
            optionList: {
                'init=[PATH]': `Set a location where GRPP will initialize and backup your repos.\nYou can also just use \"--init\" to initialize where you currently are!`,
                'import=[GIT_URL]': `Imports a git repository to database.`,
                'importList=[PATH]': `Import a list of git repositories from a text file.`,
                'path=[PATH]': `Set GRPP current working directory.`,
                'update=[PATH]': `Updates a previously imported repo.`,
                'getReposFrom=[USERNAME]': `Attempts to get all repos from a specified user.`,
                'getRepoData=[PATH]': `Get information about a previously imported repo.`,
                'maxReposPerList=[NUMBER]': `Set how many repos a GRPP Batch Update list should have.`,
                'setStartPage=[NUMBER]': `Set which page GRPP should start fetching user repos from git hosting website.`,
                'setMaxFetchPages=[NUMBER]': `Set maximum of pages GRPP will fetch from remote on get user repos process.`,
                'setConnectionTestURL=[URL]': `Set URL which GRPP will use to test internet connection.`,
                'processBatchFile=[NUMBER]': `Loads and updates all repos from a file created by "--updateAll" option.`,
                'setEditor=[EDITOR]': 'Set which text editor GRPP should use to open text files. (Default: nano)'
            }

        },

        // Get repo info
        getRepoInfo: {

            errorUnableGetRepoInfo: 'ERROR - Unable to get repo info!\nReason: %VAR_0%\n',
            errorUnableGetRepoInfo_pathEmpty: 'You must provide repo path!',
            errorUnableGetRepoInfo_repoNull: 'Unable to find repo: %VAR_0%',
            errorUnableGetRepoInfo_noReposAvailable: 'You must import any repo before using this option.',

            repoData: '==> Repo data:\n\n%VAR_0%\n'

        },

        exportRemotes: 'INFO - Saving repos URL list...',
        grppStatus: `==> GRPP Status:
    Current path: %VAR_0%\n
──┬ GRPP update run conter: %VAR_1%
  ├ Last GRPP update run: %VAR_2%
  ├ GRPP update runtime: %VAR_3% [%VAR_4% ms]
  ├ Repos preserved: %VAR_5%
  └ Disabled repos: %VAR_6% [%VAR_7% will be queued on batch update]\n`

    },

    // repair.ts
    repair: {

        warnUnablePerformRepair: 'WARN - Unable to perform repair!\nReason: %VAR_0%',

        infoCheckDatabaseFiles: 'INFO - Checking database files...',

        databaseLengthMismatch: 'WARN - Repo counter mismatch! [%VAR_0% on database vs. %VAR_1% found on current scan]\nStarting repair process...\n\n(Depending of how many repos are available, this may take a while!)\n',
        
        importRemoveStatus: '\nINFO - Repair process imported %VAR_0% repos and removed %VAR_1% repos entries with %VAR_2% errors.\n',
        importRemoveError: '==> Import / Remove errors:',
        importRemoveDetails: 'Repo: %VAR_0%\nDetails: %VAR_1%\n',

        infoCheckMissingKeys: 'INFO - Checking missing keys on repos entries...',
        infoAddMissingKey: 'INFO - Adding missing key \"%VAR_0%\" to %VAR_1%...',
        infoRemoveKey: 'INFO - Removing deprecated key from %VAR_0%: %VAR_1%',

        removePathFromKey: 'INFO - Removing path from current repo entry: \"%VAR_0%\"',

        infoAddRemoveKeys: 'INFO - GRPP added %VAR_0% missing keys and removed %VAR_1% deprecated keys on %VAR_2% repos.',

        infoRepairComplete: 'INFO - Repair complete!\n',

        confirmRemoveRepoDatabase: 'WARN - It seems that %VAR_0% does not exists!\nDo you want to remove this entry from database? [Y/n] ',

        warnRepoNotBare: 'WARN - It seems that %VAR_0%.git is not on bare format!',
        importMissingRepo: 'INFO - Importing missing repo: %VAR_0% [%VAR_1%]',

        errorConfigFileNotExists: 'Unable to read data from %VAR_0%.git because config file doesn\'t exists!\nGRPP will remove this repo entry from database...',
        pushErrorWarn: 'WARN - %VAR_0%'

    }

};

/*
    Functions
*/

/**
    * Load user language [WIP]
*/
export async function grpp_loadLang(){

    // Check if needs to change language
    if (grppUserSettings.lang !== 'en-us'){

        // Declare vars, get GRPP global installation path and set user lang 
        var npmGlobalPath = '';
        const childProcess = module_childProcess.exec(`npm root -g`);
        childProcess.stdout!.on('data', function(data){
            npmGlobalPath = data;
        });
        childProcess.on('exit', function(){
            langDatabase = JSON.parse(module_fs.readFileSync(`${npmGlobalPath}/grpp/Lang/${grppUserSettings.lang}.json`, 'utf-8'));
        });

    }

}

/**
    * Convert lang string
    * @param langStr [string] String to be processed
    * @param replaceList [any[]] List of values to be replaced on current string 
*/
export function grpp_convertLangVar(langStr:string, replaceList:any[] = []){
    replaceList.forEach(function(currentVar, currentIndex){
        langStr = langStr.replaceAll(`%VAR_${currentIndex}%`, currentVar);
    });
    return langStr;
}

// Export module
export * from './lang';