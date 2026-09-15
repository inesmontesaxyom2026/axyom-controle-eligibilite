// Interface commune d'extraction des données depuis une pièce justificative (section 8 du prompt de cadrage).
// Le pipeline appelle toujours ExtractionProvider.extract() sans connaître le fournisseur utilisé,
// pour pouvoir remplacer Claude par une alternative (Tesseract, Google Document AI, AWS Textract)
// si le test de fiabilité sur échantillon réel ne convient pas à l'échelle visée.

export interface DonneesExtraites {
  typeDocument: string | null;
  fournisseur: string | null;
  dateDocument: string | null; // format ISO (YYYY-MM-DD) si identifiable
  montantTotal: number | null;
  devise: string | null;
  typeDepense: string | null;
  numeroPiece: string | null;
  /** Champs additionnels trouvés mais non modélisés explicitement ci-dessus. */
  autresChamps: Record<string, string>;
  /** Niveau de confiance auto-déclaré par le fournisseur d'extraction (0 à 1), si disponible. */
  confiance: number | null;
}

export type ExtractionSuccess = {
  statut: "REUSSIE";
  donnees: DonneesExtraites;
};

export type ExtractionEchec = {
  statut: "ECHEC";
  raison: string;
};

export type ExtractionResult = ExtractionSuccess | ExtractionEchec;

export interface ExtractionProvider {
  extract(params: { buffer: Buffer; mimeType: string }): Promise<ExtractionResult>;
}
