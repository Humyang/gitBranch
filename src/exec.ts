import * as vscode from 'vscode';
const { execFile } = require('child_process');

import { GitExtension } from './git.d';

// let gitExtension = null

// let git = null


export const gitExec = async function(arg) {
  const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')
  .exports;
  const git = gitExtension.getAPI(1);
  // git.
  let path = await git.git.path;
  let respositories = await git.repositories;
  var preArgs = [`-C`, `${respositories[0].rootUri.fsPath}`];
  let c = preArgs;
  if (arg) {
    c = preArgs.concat(arg);
  }
  return new Promise((reslove, reject) => {
    execFile(path, c, function(error, stdout, stderr) {
      if (error) {
        reject(error);
      }
      reslove(stdout);
    });
  });
};

// async function execFile()
