import { App } from "obsidian";

export interface PluginSettings {
    hotkey: string;
    maxResults: number;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    hotkey: "Mod+Shift+O",
    maxResults: 10,
};
