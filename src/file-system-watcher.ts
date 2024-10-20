import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { ScopeManager } from "./scope-manager";

export class FileSystemWatcher {
  private fileWatcher: vscode.FileSystemWatcher;
  private folderWatcher: vscode.FileSystemWatcher;

  constructor(private scopeManager: ScopeManager) {
    this.fileWatcher = vscode.workspace.createFileSystemWatcher("**/*");
    this.folderWatcher = vscode.workspace.createFileSystemWatcher(
      "**/*",
      false,
      true,
      false
    );
    this.registerListeners();
  }

  private registerListeners(): void {
    this.fileWatcher.onDidChange((uri) => {
      // File content changed, no action needed for scopes
    });

    this.fileWatcher.onDidCreate((uri) => {
      this.handleCreate(uri);
    });

    this.fileWatcher.onDidDelete((uri) => {
      this.handleDelete(uri);
    });

    this.folderWatcher.onDidDelete((uri) => {
      this.handleDelete(uri);
    });

    vscode.workspace.onDidRenameFiles((event) => {
      event.files.forEach((file) => {
        this.handleRename(file.oldUri, file.newUri);
      });
    });
  }

  private handleCreate(uri: vscode.Uri): void {
    const newPath = uri.fsPath;
    const parentDir = path.dirname(newPath);

    // Check if the parent directory is in any scope
    const scopes = this.scopeManager.getScopes();
    scopes.forEach((scopeName) => {
      const scopeItems = this.scopeManager.getScopeItems(scopeName);
      const parentInScope = scopeItems.find(
        (item) =>
          item.type === "folder" && newPath.startsWith(item.path + path.sep)
      );
      if (parentInScope) {
        this.scopeManager.addToScope(scopeName, newPath);
      }
    });
  }

  private handleDelete(uri: vscode.Uri): void {
    const deletedPath = uri.fsPath;
    const scopes = this.scopeManager.getScopes();

    scopes.forEach((scopeName) => {
      const scopeItems = this.scopeManager.getScopeItems(scopeName);
      const itemsToRemove = scopeItems.filter(
        (item) =>
          item.path === deletedPath ||
          item.path.startsWith(deletedPath + path.sep)
      );

      itemsToRemove.forEach((item) => {
        this.scopeManager.removeFromScope(scopeName, item.path);
      });
    });
  }

  private handleRename(oldUri: vscode.Uri, newUri: vscode.Uri): void {
    const oldPath = oldUri.fsPath;
    const newPath = newUri.fsPath;

    const scopes = this.scopeManager.getScopes();
    scopes.forEach((scopeName) => {
      const scopeItems = this.scopeManager.getScopeItems(scopeName);

      scopeItems.forEach((item) => {
        if (item.path === oldPath || item.path.startsWith(oldPath + path.sep)) {
          const updatedPath = item.path.replace(oldPath, newPath);
          this.scopeManager.removeFromScope(scopeName, item.path);
          this.scopeManager.addToScope(scopeName, updatedPath);
        }
      });
    });
  }

  dispose(): void {
    this.fileWatcher.dispose();
    this.folderWatcher.dispose();
  }
}
