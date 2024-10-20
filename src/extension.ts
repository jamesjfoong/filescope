import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ScopeManager } from "./scope-manager";
import { ScopeTreeDataProvider } from "./scope-tree-data-provider";
import { FileSystemWatcher } from "./file-system-watcher";

export function activate(context: vscode.ExtensionContext) {
  console.log("Activating FileScope extension");
  try {
    const scopeManager = new ScopeManager(context.workspaceState);
    const treeDataProvider = new ScopeTreeDataProvider(scopeManager);
    const fileSystemWatcher = new FileSystemWatcher(scopeManager);
    const fileScopeExplorer = vscode.window.createTreeView(
      "fileScopeExplorer",
      {
        treeDataProvider,
        canSelectMany: false,
      }
    );

    console.log("Registering commands");

    const createScopeCommand = vscode.commands.registerCommand(
      "filescope.createScope",
      async () => {
        const scopeName = await vscode.window.showInputBox({
          prompt: "Enter a name for the new scope",
        });
        if (scopeName) {
          scopeManager.createScope(scopeName);
          treeDataProvider.refresh();
        }
      }
    );

    const addToScopeCommand = vscode.commands.registerCommand(
      "filescope.addToScope",
      async (resource?: vscode.Uri) => {
        console.log("filescope.addToScope command executed");
        let itemPath: string | undefined;

        if (resource && resource.fsPath) {
          itemPath = resource.fsPath;
        } else {
          const activeEditor = vscode.window.activeTextEditor;
          if (activeEditor && activeEditor.document.uri.scheme === "file") {
            itemPath = activeEditor.document.uri.fsPath;
          }
        }

        if (!itemPath) {
          vscode.window.showErrorMessage(
            "No file or folder selected. Please select a file or folder in the explorer or open a file in the editor."
          );
          return;
        }

        const scopes = scopeManager.getScopes();
        if (scopes.length === 0) {
          vscode.window.showInformationMessage(
            "No scopes available. Create a scope first."
          );
          return;
        }

        const selectedScope = await vscode.window.showQuickPick(scopes, {
          placeHolder: "Select a scope to add the file/folder",
        });

        if (selectedScope) {
          const stats = fs.statSync(itemPath);
          if (stats.isDirectory()) {
            // If it's a folder, add all its contents recursively
            addFolderToScope(itemPath, selectedScope, scopeManager);
          } else {
            scopeManager.addToScope(selectedScope, itemPath);
          }
          treeDataProvider.refresh();
          const itemType = stats.isDirectory() ? "folder" : "file";
          vscode.window.showInformationMessage(
            `Added ${itemType} ${itemPath} to scope ${selectedScope}`
          );
        }
      }
    );

    function addFolderToScope(
      folderPath: string,
      scopeName: string,
      scopeManager: ScopeManager
    ) {
      const items = fs.readdirSync(folderPath);
      items.forEach((item) => {
        const itemPath = path.join(folderPath, item);
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          addFolderToScope(itemPath, scopeName, scopeManager);
        } else {
          scopeManager.addToScope(scopeName, itemPath);
        }
      });
    }

    const deleteScopeCommand = vscode.commands.registerCommand(
      "filescope.deleteScope",
      async (item?: vscode.TreeItem) => {
        console.log("filescope.deleteScope command executed");
        let scopeName: string | undefined;

        if (item && item.contextValue === "scope") {
          scopeName = item.label as string;
        } else {
          const scopes = scopeManager.getScopes();
          if (scopes.length === 0) {
            vscode.window.showInformationMessage(
              "No scopes available to delete."
            );
            return;
          }
          scopeName = await vscode.window.showQuickPick(scopes, {
            placeHolder: "Select a scope to delete",
          });
        }

        if (scopeName) {
          const confirmed = await vscode.window.showWarningMessage(
            `Are you sure you want to delete the scope "${scopeName}"? This action cannot be undone.`,
            { modal: true },
            "Yes",
            "No"
          );

          if (confirmed === "Yes") {
            const deleted = scopeManager.deleteScope(scopeName);
            if (deleted) {
              treeDataProvider.refresh();
              vscode.window.showInformationMessage(
                `Scope "${scopeName}" has been deleted.`
              );
            } else {
              vscode.window.showErrorMessage(
                `Failed to delete scope "${scopeName}".`
              );
            }
          }
        }
      }
    );

    const deleteScopeFromTreeCommand = vscode.commands.registerCommand(
      "filescope.deleteScopeFromTree",
      async (item: vscode.TreeItem) => {
        console.log("filescope.deleteScopeFromTree command executed");
        if (item.contextValue === "scope" && item.label) {
          const scopeName = item.label as string;
          const confirmed = await vscode.window.showWarningMessage(
            `Are you sure you want to delete the scope "${scopeName}"? This action cannot be undone.`,
            { modal: true },
            "Yes",
            "No"
          );

          if (confirmed === "Yes") {
            const deleted = scopeManager.deleteScope(scopeName);
            if (deleted) {
              treeDataProvider.refresh();
              vscode.window.showInformationMessage(
                `Scope "${scopeName}" has been deleted.`
              );
            } else {
              vscode.window.showErrorMessage(
                `Failed to delete scope "${scopeName}".`
              );
            }
          }
        }
      }
    );

    const removeFromScopeCommand = vscode.commands.registerCommand(
      "filescope.removeFromScope",
      (item: vscode.TreeItem) => {
        console.log("filescope.removeFromScope command executed");
        if (
          (item.contextValue === "file" || item.contextValue === "folder") &&
          item.id
        ) {
          const [scopeName, itemPath] = item.id.split("|");
          scopeManager.removeFromScope(scopeName, itemPath);
          treeDataProvider.refresh();
          vscode.window.showInformationMessage(
            `Removed ${item.label} from scope ${scopeName}`
          );
        }
      }
    );

    const refreshTreeCommand = vscode.commands.registerCommand(
      "filescope.refreshTree",
      () => {
        treeDataProvider.refresh();
      }
    );

    context.subscriptions.push(
      createScopeCommand,
      addToScopeCommand,
      removeFromScopeCommand,
      refreshTreeCommand,
      fileScopeExplorer,
      fileSystemWatcher,
      deleteScopeCommand,
      deleteScopeFromTreeCommand
      // { dispose: () => fileSystemWatcher.dispose() }
    );

    console.log("FileScope extension activated successfully");
  } catch (error) {
    console.error("Error activating FileScope extension:", error);
    vscode.window.showErrorMessage(
      "Failed to activate FileScope extension. Please check the console for more information."
    );
  }
}

export function deactivate() {}
