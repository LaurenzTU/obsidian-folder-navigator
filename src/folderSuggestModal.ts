import { App, FuzzySuggestModal, TFolder, WorkspaceLeaf } from "obsidian";
import type FolderNavigatorPlugin from "./main";

interface FileExplorerPlugin {
    instance: {
        revealInFolder: (folder: TFolder) => void;
        setCollapsed: (folder: TFolder, collapsed: boolean) => void;
    };
}

interface InternalPlugins {
    plugins: {
        "file-explorer": FileExplorerPlugin;
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
        const folders: TFolder[] = [];
        const rootFolder = this.app.vault.getRoot();

        const collectFolders = (folder: TFolder) => {
            folders.push(folder);
            folder.children.forEach((child) => {
                if (child instanceof TFolder) {
                    collectFolders(child);
                }
            });
        };

        collectFolders(rootFolder);
        return folders;
    }

    getItems(): TFolder[] {
        return this.folders;
    }

    getItemText(folder: TFolder): string {
        return folder.path;
    }

    onChooseItem(folder: TFolder): void {
        // Get the file explorer leaf
        const fileExplorerLeaf =
            this.app.workspace.getLeavesOfType("file-explorer")[0];
        if (!fileExplorerLeaf) return;

        // Ensure the file explorer is visible
        this.app.workspace.revealLeaf(fileExplorerLeaf);

        // Get the file explorer instance
        const fileExplorer = (this.app as ExtendedApp).internalPlugins.plugins[
            "file-explorer"
        ].instance;
        if (!fileExplorer) return;

        // Expand parent folders if needed
        if (folder.parent && folder.parent.path) {
            const pathParts = folder.parent.path.split("/");
            let currentPath = "";

            // Expand each parent folder
            for (const part of pathParts) {
                if (part) {
                    currentPath += (currentPath ? "/" : "") + part;
                    const parentFolder =
                        this.app.vault.getAbstractFileByPath(currentPath);
                    if (parentFolder && parentFolder instanceof TFolder) {
                        fileExplorer.revealInFolder(parentFolder);
                        fileExplorer.setCollapsed(parentFolder, false);
                    }
                }
            }
        }

        // Reveal the target folder
        fileExplorer.revealInFolder(folder);

        // Wait for the DOM to update
        setTimeout(() => {
            // Find and highlight the folder element
            const folderPath = folder.path;
            const folderEl = document.querySelector(
                `.nav-folder-title[data-path="${folderPath}"]`,
            );

            if (folderEl) {
                // Scroll the folder into view
                folderEl.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });

                // Add highlight class and remove after 2 seconds
                folderEl.addClass("nav-folder-title-highlighted");
                setTimeout(
                    () => folderEl.removeClass("nav-folder-title-highlighted"),
                    2000,
                );

                // If expandTargetFolder is enabled, expand the target folder
                if (this.plugin.settings.expandTargetFolder) {
                    const collapseIndicator =
                        folderEl.querySelector(".collapse-icon");
                    if (collapseIndicator) {
                        const isCollapsed =
                            collapseIndicator.classList.contains(
                                "is-collapsed",
                            );
                        if (isCollapsed) {
                            (collapseIndicator as HTMLElement).click();
                        }
                    }
                }
            }
        }, 50);
    }
}
