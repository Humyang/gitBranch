"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
exports.workspaceCheck = () => {
    const foldes = vscode.workspace.workspaceFolders;
    if (!foldes) {
        vscode
            .window
            .showErrorMessage("please create a workspace first!");
        return;
    }
    return foldes[0].uri.fsPath;
};
//# sourceMappingURL=workspace.js.map