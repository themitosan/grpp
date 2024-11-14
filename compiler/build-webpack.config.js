/*
    Git repo preservation project (GRPP)
    Created by TheMitoSan (@themitosan.bsky.social)

    build-webpack.config.js

    I'm still MAD that I need to run this shit to make everything work as it should!
*/

const path = require('path');
module.exports = {
    mode: 'production',
    entry: './src/main.ts',
    externalsPresets: { node: !0 },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/
            }
        ]
    },
    output: {
        filename: 'grpp.js',
        path: path.resolve(__dirname, '../Build/')
    }
};