/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    build-minify.js
*/

// Main function
function main(){

    // Get modules
    const
        module_fs = require('fs'),
        packageLock = require('../Build/package-lock.json');

    // Write minified package-lock.json
    module_fs.writeFileSync('../Build/package-lock.json', JSON.stringify(packageLock), 'utf-8');

}

// Start main function
main();