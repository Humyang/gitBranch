import * as vscode from "vscode";
const { execFile } = require('child_process');

import {GitExtension} from "./git.d"


export const gitExec = async function(arg){
  const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git').exports;
  let path = await gitExtension.getGitPath()
  let respositories = await gitExtension.getRepositories()
  var preArgs = [
    `--git-dir=${respositories[0].rootUri.fsPath}/.git/`
  ];
  let c = preArgs;
    if (arg) {
      c = preArgs.concat(arg);
    }
  return new Promise((reslove,reject)=>{
    execFile(path,c,function(error, stdout, stderr){
      if (error) {
        reject(error)
      }
      reslove(stdout)
    })
  })
}

// async function execFile()