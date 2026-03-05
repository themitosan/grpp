/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    recover.ts
*/

/*
    Require TS modules
*/

import { grpp_printStatus } from './utils';
import { grpp_convertLangVar, langDatabase } from './lang';
import { createLogEntry, execReasonListCheck, getDirTree, parseINI } from './tools';
import { grpp_initPath, grppSettingsFile, grppSettingsFile_Defaults } from './main';

/*
    Import node modules
*/

import * as module_fs from 'fs';

/*
    Functions
*/

/**
    * Check if there's a GRPP instance on current path and try to create a grpp settings file for it
*/
export function grpp_recover(){

    // Create reasonList var and check if can start seeking for git repos
    var reasonList:string[] = [];
    if (getDirTree(process.cwd()).length === 0) reasonList.push(langDatabase.recover.error.unableRecover_pathEmpty);
    if (checkIfReposDirExists() === !1) reasonList.push(langDatabase.recover.error.unableRecover_reposFolderNotFound);
    if (module_fs.existsSync(`${process.cwd()}/grpp_settings.json`) === !0) reasonList.push(langDatabase.recover.error.unableRecover_settingsExists);

    execReasonListCheck(reasonList, langDatabase.recover.error.unableRecover, function(){

        // Get all available git repos
        var availableGitRepos:string[] = [];
        getDirTree(`${process.cwd()}/repos`).forEach(function(currentEntry){
            if (currentEntry.slice((currentEntry.length - 4), currentEntry.length).toLowerCase() === '.git' && availableGitRepos.indexOf(currentEntry) === -1) availableGitRepos.push(currentEntry);
        });

        // Check if GRPP found any repository on current location - if not, just initialize current folder
        if (availableGitRepos.length === 0) reasonList.push(langDatabase.recover.error.unableRecover_noReposFound);
        execReasonListCheck(reasonList, langDatabase.recover.error.unableRecover, function(){

            // Create new settings file consts and start processing git repo list
            const
                currentDate = new Date(),
                newSettingsFile:grppSettingsFile = { ...grppSettingsFile_Defaults };

            var currentSettings:any,
                currentRemote:any = '',
                currentUrlData:string[] = [];

            availableGitRepos.forEach(function(currentGitPath){
                
                currentSettings = parseINI(module_fs.readFileSync(`${currentGitPath}/config`, 'utf-8'));
                for (var i = 0; i < Object.keys(currentSettings).length; i++){
                    if (Object.keys(currentSettings)[i].indexOf('remote') !== -1){
                        currentRemote = Object.keys(currentSettings)[i];
                        break;
                    }
                }

                currentUrlData = currentSettings[currentRemote].url.split('/');
                newSettingsFile.repoEntries[currentSettings[currentRemote].url.replace('https://', '').replace('http://', '')] = {
                    url: currentSettings[currentRemote].url,
                    name: currentUrlData[currentUrlData.length - 1],
                    owner: currentUrlData[currentUrlData.length - 2],
                    canUpdate: !0,
                    isPriority: !1,
                    lastUpdatedOn: 'Never',
                    importDate: currentDate.toString()
                };

            });

            module_fs.writeFileSync('grpp_settings.json', JSON.stringify(newSettingsFile));
            createLogEntry(grpp_convertLangVar(langDatabase.recover.processComplete, [availableGitRepos.length]));

        }, grpp_initPath);

    });

}

/**
    * Check if repos folder exists on current file dir
    * @returns [boolean] if found repos dir 
*/
function checkIfReposDirExists(){

    var foundDir:boolean = !1;
    const folderStructure = getDirTree(process.cwd(), 'repos')

    for (var i = 0; i < folderStructure.length; i++){
        if (folderStructure[i].replace(`${process.cwd()}/`, '') === 'repos'){
            foundDir = !0;
            break;
        }
    }

    return foundDir;

}

// Export module
export * from './recover';