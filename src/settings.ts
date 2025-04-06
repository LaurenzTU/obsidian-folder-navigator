import { App } from "obsidian";

export interface PluginSettings {
    maxResults: number;
    expandTargetFolder: boolean;
    debugMode: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    maxResults: 10,
    expandTargetFolder: true, // Enable by default for better navigation
    debugMode: false, // Disabled by default
};
