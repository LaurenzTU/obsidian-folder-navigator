import { App, FuzzySuggestModal, TFolder, WorkspaceLeaf, View } from "obsidian";
import type FolderNavigatorPlugin from "./main";

// Helper function for conditional logging based on plugin settings
function log(message: string, plugin: FolderNavigatorPlugin, ...args: any[]): void {
    if (plugin.settings.debugMode) {
        console.log(message, ...args);
    }
}

// Helper function for error logging (always show errors)
function logError(message: string, ...args: any[]): void {
    console.error(message, ...args);
}

interface FileExplorerView extends View {
    fileItems: Record<string, any>;
    expandFolder?: (folder: TFolder) => void;  // Optional: may not exist in all versions
}

interface FileExplorerInstance {
    view: FileExplorerView;
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
        
        // Use the max results from settings
        this.limit = this.plugin.settings.maxResults;
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
     * Get all parent folders of a given folder in order from root to leaf
     */
    private getParentFolderChain(folder: TFolder): TFolder[] {
        const parentChain: TFolder[] = [];
        let currentFolder: TFolder | null = folder.parent;
        
        while (currentFolder) {
            parentChain.unshift(currentFolder); // Add at beginning to get root->leaf order
            currentFolder = currentFolder.parent;
        }
        
        return parentChain;
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
            
            if (typeof fileExplorer.revealInFolder !== "function") {
                logError("revealInFolder method not found on file explorer instance");
                return null;
            }

            // Log available methods for debugging
            if (this.plugin.settings.debugMode) {
                log("File explorer instance methods:", this.plugin);
                const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(fileExplorer));
                log(methods.join(", "), this.plugin);
                
                if (fileExplorer.view) {
                    log("File explorer view methods:", this.plugin);
                    const viewMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(fileExplorer.view));
                    log(viewMethods.join(", "), this.plugin);
                }
            }

            return fileExplorer;
        } catch (error) {
            logError(`Error accessing file explorer: ${error}`);
            return null;
        }
    }

    /**
     * Event handler for when a folder is chosen from the suggestion list
     */
    onChooseItem(folder: TFolder): void {
        log(`Folder selected: "${folder.path}" (name: "${folder.name}")`, this.plugin);
        
        try {
            // Close the modal first
            this.close();
            
            // Make sure the file explorer is visible
            const fileExplorerLeaves = this.app.workspace.getLeavesOfType("file-explorer");
            if (fileExplorerLeaves.length === 0) {
                logError("No file explorer leaf found");
                return;
            }
            
            const fileExplorerLeaf = fileExplorerLeaves[0];
            this.app.workspace.revealLeaf(fileExplorerLeaf);
            log("File explorer leaf revealed", this.plugin);
            
            // Get the file explorer instance
            const fileExplorer = this.getFileExplorer();
            if (!fileExplorer) {
                logError("Failed to get file explorer instance");
                return;
            }
            
            // Step 1: Reveal the folder in the file explorer
            log(`Revealing folder in explorer: "${folder.path}"`, this.plugin);
            fileExplorer.revealInFolder(folder);
            
            // Step 2: Wait a bit for the UI to update, then expand folders using DOM
            setTimeout(() => {
                if (this.plugin.settings.expandTargetFolder) {
                    // Get all parent folders in order
                    log(`Expanding parent folders for: "${folder.path}"`, this.plugin);
                    const parentFolders = this.getParentFolderChain(folder);
                    log(`Parent chain: ${parentFolders.map(f => f.name).join(" -> ")}`, this.plugin);
                    
                    // First, expand all parent folders in order from root to leaf
                    parentFolders.forEach((parentFolder, index) => {
                        // Use increasing delays to ensure proper sequence
                        setTimeout(() => {
                            this.expandFolderByDOMClick(parentFolder.name);
                        }, index * 50);
                    });
                    
                    // Then expand the target folder itself (after parents are expanded)
                    setTimeout(() => {
                        log(`Expanding target folder: "${folder.name}"`, this.plugin);
                        this.expandFolderByDOMClick(folder.name);
                        
                        // Highlight the folder after expansion
                        setTimeout(() => {
                            this.highlightFolderInDOM(folder.name);
                        }, 200);
                    }, parentFolders.length * 50 + 100);
                } else {
                    // Just highlight the folder if we're not expanding
                    setTimeout(() => {
                        this.highlightFolderInDOM(folder.name);
                    }, 200);
                }
            }, 100);
        } catch (error) {
            logError(`Error in folder navigation: ${error}`);
        }
    }
    
    /**
     * Expand a folder by finding and clicking its title directly in the DOM
     */
    private expandFolderByDOMClick(folderName: string): void {
        try {
            log(`Looking for folder to expand: "${folderName}"`, this.plugin);
            
            // Find all folder title content elements
            const allTitleContents = document.querySelectorAll(".nav-folder-title-content");
            
            for (const titleContent of Array.from(allTitleContents)) {
                if (titleContent.textContent === folderName) {
                    log(`Found folder title content: "${folderName}"`, this.plugin);
                    
                    // Get the title element
                    const titleElement = titleContent.closest(".nav-folder-title");
                    if (!(titleElement instanceof HTMLElement)) {
                        log(`Could not find title element for: "${folderName}"`, this.plugin);
                        continue;
                    }
                    
                    // Get the folder element
                    const folderElement = titleContent.closest(".nav-folder");
                    if (!(folderElement instanceof HTMLElement)) {
                        log(`Could not find folder element for: "${folderName}"`, this.plugin);
                        continue;
                    }
                    
                    // Check if it's collapsed
                    if (folderElement.classList.contains("is-collapsed")) {
                        log(`Folder is collapsed, clicking title to expand: "${folderName}"`, this.plugin);
                        // Click the title element directly - this is more reliable than the collapse indicator
                        titleElement.click();
                        return;
                    } else {
                        log(`Folder already expanded: "${folderName}"`, this.plugin);
                        return;
                    }
                }
            }
            
            log(`Could not find folder with name: "${folderName}"`, this.plugin);
        } catch (error) {
            logError(`Error expanding folder: ${error}`);
        }
    }
    
    /**
     * Highlight a folder in the DOM by finding and styling its title
     */
    private highlightFolderInDOM(folderName: string): void {
        try {
            log(`Looking for folder to highlight: "${folderName}"`, this.plugin);
            
            // Find all folder title content elements
            const allTitleContents = document.querySelectorAll(".nav-folder-title-content");
            
            for (const titleContent of Array.from(allTitleContents)) {
                if (titleContent.textContent === folderName) {
                    log(`Found folder to highlight: "${folderName}"`, this.plugin);
                    
                    // Get the title element
                    const titleElement = titleContent.closest(".nav-folder-title");
                    if (!(titleElement instanceof HTMLElement)) {
                        continue;
                    }
                    
                    // Scroll into view
                    titleElement.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                    
                    // Add highlighting class
                    titleElement.classList.add("nav-folder-title-highlighted");
                    
                    // Remove after delay
                    setTimeout(() => {
                        titleElement.classList.remove("nav-folder-title-highlighted");
                    }, 2000);
                    
                    return;
                }
            }
            
            log(`Could not find folder to highlight: "${folderName}"`, this.plugin);
        } catch (error) {
            logError(`Error highlighting folder: ${error}`);
        }
    }
}
