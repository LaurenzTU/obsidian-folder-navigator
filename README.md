# Obsidian Folder Navigator

A simple plugin for Obsidian that allows you to quickly navigate to folders in your vault using fuzzy search.

## Features

- Quick folder navigation using fuzzy search
- Customizable hotkey (default: Cmd/Ctrl+Shift+O)
- Configurable maximum number of search results
- Keyboard navigation support
- Works with nested folders

## Usage

1. Press the hotkey (default: Cmd/Ctrl+Shift+O) to open the folder search modal
2. Type to search for folders - the search is fuzzy, so you don't need to type the exact name
3. Use arrow keys to navigate through the results
4. Press Enter to select a folder and navigate to it in the file explorer

## Settings

- **Hotkey**: Customize the keyboard shortcut to open the folder navigator (requires restart)
- **Maximum results**: Set the maximum number of folders to show in search results (5-50)

## Installation

1. Open Settings in Obsidian
2. Navigate to Community Plugins and disable Safe Mode
3. Click Browse and search for "Folder Navigator"
4. Install the plugin
5. Enable the plugin in the Community Plugins tab

## Manual Installation

1. Download the latest release
2. Extract the files into your vault's `.obsidian/plugins/obsidian-folder-navigator/` directory
3. Reload Obsidian
4. Enable the plugin in Settings > Community Plugins

## Development

1. Clone this repository
2. Run `npm i` to install dependencies
3. Run `npm run dev` to start compilation in watch mode

## License

MIT
