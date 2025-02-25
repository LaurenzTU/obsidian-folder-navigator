import { Plugin } from "obsidian";
import { SettingsTab } from "./settingsTab";
import { PluginSettings, DEFAULT_SETTINGS } from "./settings";
import { FolderSuggestModal } from "./folderSuggestModal";

export default class FolderNavigatorPlugin extends Plugin {
    settings: PluginSettings;

    async onload() {
        await this.loadSettings();

        // Add settings tab
        this.addSettingTab(new SettingsTab(this.app, this));

        // Add folder navigation command
        this.addCommand({
            id: "open-folder-navigator",
            name: "Navigate to folder",
            callback: () => {
                new FolderSuggestModal(this.app, this).open();
            },
        });
    }

    onunload() {
        // Cleanup when the plugin is disabled
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData(),
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
