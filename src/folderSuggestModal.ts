import { App, FuzzySuggestModal, TFolder, WorkspaceLeaf, View } from "obsidian";
import type FolderNavigatorPlugin from "./main";

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

    private escapePath(path: string): string {
        return CSS.escape(path);
    }

    private tryToExpandFolderViaDOM(path: string): void {
        setTimeout(() => {
            console.log("Trying to expand folder via DOM:", path);
            const escapedPath = this.escapePath(path);
            
            const selectors = [
                `.nav-folder-title[data-path="${escapedPath}"]`,
                `.nav-file-title[data-path="${escapedPath}"]`,
                `[data-path="${escapedPath}"]`
            ];
            
            let folderElement: HTMLElement | null = null;
            
            for (const selector of selectors) {
                const el = document.querySelector(selector);
                if (el instanceof HTMLElement) {
                    folderElement = el;
                    console.log("Found folder element using selector:", selector);
                    break;
                }
            }
            
            if (!folderElement) {
                console.log("Folder element not found in DOM via direct selectors, trying alternative approach");
                
                const allElements = document.querySelectorAll('[data-path]');
                console.log("Total elements with data-path:", allElements.length);
                
                const samplePaths = Array.from(allElements).slice(0, 5)
                    .map(el => el.getAttribute('data-path'));
                console.log("Sample paths in DOM:", samplePaths);
                
                for (const el of Array.from(allElements)) {
                    const elPath = el.getAttribute('data-path');
                    if (elPath && (elPath === path || path.endsWith(elPath) || elPath.endsWith(path))) {
                        folderElement = el as HTMLElement;
                        console.log("Found folder by partial path match:", elPath);
                        break;
                    }
                }
            }
            
            if (folderElement) {
                const collapseIndicator = folderElement.querySelector('.nav-folder-collapse-indicator');
                if (collapseIndicator instanceof HTMLElement) {
                    const parentEl = folderElement.closest('.nav-folder');
                    const isCollapsed = parentEl?.classList.contains('is-collapsed') ||
                                      collapseIndicator.classList.contains('is-collapsed');
                    
                    if (isCollapsed) {
                        console.log("Clicking collapse indicator to expand folder");
                        collapseIndicator.click();
                    } else {
                        console.log("Folder already appears to be expanded");
                    }
                } else {
                    console.log("No collapse indicator found, might not be expandable");
                }
            } else {
                console.log("Could not find folder element in DOM:", path);
            }
        }, 100);
    }

    onChooseItem(folder: TFolder): void {
        console.log("Folder selected:", folder.path);
        
        const fileExplorerLeaves = this.app.workspace.getLeavesOfType("file-explorer");
        console.log("File explorer leaves found:", fileExplorerLeaves.length);
        
        if (fileExplorerLeaves.length === 0) {
            console.error("No file explorer leaf found");
            return;
        }
        
        const fileExplorerLeaf = fileExplorerLeaves[0];
        
        this.app.workspace.revealLeaf(fileExplorerLeaf);
        console.log("File explorer leaf revealed");
        
        try {
            const app = this.app as ExtendedApp;
            if (!app.internalPlugins?.plugins["file-explorer"]?.instance) {
                console.error("Could not find file explorer plugin instance");
                return;
            }
            
            const fileExplorer = app.internalPlugins.plugins["file-explorer"].instance;
            console.log("File explorer methods:", 
                Object.getOwnPropertyNames(Object.getPrototypeOf(fileExplorer))
                    .filter(m => typeof (fileExplorer as any)[m] === 'function'));
            
            if (typeof fileExplorer.revealInFolder !== 'function') {
                console.error("revealInFolder method not found");
                return;
            }
            
            if (folder.parent && folder.parent.path) {
                console.log("Processing parent folders for:", folder.parent.path);
                
                const pathParts = folder.parent.path.split("/");
                let currentPath = "";
                
                for (const part of pathParts) {
                    if (part) {
                        currentPath += (currentPath ? "/" : "") + part;
                        console.log("Processing parent path:", currentPath);
                        
                        const parentFolder = this.app.vault.getAbstractFileByPath(currentPath);
                        if (parentFolder instanceof TFolder) {
                            console.log("Revealing parent folder:", parentFolder.path);
                            fileExplorer.revealInFolder(parentFolder);
                            
                            this.tryToExpandFolderViaDOM(parentFolder.path);
                        }
                    }
                }
            }
            
            console.log("Revealing target folder:", folder.path);
            fileExplorer.revealInFolder(folder);
            
            if (this.plugin.settings.expandTargetFolder && folder instanceof TFolder) {
                console.log("Attempting to expand target folder:", folder.path);
                this.tryToExpandFolderViaDOM(folder.path);
            }
            
            setTimeout(() => {
                console.log("Looking for folder to highlight:", folder.path);
                
                const escapedPath = this.escapePath(folder.path);
                
                const selectors = [
                    `.nav-folder-title[data-path="${escapedPath}"]`,
                    `.nav-file-title[data-path="${escapedPath}"]`,
                    `[data-path="${escapedPath}"]`
                ];
                
                let folderElement: HTMLElement | null = null;
                
                for (const selector of selectors) {
                    const el = document.querySelector(selector);
                    if (el instanceof HTMLElement) {
                        folderElement = el;
                        console.log("Found folder element for highlighting using selector:", selector);
                        break;
                    }
                }
                
                if (!folderElement) {
                    console.log("Trying broader approach to find folder element");
                    
                    const allElements = document.querySelectorAll('[data-path]');
                    for (const el of Array.from(allElements)) {
                        const elPath = el.getAttribute('data-path');
                        if (elPath && (elPath === folder.path || folder.path.endsWith(elPath))) {
                            folderElement = el as HTMLElement;
                            console.log("Found folder by partial match:", elPath);
                            break;
                        }
                    }
                    
                    if (!folderElement) {
                        const pathSamples = Array.from(allElements).slice(0, 10)
                            .map(el => el.getAttribute('data-path'));
                        console.log("Sample data-path values:", pathSamples);
                    }
                }
                
                if (folderElement) {
                    console.log("Scrolling folder into view");
                    folderElement.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                    
                    console.log("Adding highlight class");
                    folderElement.classList.add("nav-folder-title-highlighted");
                    
                    setTimeout(() => {
                        if (folderElement) {
                            folderElement.classList.remove("nav-folder-title-highlighted");
                        }
                    }, 2000);
                } else {
                    console.error("Could not find folder element to highlight");
                }
            }, 300);
            
        } catch (error) {
            console.error("Error in folder navigation:", error);
        }
    }
}
