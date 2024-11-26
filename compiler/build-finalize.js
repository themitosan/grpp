/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    build-finalize.js
*/

/**
    * Start process
*/
function start(){

    // Declare consts
    const
        module_fs = require('fs'),
        packageJson = require('../package.json');

    // Read file and create main comment
    var grppFile = module_fs.readFileSync('Build/grpp.js', 'utf-8');
    grppFile = `#!/usr/bin/env node
/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    Version: ${packageJson.version}
    Compiled at ${new Date().toString()}

    A classic quote from an old one: "Quem guarda, tem!"
*/\n${grppFile}`;

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
    module_fs.writeFileSync('Build/grpp.js', grppFile, 'utf-8');
    module_fs.writeFileSync('Build/package.json', JSON.stringify(packageJson), 'utf-8');

}

// Start process
start();