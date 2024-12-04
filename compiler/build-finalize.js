/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    build-finalize.js
*/

/**
    * Main function
*/
function main(){

    // Declare modules
    const
        module_fs = require('fs'),
        module_path = require('path'),
        packageJson = require('../package.json');

    // Declare vars
    var langList = [],
        currentHash = 'DIRTY',
        tempScript = module_fs.readFileSync('Build/grpp.js', 'utf-8');
        
    // Get build hash
    process.argv.forEach(function(cArg){
        if (cArg.indexOf('--sha=') !== -1) currentHash = cArg.replace('--sha=', '').slice(0, 6);
    });
    if (currentHash.length === 0) currentHash = 'DIRTY';

    // Update script build info
    const replaceList = {
        '[APP_HASH]': currentHash,
        '[APP_VERSION]': packageJson.version,
        '[APP_BUILD_DATE]': new Date().toString()
    };
    Object.keys(replaceList).forEach(function(currentKey){
        tempScript = tempScript.replaceAll(currentKey, replaceList[currentKey]);
    });

    // Final script
    const grppScript = `#!/usr/bin/env node
/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    Version: ${packageJson.version} [${currentHash}]
    Compiled at ${new Date().toString()}

    A classic quote from an old one: \"Quem guarda, tem!\"
*/\n${tempScript}`;

    // Strip non-required keys from package.json
    [
        'main',
        'bugs',
        'files',
        'scripts',
        'devDependencies',
    ].forEach(function(currentKey){
        delete packageJson[currentKey];
    });

    // Write files
    module_fs.writeFileSync('Build/grpp.js', grppScript, 'utf-8');
    module_fs.writeFileSync('Build/package.json', JSON.stringify(packageJson), 'utf-8');

    // Process lang files
    console.info(`\nINFO - Copying minified lang files...`);
    module_fs.readdirSync('Lang').forEach(function(currentFile){
        if (module_path.parse(`Lang/${currentFile}`).ext.toLowerCase() === '.json') langList.push(currentFile);
    });
    langList.forEach(function(path){
        module_fs.writeFileSync(`Build/Lang/${path}`, JSON.stringify(JSON.parse(module_fs.readFileSync(`Lang/${path}`, 'utf-8'))), 'utf-8');
    });

}

// Start main function
main();