import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as mkdirp from "mkdirp";
import * as rimraf from "rimraf";

//#region Utilities
// const fs_extra = require("../utils/fs-extra");
// const fs_e = require('fs-extra')
// import * as GitExtension from "./git.d"
// const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git').exports;
// const git = gitExtension.getAPI(1);

// const vscode_helpers = require("vscode-helpers");

import { gitExec } from "./exec";

namespace _ {
  function handleResult<T>(
    resolve: (result: T) => void,
    reject: (error: Error) => void,
    error: Error | null | undefined,
    result: T
  ): void {
    if (error) {
      reject(massageError(error));
    } else {
      resolve(result);
    }
  }

  function massageError(error: Error & { code?: string }): Error {
    if (error.code === "ENOENT") {
      return vscode.FileSystemError.FileNotFound();
    }

    if (error.code === "EISDIR") {
      return vscode.FileSystemError.FileIsADirectory();
    }

    if (error.code === "EEXIST") {
      return vscode.FileSystemError.FileExists();
    }

    if (error.code === "EPERM" || error.code === "EACCESS") {
      return vscode.FileSystemError.NoPermissions();
    }

    return error;
  }

  export function checkCancellation(token: vscode.CancellationToken): void {
    if (token.isCancellationRequested) {
      throw new Error("Operation cancelled");
    }
  }

  export function normalizeNFC(items: string): string;
  export function normalizeNFC(items: string[]): string[];
  export function normalizeNFC(items: string | string[]): string | string[] {
    if (process.platform !== "darwin") {
      return items;
    }

    if (Array.isArray(items)) {
      return items.map(item => item.normalize("NFC"));
    }

    return items.normalize("NFC");
  }

  export function readdir(path: string): Promise<string[]> {
    return new Promise<string[]>((resolve, reject) => {
      fs.readdir(path, (error, children) =>
        handleResult(resolve, reject, error, normalizeNFC(children))
      );
    });
  }

  export function stat(path: string): Promise<fs.Stats> {
    return new Promise<fs.Stats>((resolve, reject) => {
      fs.stat(path, (error, stat) =>
        handleResult(resolve, reject, error, stat)
      );
    });
  }

  export function readfile(path: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      fs.readFile(path, (error, buffer) =>
        handleResult(resolve, reject, error, buffer)
      );
    });
  }

  export function writefile(path: string, content: Buffer): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.writeFile(path, content, error =>
        handleResult(resolve, reject, error, void 0)
      );
    });
  }

  export function exists(path: string): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
      fs.exists(path, exists => handleResult(resolve, reject, null, exists));
    });
  }

  export function rmrf(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      rimraf(path, error => handleResult(resolve, reject, error, void 0));
    });
  }

  export function mkdir(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      mkdirp(path, error => handleResult(resolve, reject, error, void 0));
    });
  }

  export function rename(oldPath: string, newPath: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.rename(oldPath, newPath, error =>
        handleResult(resolve, reject, error, void 0)
      );
    });
  }

  export function unlink(path: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      fs.unlink(path, error => handleResult(resolve, reject, error, void 0));
    });
  }
}

export class FileStat implements vscode.FileStat {
  constructor(private fsStat: fs.Stats) {}

  get type(): vscode.FileType {
    return this.fsStat.isFile()
      ? vscode.FileType.File
      : this.fsStat.isDirectory()
      ? vscode.FileType.Directory
      : this.fsStat.isSymbolicLink()
      ? vscode.FileType.SymbolicLink
      : vscode.FileType.Unknown;
  }

  get isFile(): boolean | undefined {
    return this.fsStat.isFile();
  }

  get isDirectory(): boolean | undefined {
    return this.fsStat.isDirectory();
  }

  get isSymbolicLink(): boolean | undefined {
    return this.fsStat.isSymbolicLink();
  }

  get size(): number {
    return this.fsStat.size;
  }

  get ctime(): number {
    return this.fsStat.ctime.getTime();
  }

  get mtime(): number {
    return this.fsStat.mtime.getTime();
  }
}

interface Entry {
  uri: vscode.Uri;
  type: vscode.FileType;
  branch: String
}

//#endregion

export class FileSystemProvider
  implements vscode.TreeDataProvider<Entry>, vscode.FileSystemProvider {
  private _onDidChangeFile: vscode.EventEmitter<vscode.FileChangeEvent[]>;
  private _extensionPath: string;
  constructor(extensionPath: string) {
    this._onDidChangeFile = new vscode.EventEmitter<vscode.FileChangeEvent[]>();
    this._extensionPath = extensionPath;
  }

  get onDidChangeFile(): vscode.Event<vscode.FileChangeEvent[]> {
    return this._onDidChangeFile.event;
  }

  watch(
    uri: vscode.Uri,
    options: { recursive: boolean; excludes: string[] }
  ): vscode.Disposable {
    const watcher = fs.watch(
      uri.fsPath,
      { recursive: options.recursive },
      async (event: string, filename: string | Buffer) => {
        const filepath = path.join(
          uri.fsPath,
          _.normalizeNFC(filename.toString())
        );

        // TODO support excludes (using minimatch library?)

        this._onDidChangeFile.fire([
          {
            type:
              event === "change"
                ? vscode.FileChangeType.Changed
                : (await _.exists(filepath))
                ? vscode.FileChangeType.Created
                : vscode.FileChangeType.Deleted,
            uri: uri.with({ path: filepath })
          } as vscode.FileChangeEvent
        ]);
      }
    );

    return { dispose: () => watcher.close() };
  }

  stat(uri: vscode.Uri): vscode.FileStat | Thenable<vscode.FileStat> {
    return this._stat(uri.fsPath);
  }

  async _stat(path: string): Promise<vscode.FileStat> {
    return new FileStat(await _.stat(path));
  }

  readDirectory(
    uri: vscode.Uri
  ): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
    return this._readDirectory(uri);
  }

  async _readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    const children = await _.readdir(uri.fsPath);

    const result: [string, vscode.FileType][] = [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const stat = await this._stat(path.join(uri.fsPath, child));
      result.push([child, stat.type]);
    }

    return Promise.resolve(result);
  }

  createDirectory(uri: vscode.Uri): void | Thenable<void> {
    return _.mkdir(uri.fsPath);
  }

  readFile(uri: vscode.Uri): Uint8Array | Thenable<Uint8Array> {
    return _.readfile(uri.fsPath);
  }

  writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean }
  ): void | Thenable<void> {
    return this._writeFile(uri, content, options);
  }

  async _writeFile(
    uri: vscode.Uri,
    content: Uint8Array,
    options: { create: boolean; overwrite: boolean }
  ): Promise<void> {
    const exists = await _.exists(uri.fsPath);
    if (!exists) {
      if (!options.create) {
        throw vscode.FileSystemError.FileNotFound();
      }

      await _.mkdir(path.dirname(uri.fsPath));
    } else {
      if (!options.overwrite) {
        throw vscode.FileSystemError.FileExists();
      }
    }

    return _.writefile(uri.fsPath, content as Buffer);
  }

  delete(
    uri: vscode.Uri,
    options: { recursive: boolean }
  ): void | Thenable<void> {
    if (options.recursive) {
      return _.rmrf(uri.fsPath);
    }

    return _.unlink(uri.fsPath);
  }

  rename(
    oldUri: vscode.Uri,
    newUri: vscode.Uri,
    options: { overwrite: boolean }
  ): void | Thenable<void> {
    return this._rename(oldUri, newUri, options);
  }

  async _rename(
    oldUri: vscode.Uri,
    newUri: vscode.Uri,
    options: { overwrite: boolean }
  ): Promise<void> {
    const exists = await _.exists(newUri.fsPath);
    if (exists) {
      if (!options.overwrite) {
        throw vscode.FileSystemError.FileExists();
      } else {
        await _.rmrf(newUri.fsPath);
      }
    }

    const parentExists = await _.exists(path.dirname(newUri.fsPath));
    if (!parentExists) {
      await _.mkdir(path.dirname(newUri.fsPath));
    }

    return _.rename(oldUri.fsPath, newUri.fsPath);
  }

  // tree data provider
  async commandWorker(args) {
    // const CLIENT = await vscode_helpers.tryCreateGitClient();
    // if (false !== CLIENT) {
    var preArgs = [`branch`];
    // let c = preArgs.concat(args);
    let c = preArgs;
    if (args) {
      c = preArgs.concat(args);
    }
    // let c = preArgs.concat(args)
    // $write(c);
    // let RES = (await CLIENT.exec(c)).stdOut;
    let RES = await gitExec(c);
    let allBranchRaw = RES.toString();
    //   let res = allBranchRaw
    let filterStar = allBranchRaw.match(/\S+/g);
    //   let arr = res.match(/\b/)
    // "--merged",
    //   "pre_release"

    //   $write(`${allBranch.toString()}`);
    let branchList = filterStar.filter(s => {
      if (s == "*") {
        return false;
      } else {
        return true;
      }
    });
    return branchList;
    // } else {
    //   // no git client found
    // }
  }

  setOjb(obj, branch, allBranch, arr) {
    let inPre = [];
    arr.forEach(element => {
      let v = allBranch.find(item => {
        return item === element;
      });
      // if (v != branch) {
      inPre.push(v);
      // }
    });
    inPre.forEach(e => {
      if (!obj[e]) {
        obj[e] = {};
      }
      obj[e][branch] = true;
    });
  }
  async getChildren(element?: Entry): Promise<Entry[]> {
    // gitExec(['--version'])
    // let allBranch = await this.commandWorker([]);

    // console.log("allBranch",allBranch)
    let allBranch = await this.commandWorker([]);

    // allBranch.forEach(item=>{
      
    let obj = {};
    for (let index = 0; index < allBranch.length; index++) {
      const element = allBranch[index];
      let master = await this.commandWorker(["--merged", element]);
      
      this.setOjb(obj, element, allBranch, master);
    }

    // let obj = {};
    // for (let index = 0; index < allBranch.length; index++) {
    //   const element = allBranch[index];

    //   this.setOjb(obj, element, allBranch, element);
    // }
    // })

    // let master = await this.commandWorker(["--merged", "master"]);
    // let pre_release = await this.commandWorker(["--merged", "pre_release"]);
    // let produce = await this.commandWorker(["--merged", "produce"]);

    // this.setOjb(obj, "pre_release", allBranch, pre_release);
    // this.setOjb(obj, "produce", allBranch, produce);
    // this.setOjb(obj, "master", allBranch, master);

    let arr = [];
    allBranch.forEach(element => {
      let inBranch = "";
      allBranch.forEach(v => {
        if (obj[element] && obj[element][v] == true && v != element) {
          inBranch = inBranch + " " + v + " ";
        }
      });
      let status = "";
      if (inBranch) {
        status = `（${inBranch}）`;
      }
      arr.push({
        uri: vscode.Uri.file(path.join("", `${element} ${status}`)),
        type: vscode.FileType.File,
        branch:element
      });
    });
    return arr;
  }

  getTreeItem(element: Entry): vscode.TreeItem {
    const treeItem = new vscode.TreeItem(
      element.uri,
      element.type === vscode.FileType.Directory
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );
    if (element.type === vscode.FileType.File) {
      treeItem.command = {
        command: "gitBranch.openFile",
        title: "Open File",
        arguments: [element.uri]
      };
      treeItem.contextValue = "file";
    }
    
    treeItem.iconPath = path.join(this._extensionPath,'images', 'dark', 'icon-branch.svg')
    // if (element.branch === 'master') {
      
    //   // treeItem.contextValue = "file";
    // }else{
    //   treeItem.iconPath = this.getIcon(valueNode);
    // }
    return treeItem;
  }
}

export class FileExplorer {
  // private fileExplorer: vscode.TreeView<Entry>;

  constructor(context: vscode.ExtensionContext) {
    this.createTreeView(context);
    // this.extensionPath = context.extensionPath
    vscode.commands.registerCommand("gitBranch.openFile", resource =>
      this.openResource(resource)
    );
  }
  public createTreeView(context: vscode.ExtensionContext) {
    const treeDataProvider = new FileSystemProvider(context.extensionPath);

    vscode.window.createTreeView("gitBranch", { treeDataProvider });
  }

  private openResource(resource: vscode.Uri): void {
    vscode.window.showTextDocument(resource);
  }
}
