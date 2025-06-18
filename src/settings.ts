// --- settings.ts ---
import { App } from "obsidian";

export enum FolderDisplayMode {
    DEFAULT = "default",
    RECENCY = "recency",
    FREQUENCY = "frequency",
}

export interface PluginSettings {
    maxResults: number;
    expandTargetFolder: boolean;
    debugMode: boolean;
    folderDisplayMode: FolderDisplayMode;
    recentFoldersToShow: number;
    frequentFoldersToShow: number;
    folderHistory: Record<
        string,
        {
            lastAccessed: number; // timestamp
            accessCount: number; // visit count
        }
    >;
    // New setting to store excluded folder paths
    excludedFolders: string[];
}

export const DEFAULT_SETTINGS: PluginSettings = {
    maxResults: 10,
    expandTargetFolder: true, // Enable by default for better navigation
    debugMode: false, // Disabled by default
    folderDisplayMode: FolderDisplayMode.DEFAULT,
    recentFoldersToShow: 5,
    frequentFoldersToShow: 5,
    folderHistory: {},
    excludedFolders: [], // Initialize with an empty array
};
