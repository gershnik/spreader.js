#! /usr/bin/env node

// Copyright (c) 2022, Eugene Gershnik
// SPDX-License-Identifier: BSD-3-Clause

const fs = require('fs');
const path = require('path');
const { spawn } = require('node:child_process');

dotEnvFile = path.join(__dirname, '.env')

try {
    const data = fs.readFileSync(dotEnvFile, 'utf8');
    data.split(/\r?\n/).forEach(line =>  {
        line = line.trim()
        if (line.length == 0 || line.match(/.*#/))
            return;
        m = line.match(/\s*([^= \t]+)\s*=\s*([^= \t]+)/)
        if (m) {
            process.env[m[1]] = m[2]
        } else {
            console.warn(`Ignoring invalid line in .env: ${line}`)
        }
    });
} catch (err) {
    ; //ignore
}

if (process.env['EMSCRIPTEN_CMAKE_TOOLCHAIN'] === undefined) {
    console.error('EMSCRIPTEN_CMAKE_TOOLCHAIN variable not defined. \
Either set it up in shell or put it in a .env file')
    process.exit(1)
}

const toolchainFile = process.env['EMSCRIPTEN_CMAKE_TOOLCHAIN'];
const codeDir = path.join(__dirname, 'code');
const buildDir = path.join(__dirname, 'cmake-build');

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

run('cmake', [
    '-S', codeDir, 
    '-B', buildDir,
    `-DCMAKE_TOOLCHAIN_FILE=${toolchainFile}`,
    '-DCMAKE_BUILD_TYPE=Release',
    `-DSPR_JAVASCRIPT_PACKAGE_DIR=${__dirname}`
]).then(exitCode => {
    if (exitCode != 0)
        process.exit(1)
    return run('cmake', ['--build', buildDir, '--target', 'spreader.js' ]);
}).then(exitCode => {
    if (exitCode != 0)
        process.exit(1)
    return run('cmake', ['--install', buildDir]);
}).then(exitCode => {
    if (exitCode != 0)
        process.exit(1)   
}).catch(ex => {
    console.log(ex)
    process.exit(1)
});



