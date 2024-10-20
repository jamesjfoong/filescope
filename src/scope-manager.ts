import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

interface ScopeItem {
  path: string;
  type: "file" | "folder";
}

interface Scope {
  name: string;
  items: ScopeItem[];
}

export class ScopeManager {
  private scopes: Scope[] = [];
  private readonly storageKey = "filescope.scopes";

  constructor(private storage: vscode.Memento) {
    this.loadScopes();
  }

  private loadScopes(): void {
    try {
      const loadedScopes = this.storage.get<Scope[]>(this.storageKey);
      this.scopes = Array.isArray(loadedScopes) ? loadedScopes : [];

      // Validate loaded scopes
      this.scopes = this.scopes.map((scope) => ({
        ...scope,
        items: Array.isArray(scope.items)
          ? scope.items.filter(
              (item) => item && item.path && fs.existsSync(item.path)
            )
          : [],
      }));

      this.saveScopes(); // Save after filtering out non-existent items
    } catch (error) {
      console.error("Error loading scopes:", error);
      this.scopes = []; // Ensure scopes is always an array
    }
  }

  private saveScopes(): void {
    try {
      this.storage.update(this.storageKey, this.scopes);
    } catch (error) {
      console.error("Error saving scopes:", error);
    }
  }

  public createScope(name: string): void {
    if (!this.scopes.some((scope) => scope.name === name)) {
      this.scopes.push({ name, items: [] });
      this.saveScopes();
    }
  }

  public getScopes(): string[] {
    return this.scopes.map((scope) => scope.name);
  }

  public getScopeItems(scopeName: string): ScopeItem[] {
    const scope = this.scopes.find((s) => s.name === scopeName);
    return scope ? scope.items : [];
  }

  public addToScope(scopeName: string, itemPath: string): void {
    const scope = this.scopes.find((s) => s.name === scopeName);
    if (scope && !scope.items.some((item) => item.path === itemPath)) {
      const type =
        fs.existsSync(itemPath) && fs.statSync(itemPath).isDirectory()
          ? "folder"
          : "file";
      scope.items.push({ path: itemPath, type });
      this.saveScopes();
    }
  }

  public removeFromScope(scopeName: string, itemPath: string): void {
    const scope = this.scopes.find((s) => s.name === scopeName);
    if (scope) {
      scope.items = scope.items.filter((item) => item.path !== itemPath);
      this.saveScopes();
    }
  }

  public deleteScope(scopeName: string): boolean {
    const initialLength = this.scopes.length;
    this.scopes = this.scopes.filter((scope) => scope.name !== scopeName);
    if (this.scopes.length < initialLength) {
      this.saveScopes();
      return true;
    }
    return false;
  }

  public updateItemPath(oldPath: string, newPath: string): void {
    this.scopes.forEach((scope) => {
      scope.items.forEach((item) => {
        if (item.path === oldPath) {
          item.path = newPath;
        } else if (item.path.startsWith(oldPath + path.sep)) {
          item.path = path.join(newPath, item.path.slice(oldPath.length + 1));
        }
      });
    });
    this.saveScopes();
  }

  public removeDeletedItems(deletedPaths: string[]): void {
    this.scopes.forEach((scope) => {
      scope.items = scope.items.filter(
        (item) => !deletedPaths.includes(item.path)
      );
    });
    this.saveScopes();
  }
}
