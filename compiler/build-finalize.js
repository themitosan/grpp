/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    build-finalize.js
*/

/**
    * Start process
*/
function start(){

    // Declare consts
    const
        time = new Date(),
        module_fs = require('fs'),
        packageJson = require('../package.json');

    // Read file and create main comment
    var grppFile = module_fs.readFileSync('Build/grpp.js', 'utf-8');
    grppFile = `#!/usr/bin/env node
/*
    Git repo preservation project (GRPP)
    Created by Juliana (@julianaheartz.bsky.social)

    Version: ${packageJson.version}
    Compiled at ${time.toString()}

    A classic quote from an old one: "Quem guarda, tem!"
*/\n${grppFile}`;

    // Write file
    module_fs.writeFileSync('Build/grpp.js', grppFile, 'utf-8');

}

// Start process
start();