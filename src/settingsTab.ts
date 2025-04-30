import {
    App,
    PluginSettingTab,
    Setting,
    DropdownComponent,
    Modal,
    Notice,
} from "obsidian";
import FolderNavigatorPlugin from "./main";
import { FolderDisplayMode } from "./settings";

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

        // Folder display preferences section
        new Setting(containerEl).setName("Folder display preferences").setHeading();

        new Setting(containerEl)
            .setName("Display priority")
            .setDesc("Control which folders appear at the top of the suggestion list before searching")
            .addDropdown((dropdown: DropdownComponent) => {
                dropdown
                    .addOption(FolderDisplayMode.DEFAULT, "Default order (alphabetical)")
                    .addOption(FolderDisplayMode.RECENCY, "Recently visited first")
                    .addOption(FolderDisplayMode.FREQUENCY, "Frequently visited first")
                    .setValue(this.plugin.settings.folderDisplayMode)
                    .onChange(async (value: string) => {
                        this.plugin.settings.folderDisplayMode = value as FolderDisplayMode;
                        await this.plugin.saveSettings();
                    });
            });

        // Only show these settings if the display mode is not DEFAULT
        if (this.plugin.settings.folderDisplayMode !== FolderDisplayMode.DEFAULT) {
            new Setting(containerEl)
                .setName("Recent folders to show")
                .setDesc("Number of recently visited folders to display at the top when using 'Recently visited first' mode")
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
                .setDesc("Number of frequently visited folders to display at the top when using 'Frequently visited first' mode")
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
            .setDesc(
                "Clear the tracked history of visited folders. Warning: This will remove all recency and frequency data.",
            )
            .addButton((button) =>
                button
                    .setButtonText("Reset")
                    .setWarning()
                    .onClick(async () => {
                        // Create a confirmation modal
                        const confirmModal = new Modal(this.app);
                        confirmModal.titleEl.setText("Reset folder history");
                        confirmModal.contentEl.createEl("p", {
                            text: "Are you sure? This will permanently delete all folder navigation history including recently visited and frequently used folder data.",
                            cls: "mod-warning",
                        });

                        const buttonContainer =
                            confirmModal.contentEl.createDiv({
                                cls: "modal-button-container",
                            });

                        // Cancel button
                        buttonContainer
                            .createEl("button", {
                                text: "Cancel",
                            })
                            .addEventListener("click", () => {
                                confirmModal.close();
                            });

                        // Confirm button
                        const confirmButton = buttonContainer.createEl(
                            "button",
                            {
                                text: "Reset folder history",
                                cls: "mod-warning",
                            },
                        );
                        confirmButton.addEventListener("click", async () => {
                            this.plugin.settings.folderHistory = {};
                            await this.plugin.saveSettings();
                            confirmModal.close();
                            new Notice("Folder history has been reset");
                        });

                        confirmModal.open();
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
