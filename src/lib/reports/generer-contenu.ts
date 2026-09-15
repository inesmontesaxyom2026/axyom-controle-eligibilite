import { prisma } from "@/lib/prisma";
import { d } from "@/lib/i18n";
import type { ContenuRapport, SectionRapport } from "./types";

const ORDRE_SECTIONS = [
  "LEGAL",
  "CONTRACTUEL",
  "PROCEDURE",
  "FORMATAGE",
  "INFO_MANQUANTE_ESSENTIELLE",
  "INFO_MANQUANTE",
  "INFO_INCOHERENTE",
  "PIECE_MANQUANTE",
  "A_DISCUTER",
] as const;

/**
 * Construit le contenu structuré d'un rapport pour un projet, à partir des anomalies déjà
 * validées par l'opérateur (voir section 5 du prompt de cadrage : jamais de restitution sans
 * validation humaine — cette fonction est appelée uniquement après validation, voir la route
 * d'API qui l'invoque).
 */
export async function genererContenuRapportProjet(projetId: string): Promise<ContenuRapport> {
  const projet = await prisma.projet.findUniqueOrThrow({
    where: { id: projetId },
    include: {
      dossier: { include: { client: true } },
      profil: { include: { bailleur: true } },
      pieces: true,
      anomalies: { include: { piece: true, regle: true } },
    },
  });

  const sections: SectionRapport[] = ORDRE_SECTIONS.map((type) => ({
    titre: d.anomalies.types[type],
    anomalies: projet.anomalies
      .filter((anomalie) => anomalie.type === type)
      .map((anomalie) => ({
        pieceNom: anomalie.piece?.nomFichierOriginal ?? null,
        type: d.anomalies.types[type],
        detailAutomatique: anomalie.detailAutomatique,
        detailOperateur: anomalie.detailOperateur,
        statutValidation: d.anomalies.statutsValidation[anomalie.statutValidation],
        regleLibelle: anomalie.regle?.libelle ?? null,
      })),
  })).filter((section) => section.anomalies.length > 0);

  const parType: Record<string, number> = {};
  for (const type of ORDRE_SECTIONS) {
    const total = projet.anomalies.filter((anomalie) => anomalie.type === type).length;
    if (total > 0) parType[d.anomalies.types[type]] = total;
  }

  return {
    titre: `Rapport de contrôle — ${projet.nom}`,
    genereLe: new Date().toISOString(),
    client: projet.dossier.client.nom,
    dossier: projet.dossier.nom,
    projets: [
      {
        nom: projet.nom,
        profil: `${projet.profil.bailleur.nom} × ${projet.profil.pays}`,
        statutConformite: d.projets.statuts[projet.statutConformite],
        suiviBudgetaire: projet.suiviBudgetaire?.toString() ?? null,
        soldeAvancesPartenaires: projet.soldeAvancesPartenaires?.toString() ?? null,
      },
    ],
    resume: {
      totalPieces: projet.pieces.length,
      totalAnomalies: projet.anomalies.length,
      parType,
    },
    sections,
  };
}
