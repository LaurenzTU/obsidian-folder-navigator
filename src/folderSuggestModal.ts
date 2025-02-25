import { App, FuzzySuggestModal, TFolder, View } from "obsidian";

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
        const fileExplorer =
            this.app.workspace.getLeavesOfType("file-explorer")[0];
        if (!fileExplorer) return;

        const view = fileExplorer.view as any;

        // Ensure the file explorer is visible
        this.app.workspace.revealLeaf(fileExplorer);

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
                    view.expandFolder(parentFolder, true);
                }
            }
        }

        // Expand the target folder itself
        view.expandFolder(folder, true);

        // Scroll the folder into view
        const fileItem = view.fileItems[folder.path];
        if (fileItem) {
            fileItem.el.scrollIntoView({ behavior: "smooth", block: "center" });
            // Highlight the folder temporarily
            fileItem.el.addClass("nav-folder-title-highlighted");
            setTimeout(
                () => fileItem.el.removeClass("nav-folder-title-highlighted"),
                2000,
            );
        }
    }
}
