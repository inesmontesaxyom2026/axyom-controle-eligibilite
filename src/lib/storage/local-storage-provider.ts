import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { randomUUID } from "node:crypto";
import type { StorageProvider, UploadResult } from "./types";

/**
 * Stockage sur disque local — utilisé uniquement en dev/test (voir .env : STORAGE_DRIVER=local).
 * Pour un déploiement réel, basculer vers GcsStorageProvider (aucun autre changement de code requis :
 * tout le reste de l'application passe par l'interface StorageProvider).
 */
export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly baseDir: string) {}

  async upload({
    buffer,
    suggestedName,
  }: {
    buffer: Buffer;
    suggestedName: string;
    mimeType: string;
  }): Promise<UploadResult> {
    const safeName = suggestedName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storageKey = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}-${safeName}`;
    const fullPath = join(this.baseDir, storageKey);
    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, buffer);
    return { storageKey };
  }

  async getBuffer(storageKey: string): Promise<Buffer> {
    return readFile(join(this.baseDir, storageKey));
  }

  async delete(storageKey: string): Promise<void> {
    await rm(join(this.baseDir, storageKey), { force: true });
  }
}
