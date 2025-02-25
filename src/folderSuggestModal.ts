import { App, FuzzySuggestModal, TFolder } from "obsidian";

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
        // Reveal the folder in the navigation
        const leaf = this.app.workspace.getLeaf();
        this.app.workspace.revealLeaf(leaf);

        // Focus the folder in the file explorer
        const fileExplorer =
            this.app.workspace.getLeavesOfType("file-explorer")[0];
        if (fileExplorer) {
            const fileExplorerView = fileExplorer.view as any;
            fileExplorerView.revealFolder(folder);
        }
    }
}
