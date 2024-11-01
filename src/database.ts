/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    database.ts
*/

/*
    Interfaces
*/

// GRPP Repo Entry
export interface grppRepoEntry {
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
    runners:number,
    lastRun:string,
    maxPages:number,
    runCounter:number,
    updateRuntime:number,
    connectionTestURL:string,
    repoEntries:grppRepoEntry[]
}

/*
    Defaults
*/

// Default settings file
export const grppSettingsFile_Defaults:Pick <grppSettingsFile, 'lastRun' | 'repoEntries' | 'runCounter' | 'runners' | 'maxPages' | 'connectionTestURL' | 'updateRuntime'> = {
    runners: 1,
    maxPages: 5,
    runCounter: 0,
    repoEntries: [],
    lastRun: 'Never',
    updateRuntime: 0,
    connectionTestURL: '1.1.1.1'
}

/*
    Variables
*/

// Help menu
export const grpp_flagList:any = {

    '--help': `Display this menu.`,
    '--startUpdate': `Start GRPP update process.`,
    '--status': `Display GRPP status from a initialized dir.`,

    '--path=[PATH]': `Set current working directory.`,
    '--init=[PATH]': `Set a location where GRPP will initialize and backup your repos. You can also just use \"--init\" to initialize where you currently are!`,
    '--setMaxRunners=[NUMBER]': `Set how many instances will be running on GRPP processes. (Default: ${grppSettingsFile_Defaults.runCounter})`,
    '--setMaxFetchPages=[NUMBER]': `Set maximum of pages GRPP will fetch from remote on get user repos process. (Default: ${grppSettingsFile_Defaults.maxPages})`,
    '--setConnectionTestURL=[URL]': `Set URL which GRPP will use to test internet connection. (Default: ${grppSettingsFile_Defaults.connectionTestURL})`,
    '--getUserRepos=[USERNAME]': `Set a username to GRPP seek all repos available.`,
    '--import=[GIT_URL]': `Imports a git repository to database.`,
    '--importList=[PATH]': `Import a list of git repositories from a text file.`

};

// Export module
export * from './database';