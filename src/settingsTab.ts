import { App, PluginSettingTab, Setting, DropdownComponent } from "obsidian";
import FolderNavigatorPlugin from "./main";
import { FolderSortMode } from "./settings";

export class SettingsTab extends PluginSettingTab {
    plugin: FolderNavigatorPlugin;

    constructor(app: App, plugin: FolderNavigatorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // General settings section
        new Setting(containerEl)
            .setName("Maximum results")
            .setDesc("Maximum number of folders to show in search results")
            .addSlider((slider) =>
                slider
                    .setLimits(5, 50, 5)
                    .setValue(this.plugin.settings.maxResults)
                    .setDynamicTooltip()
                    .onChange(async (value) => {
                        this.plugin.settings.maxResults = value;
                        await this.plugin.saveSettings();
                    }),
            );

        new Setting(containerEl)
            .setName("Expand target folder on navigation")
            .setDesc(
                "When enabled, folders will be automatically expanded when you navigate to them",
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.expandTargetFolder)
                    .onChange(async (value) => {
                        this.plugin.settings.expandTargetFolder = value;
                        await this.plugin.saveSettings();
                    }),
            );

        // Folder sorting section
        new Setting(containerEl).setName("Folder sorting").setHeading();

        new Setting(containerEl)
            .setName("Sort mode")
            .setDesc("How folders are sorted in the suggestion list")
            .addDropdown((dropdown: DropdownComponent) => {
                dropdown
                    .addOption(FolderSortMode.DEFAULT, "Default (alphabetical)")
                    .addOption(FolderSortMode.RECENCY, "Recently visited")
                    .addOption(FolderSortMode.FREQUENCY, "Frequently visited")
                    .setValue(this.plugin.settings.folderSortMode)
                    .onChange(async (value: string) => {
                        this.plugin.settings.folderSortMode = value as FolderSortMode;
                        await this.plugin.saveSettings();
                    });
            });

        // Only show these settings if the sort mode is not DEFAULT
        if (this.plugin.settings.folderSortMode !== FolderSortMode.DEFAULT) {
            new Setting(containerEl)
                .setName("Recent folders to show")
                .setDesc("Number of recently visited folders to display at the top when using the recency sort mode")
                .addSlider((slider) =>
                    slider
                        .setLimits(1, 20, 1)
                        .setValue(this.plugin.settings.recentFoldersToShow)
                        .setDynamicTooltip()
                        .onChange(async (value) => {
                            this.plugin.settings.recentFoldersToShow = value;
                            await this.plugin.saveSettings();
                        }),
                );

            new Setting(containerEl)
                .setName("Frequent folders to show")
                .setDesc("Number of frequently visited folders to display at the top when using the frequency sort mode")
                .addSlider((slider) =>
                    slider
                        .setLimits(1, 20, 1)
                        .setValue(this.plugin.settings.frequentFoldersToShow)
                        .setDynamicTooltip()
                        .onChange(async (value) => {
                            this.plugin.settings.frequentFoldersToShow = value;
                            await this.plugin.saveSettings();
                        }),
                );
        }

        // Add reset history button
        new Setting(containerEl)
            .setName("Reset folder history")
            .setDesc("Clear the tracked history of visited folders")
            .addButton((button) =>
                button
                    .setButtonText("Reset")
                    .onClick(async () => {
                        this.plugin.settings.folderHistory = {};
                        await this.plugin.saveSettings();
                    }),
            );

        // Add advanced section
        new Setting(containerEl).setName("Advanced").setHeading();

        new Setting(containerEl)
            .setName("Debug mode")
            .setDesc(
                "Enable detailed logging to console for troubleshooting issues. This may affect performance and should be disabled during normal use.",
            )
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.debugMode)
                    .onChange(async (value) => {
                        this.plugin.settings.debugMode = value;
                        await this.plugin.saveSettings();
                    }),
            );
    }
}
