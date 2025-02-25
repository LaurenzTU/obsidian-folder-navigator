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
            .setName("Hotkey")
            .setDesc("Hotkey to open folder navigator (requires restart)")
            .addText((text) =>
                text
                    .setPlaceholder("Mod+Shift+O")
                    .setValue(this.plugin.settings.hotkey)
                    .onChange(async (value) => {
                        this.plugin.settings.hotkey = value;
                        await this.plugin.saveSettings();
                    }),
            );

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
    }
}
