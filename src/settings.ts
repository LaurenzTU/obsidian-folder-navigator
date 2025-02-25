import { App } from "obsidian";

export interface PluginSettings {
    maxResults: number;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    maxResults: 10,
};
