"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exec = require('child_process').exec;
exports.execCommand = (commandName) => {
    return new Promise((resolve) => {
        let process = exec(commandName);
        process.on('close', (status) => {
            if (status === 0) {
                resolve();
            }
            else {
                resolve('[Git clone] failed with status ' + status);
            }
        });
    });
};