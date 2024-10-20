# FileScope

FileScope is a Visual Studio Code extension that enhances file management by allowing users to create custom scopes for files and folders. This extension helps developers organize and quickly access related files across different directories within their projects.

## Features

- Create custom scopes to group related files and folders
- Add files and folders to scopes directly from the VS Code explorer
- View all scopes and their contents in a dedicated sidebar
- Easily remove items from scopes or delete entire scopes
- Navigate through folder structures within scopes

## Installation

1. Download the latest `.vsix` file from the [releases page](https://github.com/yourusername/filescope/releases) (replace with your actual releases page URL).
2. Open Visual Studio Code
3. Go to the Extensions view (Ctrl+Shift+X or Cmd+Shift+X)
4. Click on the "..." menu at the top of the Extensions view and select "Install from VSIX..."
5. Navigate to and select the downloaded `.vsix` file
6. Reload VS Code when prompted

## Usage

### Creating a Scope

1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Type "FileScope: Create New Scope" and select it
3. Enter a name for your new scope

### Adding Files or Folders to a Scope

1. Right-click on a file or folder in the Explorer
2. Select "FileScope: Add to Scope" from the context menu
3. Choose the scope you want to add the file or folder to

### Viewing Scopes

- Look for the "File Scopes" view in the Explorer sidebar
- If you don't see it, click on the ellipsis (...) at the top of the Explorer and select "File Scopes"

### Removing Items from a Scope

- In the File Scopes view, find the item you want to remove
- Click the "x" icon next to the item

### Deleting a Scope

- In the File Scopes view, find the scope you want to delete
- Click the trash can icon next to the scope name

### Refreshing the File Scopes View

- Click the refresh icon at the top of the File Scopes view

## Contributing

Contributions to FileScope are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).
