const webpack = require('webpack');
const path = require('path');
var nodeExternals = require('webpack-node-externals');

let config = {
    entry: {
        app: './app.js',
        sockJS: './notifier/sockJS.js'
    },
    target: 'node', // in order to ignore built-in modules like path, fs, etc. 
    //externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                  presets: ['env']
                }
              }
        }]
    }
}

module.exports = config;