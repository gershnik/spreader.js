#! /usr/bin/env node

// Copyright (c) 2022, Eugene Gershnik
// SPDX-License-Identifier: BSD-3-Clause

const path = require('path');
const { spawn } = require('node:child_process');

testsPath = path.join(__dirname, 'code/wrappers/javascript/test')

function run(cmd, args) {
    return new Promise(function (resolve, reject) {
        const process = spawn(cmd, args, { stdio: 'inherit' });
        process.on('close', function (code) { 
            resolve(code);
        });
        process.on('error', function (err) {
            reject(err);
        });
    });
}

const buildDir = path.join(__dirname, 'cmake-build');

(() => {
    return run('cmake', ['--build', buildDir, '--target', 'spreader.js' ]);
})().then(exitCode => {
    if (exitCode != 0)
        process.exit(1)   
    return run('cmake', ['--install', buildDir]);
}).then(exitCode => {
    if (exitCode != 0)
        process.exit(1)
    return run('cmake', ['--build', buildDir, '--target', 'run-spreader.js-test' ]);
}).then(exitCode => {
    if (exitCode != 0)
        process.exit(1)   
}).catch(ex => {
    console.log(ex)
    process.exit(1)
});
