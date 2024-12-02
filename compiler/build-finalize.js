/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    build-finalize.js
*/

/**
    * Main function
*/
function main(){

    // Declare consts
    const
        module_fs = require('fs'),
        packageJson = require('../package.json');

    // Get build hash
    var currentHash = 'DIRTY';
    process.argv.forEach(function(cArg){
        if (cArg.indexOf('--sha=') !== -1) currentHash = cArg.replace('--sha=', '').slice(0, 6);
    });
    if (currentHash.length === 0) currentHash = 'DIRTY';

    // Create final script
    const grppScript = `#!/usr/bin/env node
/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    Version: ${packageJson.version} [${currentHash}]
    Compiled at ${new Date().toString()}

    A classic quote from an old one: \"Quem guarda, tem!\"
*/\n${module_fs.readFileSync('Build/grpp.js', 'utf-8')}`;

    // Strip non-required keys from package.json
    [
        'main',
        'bugs',
        'scripts',
        'devDependencies',
    ].forEach(function(currentKey){
        delete packageJson[currentKey];
    });

    // Write files
    module_fs.writeFileSync('Build/grpp.js', grppScript, 'utf-8');
    module_fs.writeFileSync('Build/package.json', JSON.stringify(packageJson), 'utf-8');

}

// Start main function
main();