import { LocalStorageProvider } from "./local-storage-provider";
import { GcsStorageProvider } from "./gcs-storage-provider";
import type { StorageProvider } from "./types";

export type { StorageProvider, UploadResult } from "./types";

let cached: StorageProvider | null = null;

/** Fournisseur de stockage actif, choisi via STORAGE_DRIVER (voir .env.example). */
export function getStorageProvider(): StorageProvider {
  if (cached) return cached;

  const driver = process.env.STORAGE_DRIVER ?? "local";

  if (driver === "gcs") {
    cached = new GcsStorageProvider(
      process.env.GCS_BUCKET_NAME ?? "",
      process.env.GCS_PROJECT_ID ?? "",
    );
  } else {
    cached = new LocalStorageProvider(process.env.STORAGE_LOCAL_DIR ?? "./storage-local");
  }

  return cached;
}
