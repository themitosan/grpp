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
    Interfaces
*/

// GRPP Repo Entry
export interface grppRepoEntry {
    hash:string,
    repoUrl:string,
    repoPath:string,
    repoName:string,
    repoOwner:string,
    canUpdate:boolean,
    importDate:string,
    updateCounter:number,
    lastUpdatedOn:string
}

// GRPP Settings file
export interface grppSettingsFile {
    threads:number,
    lastRun:string,
    maxPages:number,
    repoEntries:any,
    runCounter:number,
    userEditor:string,
    updateRuntime:number,
    fetchStartPage:number,
    connectionTestURL:string
}

/*
    Defaults
*/

// Default settings file
export const grppSettingsFile_Defaults:Pick <grppSettingsFile, 'lastRun' | 'repoEntries' | 'runCounter' | 'threads' | 'maxPages' | 'connectionTestURL' | 'updateRuntime' | 'userEditor' | 'fetchStartPage'> = {
    threads: 4,
    maxPages: 5,
    runCounter: 0,
    repoEntries: {},
    lastRun: 'Never',
    updateRuntime: 0,
    fetchStartPage: 1,
    userEditor: 'nano',
    connectionTestURL: '1.1.1.1'
}

/*
    Variables
*/

// Help menu
export const grpp_flagList:any = {

    // Functions
    '--help': `Display this menu. (Hello ${module_os.userInfo().username}! <3)`,
    '--updateAll': `Update all imported repos`,
    '--status': `Display GRPP status from a initialized dir.`,

    // Settings
    '--path=[PATH]': `Set current working directory.`,
    '--init=[PATH]': `Set a location where GRPP will initialize and backup your repos. You can also just use \"--init\" to initialize where you currently are!`,
    '--setMaxRunners=[NUMBER]': `Set how many instances will be running on GRPP processes. (Default: ${grppSettingsFile_Defaults.threads})`,
    '--setStartPage=[NUMBER]': `Set which page GRPP should start fetching user repos from git hosting website.`,
    '--setMaxFetchPages=[NUMBER]': `Set maximum of pages GRPP will fetch from remote on get user repos process. (Default: ${grppSettingsFile_Defaults.maxPages})`,
    '--setConnectionTestURL=[URL]': `Set URL which GRPP will use to test internet connection. (Default: ${grppSettingsFile_Defaults.connectionTestURL})`,
    '--getUserRepos=[USERNAME]': `Set a username to GRPP seek all repos available.`,
    '--getRepoData=[PATH]': `Get information about a previously imported repo.`,
    '--import=[GIT_URL]': `Imports a git repository to database.`,
    '--importList=[PATH]': `Import a list of git repositories from a text file.`,
    '--update=[HASH]': `Updates a previously imported repo.`

};

// Export module
export * from './database';