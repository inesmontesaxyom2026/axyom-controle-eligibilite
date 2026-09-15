import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";
import { getExtractionProvider } from "@/lib/extraction";
import { detecterCasNonCouvert, evaluerRegles, type RegleActive } from "@/lib/rules-engine";
import type { ContexteEvaluation } from "@/lib/rules-engine/types";
import type { DonneesExtraites } from "@/lib/extraction/types";

/**
 * Récupère les règles actives applicables à un projet : générales (rattachées à son Profil)
 * + spécifiques (rattachées à son Dossier ou directement au Projet) — voir section 7 (hiérarchie
 * des règles) du prompt de cadrage. Les règles spécifiques s'ajoutent, elles ne remplacent jamais
 * silencieusement les règles générales.
 */
async function reglesApplicables(projetId: string): Promise<RegleActive[]> {
  const projet = await prisma.projet.findUniqueOrThrow({ where: { id: projetId } });

  const regles = await prisma.regle.findMany({
    where: {
      actif: true,
      OR: [
        { profilId: projet.profilId },
        { dossierId: projet.dossierId },
        { projetId: projet.id },
      ],
    },
  });

  return regles.map((regle) => ({ id: regle.id, version: regle.version, conditions: regle.conditions }));
}

async function construireContexte(projetId: string, donneesExtraites: DonneesExtraites | null): Promise<ContexteEvaluation> {
  const projet = await prisma.projet.findUniqueOrThrow({ where: { id: projetId } });

  const piecesReussies = await prisma.piece.findMany({
    where: { projetId, statutExtraction: "REUSSIE" },
    select: { donneesExtraites: true },
  });

  const piecesTypesPresents = piecesReussies
    .map((piece) => (piece.donneesExtraites as DonneesExtraites | null)?.typeDocument)
    .filter((type): type is string => typeof type === "string" && type.length > 0);

  return {
    projet: {
      typeDepense: projet.typeDepense,
      departement: projet.departement,
      niveauService: projet.niveauService,
      suiviBudgetaire: projet.suiviBudgetaire ? Number(projet.suiviBudgetaire) : null,
      soldeAvancesPartenaires: projet.soldeAvancesPartenaires ? Number(projet.soldeAvancesPartenaires) : null,
    },
    piece: donneesExtraites
      ? {
          typeDocument: donneesExtraites.typeDocument,
          fournisseur: donneesExtraites.fournisseur,
          dateDocument: donneesExtraites.dateDocument,
          montantTotal: donneesExtraites.montantTotal,
          devise: donneesExtraites.devise,
          typeDepense: donneesExtraites.typeDepense,
          numeroPiece: donneesExtraites.numeroPiece,
        }
      : undefined,
    piecesTypesPresents,
  };
}

/**
 * Traite une pièce déposée : extraction puis évaluation des règles applicables.
 * Ne bloque jamais silencieusement (section 8) : un échec d'extraction devient une anomalie.
 * Les anomalies automatiques non encore validées par un opérateur sont régénérées à chaque
 * nouveau traitement (ex. nouvel essai d'extraction) pour ne pas accumuler de doublons.
 */
export async function traiterPiece(pieceId: string): Promise<void> {
  const piece = await prisma.piece.findUniqueOrThrow({ where: { id: pieceId } });
  const storage = getStorageProvider();
  const buffer = await storage.getBuffer(piece.storageKey);

  const resultat = await getExtractionProvider().extract({ buffer, mimeType: piece.mimeType });

  await prisma.anomalie.deleteMany({
    where: { pieceId, statutValidation: "EN_ATTENTE" },
  });

  if (resultat.statut === "ECHEC") {
    await prisma.piece.update({
      where: { id: pieceId },
      data: { statutExtraction: "ECHEC", erreurExtraction: resultat.raison, donneesExtraites: undefined },
    });
    await prisma.anomalie.create({
      data: {
        projetId: piece.projetId,
        pieceId: piece.id,
        type: "INFO_MANQUANTE_ESSENTIELLE",
        detailAutomatique: `Échec de l'extraction automatique : ${resultat.raison} Une vérification manuelle du document est nécessaire.`,
      },
    });
    return;
  }

  await prisma.piece.update({
    where: { id: pieceId },
    data: {
      statutExtraction: "REUSSIE",
      donneesExtraites: resultat.donnees as unknown as object,
      erreurExtraction: null,
    },
  });

  const [regles, contexte] = await Promise.all([
    reglesApplicables(piece.projetId),
    construireContexte(piece.projetId, resultat.donnees),
  ]);

  const candidats = evaluerRegles(regles, contexte);
  const casNonCouvert = detecterCasNonCouvert(regles, contexte);
  if (casNonCouvert) candidats.push(casNonCouvert);

  if (candidats.length > 0) {
    await prisma.anomalie.createMany({
      data: candidats.map((candidat) => ({
        projetId: piece.projetId,
        pieceId: piece.id,
        type: candidat.type,
        regleId: candidat.regleId,
        regleVersion: candidat.regleVersion,
        detailAutomatique: candidat.detailAutomatique,
      })),
    });
  }
}
