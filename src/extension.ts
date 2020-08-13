"use strict";

import * as vscode from "vscode";


const path = require("path");
var fs = require("fs");
import { FileExplorer, FileSystemProvider } from "./fileExplorer";

export async function activate(context: vscode.ExtensionContext) {
  
  
  let fileExplorer = new FileExplorer(context);
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "view-git-branch-merged.refresh",
      async () => {
        fileExplorer.createTreeView(context)
        fileExplorer.createTreeView2(context)
      }
    ),
    vscode.commands.registerCommand(
      "view-git-branch-merged.stash",
      async () => {
        var t = vscode.window.createTerminal("view-git-branch-merged")
        t.sendText(`git stash`,false)
        t.show(true)
      }
    ),
    vscode.commands.registerCommand(
      "view-git-branch-merged.stashPop",
      async () => {
        var t = vscode.window.createTerminal("view-git-branch-merged")
        t.sendText(`git stash pop`,false)
        t.show(true)
      }
    ),
    vscode.commands.registerCommand(
      "view-git-branch-merged.copyBranchName",
      async (e,r) => {
        
        vscode.env.clipboard.writeText(e.branch)
      }
    ),
    vscode.commands.registerCommand(
      "view-git-branch-merged.branchToMaster",
      async (e) => {
        var t = vscode.window.createTerminal("view-git-branch-merged")
        t.sendText(`git merge ${e.branch}`,false)
        t.show(true)
      }
    ),
    vscode.commands.registerCommand(
      "view-git-branch-merged.masterToBranch",
      async (e) => {
        var t = vscode.window.createTerminal("view-git-branch-merged")
        t.sendText(`git merge master`,false)
        t.show(true)
      }
    ),
    vscode.commands.registerCommand(
      "view-git-branch-merged.checkoutToBranch",
      async (e) => {
        var t = vscode.window.createTerminal("view-git-branch-merged")
        t.sendText(`git checkout ${e.branch}`,true)
        t.show(true)
      }
    ),
    vscode.commands.registerCommand(
      "view-git-branch-merged.deleteBranch",
      async (e) => {
        var t = vscode.window.createTerminal("view-git-branch-merged delete")
        t.sendText(`git branch -D ${e.branch}`,false)
        t.show(true)
      }
    )
    
  );
}
