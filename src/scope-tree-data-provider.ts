import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { ScopeManager } from "./scope-manager";

class ScopeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.iconPath = new vscode.ThemeIcon("folder-library");
    this.contextValue = "scope";

    this.command = {
      command: "filescope.deleteScopeFromTree",
      title: "Delete Scope",
      arguments: [this],
    };
  }
}

class FileSystemItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly itemPath: string,
    public readonly type: "file" | "folder",
    public readonly scopeName: string
  ) {
    super(
      label,
      type === "folder"
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None
    );
    this.tooltip = itemPath;
    this.command =
      type === "file"
        ? {
            command: "vscode.open",
            title: "Open File",
            arguments: [vscode.Uri.file(itemPath)],
          }
        : undefined;
    this.contextValue = type;
    this.id = `${scopeName}|${itemPath}`;
    this.resourceUri = vscode.Uri.file(itemPath);
    this.iconPath =
      type === "folder"
        ? new vscode.ThemeIcon("folder")
        : vscode.ThemeIcon.File;
  }
}

export class ScopeTreeDataProvider
  implements vscode.TreeDataProvider<vscode.TreeItem>
{
  private _onDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined | null | void
  > = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    vscode.TreeItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  constructor(private scopeManager: ScopeManager) {}

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
    if (!element) {
      return Promise.resolve(this.getScopeItems());
    } else if (element instanceof ScopeItem) {
      return Promise.resolve(this.getFileSystemItems(element.label));
    } else if (element instanceof FileSystemItem && element.type === "folder") {
      return Promise.resolve(
        this.getFolderContents(element.itemPath, element.scopeName)
      );
    } else {
      return Promise.resolve([]);
    }
  }

  private getScopeItems(): ScopeItem[] {
    return this.scopeManager
      .getScopes()
      .map(
        (scopeName) =>
          new ScopeItem(scopeName, vscode.TreeItemCollapsibleState.Collapsed)
      );
  }

  private getFileSystemItems(scopeName: string): FileSystemItem[] {
    const items = this.scopeManager.getScopeItems(scopeName);
    return items.map((item) => this.createFileSystemItem(item.path, scopeName));
  }

  private getFolderContents(
    folderPath: string,
    scopeName: string
  ): FileSystemItem[] {
    try {
      const contents = fs.readdirSync(folderPath);
      return contents.map((item) => {
        const itemPath = path.join(folderPath, item);
        return this.createFileSystemItem(itemPath, scopeName);
      });
    } catch (error) {
      console.error(`Error reading folder contents: ${folderPath}`, error);
      return [];
    }
  }

  private createFileSystemItem(
    itemPath: string,
    scopeName: string
  ): FileSystemItem {
    const stats = fs.statSync(itemPath);
    const type = stats.isDirectory() ? "folder" : "file";
    return new FileSystemItem(
      path.basename(itemPath),
      itemPath,
      type,
      scopeName
    );
  }
}
