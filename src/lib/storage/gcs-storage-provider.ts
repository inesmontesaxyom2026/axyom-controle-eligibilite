import type { StorageProvider, UploadResult } from "./types";

/**
 * Stockage objet Google Cloud Storage — à activer pour le déploiement réel (région Belgique
 * "europe-west1" recommandée, voir ARCHITECTURE.md § Hébergement).
 *
 * Non installée par défaut pour garder le MVP léger : pour l'activer,
 *   npm install @google-cloud/storage
 * puis décommenter le corps de cette classe et régler STORAGE_DRIVER=gcs dans .env.
 */
export class GcsStorageProvider implements StorageProvider {
  constructor(
    private readonly bucketName: string,
    private readonly projectId: string,
  ) {
    if (!bucketName || !projectId) {
      throw new Error(
        "GcsStorageProvider requiert GCS_BUCKET_NAME et GCS_PROJECT_ID dans .env",
      );
    }
  }

  async upload(_params: {
    buffer: Buffer;
    suggestedName: string;
    mimeType: string;
  }): Promise<UploadResult> {
    throw new Error(
      "GcsStorageProvider n'est pas encore branché : installez @google-cloud/storage " +
        "et implémentez upload() (voir commentaire en tête de fichier). " +
        `Bucket cible : ${this.bucketName} (projet ${this.projectId}).`,
    );
  }

  async getBuffer(_storageKey: string): Promise<Buffer> {
    throw new Error("GcsStorageProvider.getBuffer() non implémenté — voir upload().");
  }

  async delete(_storageKey: string): Promise<void> {
    throw new Error("GcsStorageProvider.delete() non implémenté — voir upload().");
  }
}
