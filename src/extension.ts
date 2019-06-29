"use strict";

import * as vscode from "vscode";


const path = require("path");
var fs = require("fs");
import { FileExplorer, FileSystemProvider } from "./fileExplorer";

export async function activate(context: vscode.ExtensionContext) {
  
  
  let fileExplorer = new FileExplorer(context);
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "gitBranch.refresh",
      async () => {
        fileExplorer.createTreeView(context)
      }
    ),
    vscode.commands.registerCommand(
      "gitBranch.copyBranchName",
      async (e,r) => {
        
        vscode.env.clipboard.writeText(e.branch)
      }
    ),
    vscode.commands.registerCommand(
      "gitBranch.branchToMaster",
      async (e) => {
        var t = vscode.window.createTerminal("gitBranch")
        t.sendText(`git merge ${e.branch}`,false)
        t.show(true)
      }
    ),
    vscode.commands.registerCommand(
      "gitBranch.masterToBranch",
      async (e) => {
        var t = vscode.window.createTerminal("gitBranch")
        t.sendText(`git merge master`,false)
        t.show(true)
      }
    ),
    vscode.commands.registerCommand(
      "gitBranch.checkoutToBranch",
      async (e) => {
        var t = vscode.window.createTerminal("gitBranch")
        t.sendText(`git checkout ${e.branch}`,true)
        t.show(true)
      }
    ),
    vscode.commands.registerCommand(
      "gitBranch.deleteBranch",
      async (e) => {
        var t = vscode.window.createTerminal("gitBranch delete")
        t.sendText(`git branch -D ${e.branch}`,false)
        t.show(true)
      }
    )
    
  );
}
