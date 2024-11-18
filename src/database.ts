/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    database.ts
*/

/*
    Require node modules
*/

import * as module_os from 'os';

/*
    Variables
*/

/*
    Console text style database
    Source code: https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
*/
export const consoleTextStyle = {
    'reset': "\x1b[0m",
    'bright': "\x1b[1m",
    'dim': "\x1b[2m",
    'underline': "\x1b[4m",
    'blink': "\x1b[5m",
    'reverse': "\x1b[7m",
    'hidden': "\x1b[8m",
    'fgBlack': "\x1b[30m",
    'fgRed': "\x1b[31m",
    'fgGreen': "\x1b[32m",
    'fgYellow': "\x1b[33m",
    'fgBlue': "\x1b[34m",
    'fgMagenta': "\x1b[35m",
    'fgCyan': "\x1b[36m",
    'fgWhite': "\x1b[37m",
    'fgGray': "\x1b[90m",
    'bgBlack': "\x1b[40m",
    'bgRed': "\x1b[41m",
    'bgGreen': "\x1b[42m",
    'bgYellow': "\x1b[43m",
    'bgBlue': "\x1b[44m",
    'bgMagenta': "\x1b[45m",
    'bgCyan': "\x1b[46m",
    'bgWhite': "\x1b[47m",
    'bgGray': "\x1b[100m"
};

// GRPP function list
export const grpp_commandList:any = {
    'help': `Display this menu. (Hello ${module_os.userInfo().username}! <3)`,
    'updateAll': `Update all imported repos`,
    'status': `Display GRPP status from a initialized dir.`,
    'silent': `Only print errors on screen.`,
    'saveSettings': `Use this option to update current settings file.\nExample: \"grpp setConnectionTestURL=8.8.8.8 saveSettings\" will set main connection test to google dns and save it to settings file.`,
    'repair': `This option will fix current database, linking any repo that is not present or removing any repo entry that doesn't exists.`,
    'exportRemotes': `Export all clone urls from previously imported git repos into a file (grpp_urls.txt)`
};

// GRPP option list
export const grpp_optionList:any = {
    'init=[PATH]': `Set a location where GRPP will initialize and backup your repos.\nYou can also just use \"init\" to initialize where you currently are!`,
    'import=[GIT_URL]': `Imports a git repository to database.`,
    'importList=[PATH]': `Import a list of git repositories from a text file.`,
    'path=[PATH]': `Set GRPP current working directory.`,
    'update=[PATH]': `Updates a previously imported repo.`,
    'getReposFrom=[USERNAME]': `Set a username to GRPP seek all repos available.`,
    'getRepoData=[PATH]': `Get information about a previously imported repo.`,
    'maxReposPerList=[NUMBER]': `Set how many repos a GRPP Batch Update list should have.`,
    'setStartPage=[NUMBER]': `Set which page GRPP should start fetching user repos from git hosting website.`,
    'setMaxFetchPages=[NUMBER]': `Set maximum of pages GRPP will fetch from remote on get user repos process.`,
    'setConnectionTestURL=[URL]': `Set URL which GRPP will use to test internet connection.`,
    'processBatchFile=[NUMBER]': `Loads and updates all repos from a file created by "updateAll" process.`
};

// Export module
export * from './database';