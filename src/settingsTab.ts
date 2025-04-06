import { App, PluginSettingTab, Setting } from "obsidian";
import FolderNavigatorPlugin from "./main";

export class SettingsTab extends PluginSettingTab {
    plugin: FolderNavigatorPlugin;

    constructor(app: App, plugin: FolderNavigatorPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

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
