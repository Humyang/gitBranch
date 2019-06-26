"use strict";

import * as vscode from "vscode";


const path = require("path");
var fs = require("fs");
import { FileExplorer, FileSystemProvider } from "./fileExplorer";

export async function activate(context: vscode.ExtensionContext) {
  
  
  let fileExplorer = new FileExplorer(context);
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "gitBranch.helloWorld",
      async () => {
        fileExplorer.createTreeView(context)
      }
    )
  );
}
