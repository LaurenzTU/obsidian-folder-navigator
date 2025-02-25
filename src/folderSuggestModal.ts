import { App, FuzzySuggestModal, TFolder, WorkspaceLeaf } from "obsidian";

export class FolderSuggestModal extends FuzzySuggestModal<TFolder> {
    folders: TFolder[];

    constructor(app: App) {
        super(app);
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
        const fileExplorer = (this.app as any).internalPlugins.plugins[
            "file-explorer"
        ].instance;
        if (!fileExplorer) return;

        // Expand parent folders if needed
        if (folder.parent && folder.parent.path) {
            const pathParts = folder.parent.path.split("/");
            let currentPath = "";

            // Expand each parent folder
            for (const part of pathParts) {
                currentPath += (currentPath ? "/" : "") + part;
                const parentFolder =
                    this.app.vault.getAbstractFileByPath(currentPath);
                if (parentFolder && parentFolder instanceof TFolder) {
                    fileExplorer.revealInFolder(parentFolder);
                }
            }
        }

        // Reveal the target folder
        fileExplorer.revealInFolder(folder);

        // Wait for the DOM to update
        setTimeout(() => {
            // Find and highlight the folder element
            const folderEl = fileExplorerLeaf.view.containerEl.querySelector(
                `[data-path="${folder.path}"]`,
            );
            if (folderEl) {
                folderEl.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
                folderEl.addClass("nav-folder-title-highlighted");
                setTimeout(
                    () => folderEl.removeClass("nav-folder-title-highlighted"),
                    2000,
                );
            }
        }, 50);
    }
}
