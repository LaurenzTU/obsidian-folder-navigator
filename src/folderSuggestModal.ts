import { App, FuzzySuggestModal, TFolder, WorkspaceLeaf, View } from "obsidian";
import type FolderNavigatorPlugin from "./main";

// Debug mode flag - set to false for production
const DEBUG_MODE = false;

// Helper function for conditional logging
function log(message: string, ...args: any[]): void {
    if (DEBUG_MODE) {
        console.log(message, ...args);
    }
}

// Helper function for error logging (always show errors)
function logError(message: string, ...args: any[]): void {
    console.error(message, ...args);
}

interface FileExplorerView extends View {
    fileItems: Record<string, any>;
}

interface FileExplorerInstance {
    view: {
        fileItems: Record<string, any>;
    };
    revealInFolder: (file: any) => void;
}

interface InternalPlugins {
    plugins: {
        "file-explorer": {
            instance: FileExplorerInstance;
        };
    };
}

interface ExtendedApp extends App {
    internalPlugins: InternalPlugins;
}

export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
    folders: TFolder[];
    plugin: FolderNavigatorPlugin;

    constructor(app: App, plugin: FolderNavigatorPlugin) {
        super(app);
        this.plugin = plugin;
        this.setPlaceholder("Type folder name...");
        this.folders = this.getAllFolders();
    }

    private getAllFolders(): TFolder[] {
        return this.app.vault.getAllFolders();
    }

    getItems(): TFolder[] {
        return this.folders;
    }

    getItemText(folder: TFolder): string {
        return folder.path;
    }

    /**
     * Escapes a path for use in CSS selectors
     */
    private escapePath(path: string): string {
        return CSS.escape(path);
    }

    /**
     * Find a folder element in the DOM using multiple strategies
     */
    private findFolderElementInDOM(path: string): HTMLElement | null {
        const escapedPath = this.escapePath(path);
        
        // Try common selectors first
        const selectors = [
            `.nav-folder-title[data-path="${escapedPath}"]`,
            `.nav-file-title[data-path="${escapedPath}"]`,
            `[data-path="${escapedPath}"]`
        ];
        
        // Try each selector
        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el instanceof HTMLElement) {
                log("Found folder element using selector:", selector);
                return el;
            }
        }
        
        // Try to find by partial path matches if exact match failed
        const allElements = document.querySelectorAll('[data-path]');
        for (const el of Array.from(allElements)) {
            const elPath = el.getAttribute('data-path');
            if (elPath && (elPath === path || path.endsWith(elPath) || elPath.endsWith(path))) {
                log("Found folder by partial path match:", elPath);
                return el as HTMLElement;
            }
        }
        
        // If in debug mode, provide more details about what was found
        if (DEBUG_MODE) {
            const samplePaths = Array.from(allElements).slice(0, 5)
                .map(el => el.getAttribute('data-path'));
            log("Sample paths in DOM:", samplePaths);
        }
        
        return null;
    }

    /**
     * Try to expand a folder using DOM manipulation as a fallback
     */
    private tryToExpandFolderViaDOM(path: string): void {
        setTimeout(() => {
            log("Trying to expand folder via DOM:", path);
            
            const folderElement = this.findFolderElementInDOM(path);
            
            if (folderElement) {
                const collapseIndicator = folderElement.querySelector('.nav-folder-collapse-indicator');
                if (collapseIndicator instanceof HTMLElement) {
                    const parentEl = folderElement.closest('.nav-folder');
                    const isCollapsed = parentEl?.classList.contains('is-collapsed') ||
                                      collapseIndicator.classList.contains('is-collapsed');
                    
                    if (isCollapsed) {
                        log("Clicking collapse indicator to expand folder");
                        collapseIndicator.click();
                    } else {
                        log("Folder already appears to be expanded");
                    }
                } else {
                    log("No collapse indicator found, might not be expandable");
                }
            } else {
                log("Could not find folder element in DOM:", path);
            }
        }, 100);
    }

    /**
     * Apply visual highlighting to a folder
     */
    private highlightFolder(folder: TFolder): void {
        setTimeout(() => {
            log("Looking for folder to highlight:", folder.path);
            
            const folderElement = this.findFolderElementInDOM(folder.path);
            
            if (folderElement) {
                // Scroll into view
                log("Scrolling folder into view");
                folderElement.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
                
                // Add highlight class
                log("Adding highlight class");
                folderElement.classList.add("nav-folder-title-highlighted");
                
                // Remove after delay
                setTimeout(() => {
                    if (folderElement) {
                        folderElement.classList.remove("nav-folder-title-highlighted");
                    }
                }, 2000);
            } else {
                logError("Could not find folder element to highlight");
            }
        }, 300);
    }

    /**
     * Get the file explorer instance from Obsidian's internal APIs
     */
    private getFileExplorer(): FileExplorerInstance | null {
        try {
            const app = this.app as ExtendedApp;
            if (!app.internalPlugins?.plugins["file-explorer"]?.instance) {
                logError("Could not find file explorer plugin instance");
                return null;
            }
            
            const fileExplorer = app.internalPlugins.plugins["file-explorer"].instance;
            
            if (typeof fileExplorer.revealInFolder !== 'function') {
                logError("revealInFolder method not found on file explorer instance");
                return null;
            }
            
            return fileExplorer;
        } catch (error) {
            logError("Error accessing file explorer:", error);
            return null;
        }
    }

    /**
     * Expand all parent folders of the target folder
     */
    private expandParentFolders(folder: TFolder, fileExplorer: FileExplorerInstance): void {
        if (!folder.parent || !folder.parent.path) return;
        
        log("Processing parent folders for:", folder.parent.path);
        
        const pathParts = folder.parent.path.split("/");
        let currentPath = "";
        
        // Process each parent path
        for (const part of pathParts) {
            if (part) {
                currentPath += (currentPath ? "/" : "") + part;
                log("Processing parent path:", currentPath);
                
                const parentFolder = this.app.vault.getAbstractFileByPath(currentPath);
                if (parentFolder instanceof TFolder) {
                    // Reveal in file explorer using the API
                    log("Revealing parent folder:", parentFolder.path);
                    fileExplorer.revealInFolder(parentFolder);
                    
                    // Try to expand it using DOM as a fallback
                    this.tryToExpandFolderViaDOM(parentFolder.path);
                }
            }
        }
    }

    onChooseItem(folder: TFolder): void {
        log("Folder selected:", folder.path);
        
        // Get and activate file explorer leaf
        const fileExplorerLeaves = this.app.workspace.getLeavesOfType("file-explorer");
        log("File explorer leaves found:", fileExplorerLeaves.length);
        
        if (fileExplorerLeaves.length === 0) {
            logError("No file explorer leaf found");
            return;
        }
        
        const fileExplorerLeaf = fileExplorerLeaves[0];
        this.app.workspace.revealLeaf(fileExplorerLeaf);
        log("File explorer leaf revealed");
        
        // Get file explorer and process folder
        const fileExplorer = this.getFileExplorer();
        if (!fileExplorer) return;
        
        try {
            // Expand parent folders first
            this.expandParentFolders(folder, fileExplorer);
            
            // Reveal the target folder
            log("Revealing target folder:", folder.path);
            fileExplorer.revealInFolder(folder);
            
            // Expand target folder if setting is enabled
            if (this.plugin.settings.expandTargetFolder && folder instanceof TFolder) {
                log("Attempting to expand target folder:", folder.path);
                this.tryToExpandFolderViaDOM(folder.path);
            }
            
            // Highlight the folder
            this.highlightFolder(folder);
            
        } catch (error) {
            logError("Error in folder navigation:", error);
        }
    }
}
