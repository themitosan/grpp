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
    updateCounter:number,
    lastUpdatedOn:string
}

// GRPP Settings file
export interface grppSettingsFile {
    runners:number,
    lastRun:string,
    runCounter:number,
    repoEntries: grppRepoEntry[]
}

/*
    Defaults
*/

// Default settings file
export const grppSettingsFile_Defaults:Pick <grppSettingsFile, 'lastRun' | 'repoEntries' | 'runCounter' | 'runners'> = {
    runners: 1,
    runCounter: 0,
    repoEntries: [],
    lastRun: 'Never'
}

// Export module
export * from './database';