import { App } from "obsidian";

export enum FolderSortMode {
    DEFAULT = "default",
    RECENCY = "recency",
    FREQUENCY = "frequency"
}

export interface PluginSettings {
    maxResults: number;
    expandTargetFolder: boolean;
    debugMode: boolean;
    folderSortMode: FolderSortMode;
    recentFoldersToShow: number;
    frequentFoldersToShow: number;
    folderHistory: Record<string, { 
        lastAccessed: number; // timestamp
        accessCount: number;  // visit count
    }>;
}

export const DEFAULT_SETTINGS: PluginSettings = {
    maxResults: 10,
    expandTargetFolder: true, // Enable by default for better navigation
    debugMode: false, // Disabled by default
    folderSortMode: FolderSortMode.DEFAULT,
    recentFoldersToShow: 5,
    frequentFoldersToShow: 5,
    folderHistory: {},
};
