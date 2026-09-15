// Interface commune de stockage des fichiers sources (pièces justificatives).
// Deux implémentations : LocalStorageProvider (dev/test) et GcsStorageProvider (déploiement réel).
// Le reste de l'application ne dépend jamais d'un fournisseur en particulier.

export interface UploadResult {
  storageKey: string;
}

export interface StorageProvider {
  /** Enregistre un fichier et retourne la clé permettant de le retrouver plus tard. */
  upload(params: {
    buffer: Buffer;
    suggestedName: string;
    mimeType: string;
  }): Promise<UploadResult>;

  /** Retourne les octets du fichier pour une clé donnée (ex. pour l'extraction ou le téléchargement). */
  getBuffer(storageKey: string): Promise<Buffer>;

  /** Supprime le fichier (ex. purge liée à la durée de conservation configurée). */
  delete(storageKey: string): Promise<void>;
}
