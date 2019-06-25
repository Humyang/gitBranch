"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const path = require("path");
const fs = require("fs");
const cmd_1 = require("./cmd");
const util = require("util");
exports.pullProject = (url, workspace) => __awaiter(this, void 0, void 0, function* () {
    try {
        let result = yield cmd_1.execCommand(`git clone ${url} ${workspace}`);
        if (result) {
            yield vscode_1.window.showErrorMessage(result);
            return;
        }
    }
    catch (error) {
        yield vscode_1.window.showErrorMessage(`${error}`);
        return;
    }
    yield vscode_1.window.showInformationMessage('Project  initialized successed!!');
});
exports.mkDirByPathSync = (targetDir, { isRelativeToScript = false } = {}) => {
    const sep = path.sep;
    const initDir = path.isAbsolute(targetDir)
        ? sep
        : "";
    const baseDir = isRelativeToScript
        ? __dirname
        : ".";
    return targetDir
        .split(sep)
        .reduce((parentDir, childDir) => {
        const curDir = path.resolve(baseDir, parentDir, childDir);
        try {
            fs.mkdirSync(curDir);
        }
        catch (err) {
            if (err.code === "EEXIST") {
                // curDir already exists!
                return curDir;
            }
            if (err.code === "ENOENT") {
                // Throw the original parentDir error on curDir `ENOENT` failure.
                throw new Error(`EACCES: permission denied, mkdir '${parentDir}'`);
            }
            const caughtErr = ["EACCES", "EPERM", "EISDIR"].indexOf(err.code) > -1;
            if (!caughtErr || (caughtErr && targetDir === curDir)) {
                throw err; // Throw if it's just the last created dir.
            }
        }
        return curDir;
    }, initDir);
};
exports.writeTpl = util.promisify(fs.writeFile);
exports.appendText = util.promisify(fs.appendFile);
exports.exists = util.promisify(fs.exists);
//# sourceMappingURL=fs-extra.js.map