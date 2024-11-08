/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    database.ts
*/

/*
    Require node modules
*/

import * as module_os from 'os';

/*
    Variables
*/

// Command list
export const grpp_commandList:any = {
    '--help': `Display this menu. (Hello ${module_os.userInfo().username}! <3)`,
    '--updateAll': `Update all imported repos`,
    '--status': `Display GRPP status from a initialized dir.`,
    '--silent': `Only print errors on screen.`,
    '--saveSettings': `Use this option to update current settings file.\nExample: \"node grpp.js --setConnectionTestURL=8.8.8.8 --saveSettings\" will set main connection test to google dns and save it to settings file.`,
    '--repairDatabase': `This option will fix current database, linking any repo that is not present or removing any repo entry that doesn't exists.`
};

// Option list
export const grpp_optionList:any = {
    '--init=[PATH]': `Set a location where GRPP will initialize and backup your repos.\nYou can also just use \"--init\" to initialize where you currently are!`,
    '--import=[GIT_URL]': `Imports a git repository to database.`,
    '--importList=[PATH]': `Import a list of git repositories from a text file.`,
    '--path=[PATH]': `Set GRPP current working directory.`,
    '--update=[PATH]': `Updates a previously imported repo.`,
    '--getUserRepos=[USERNAME]': `Set a username to GRPP seek all repos available.`,
    '--getRepoData=[PATH]': `Get information about a previously imported repo.`,
    '--threads=[NUMBER]': `Set how many instances will be running on GRPP Batch Update process.`,
    '--setStartPage=[NUMBER]': `Set which page GRPP should start fetching user repos from git hosting website.`,
    '--setMaxFetchPages=[NUMBER]': `Set maximum of pages GRPP will fetch from remote on get user repos process.`,
    '--setConnectionTestURL=[URL]': `Set URL which GRPP will use to test internet connection.`,
    '--processBatchFile=[NUMBER]': `Loads and updates all repos from a file created by "--updateAll" process.`
};

// Export module
export * from './database';