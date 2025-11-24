import fs from "fs/promises";
import path from "path";
import { StorageAdapter } from "./storage-adapter";

export class JsonFileStorageAdapter implements StorageAdapter {
    constructor(private readonly storagePath: string) { }

    private getFilePath(collection: string): string {
        return path.join(this.storagePath, `${collection}.json`);
    }

    private async ensureDirectory(): Promise<void> {
        try {
            await fs.access(this.storagePath);
        } catch {
            await fs.mkdir(this.storagePath, { recursive: true });
        }
    }

    async readCollection<T>(collection: string): Promise<T[]> {
        await this.ensureDirectory();
        const filePath = this.getFilePath(collection);
        try {
            const data = await fs.readFile(filePath, "utf-8");
            return JSON.parse(data) as T[];
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
                return [];
            }
            throw error;
        }
    }

    async writeCollection<T>(collection: string, records: T[]): Promise<void> {
        await this.ensureDirectory();
        const filePath = this.getFilePath(collection);
        await fs.writeFile(filePath, JSON.stringify(records, null, 2), "utf-8");
    }
}
