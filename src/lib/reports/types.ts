// Structure du contenu d'un rapport (stockée telle quelle dans Rapport.contenu).
// Un même contenu sert à l'aperçu web, à l'export PDF et à l'export Excel — voir
// generer-contenu.ts (construction), html-template.ts (web/PDF) et excel.ts (Excel).

export interface AnomalieRapport {
  pieceNom: string | null;
  type: string; // libellé déjà traduit (voir src/lib/i18n)
  detailAutomatique: string;
  detailOperateur: string | null;
  statutValidation: string; // libellé déjà traduit
  regleLibelle: string | null;
}

export interface SectionRapport {
  titre: string;
  anomalies: AnomalieRapport[];
}

export interface ProjetRapport {
  nom: string;
  profil: string;
  statutConformite: string;
  suiviBudgetaire: string | null;
  soldeAvancesPartenaires: string | null;
}

export interface ContenuRapport {
  titre: string;
  genereLe: string; // ISO
  client: string;
  dossier: string;
  projets: ProjetRapport[];
  resume: {
    totalPieces: number;
    totalAnomalies: number;
    parType: Record<string, number>;
  };
  sections: SectionRapport[];
}
