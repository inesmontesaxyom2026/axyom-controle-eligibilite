"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { StatutRapport } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { peutAccederAuDossier, utilisateurCourant } from "@/lib/auth/acces";
import { genererContenuRapportProjet } from "@/lib/reports/generer-contenu";

export interface EtatGenerationRapport {
  erreur?: string;
}

/**
 * Génère un nouveau rapport pour un projet. Bloque tant qu'il reste des anomalies non validées
 * par un opérateur (section 5 : "l'outil ne restitue jamais un résultat non validé par un humain").
 */
export async function genererRapport(
  _etatPrecedent: EtatGenerationRapport,
  formData: FormData,
): Promise<EtatGenerationRapport> {
  const projetId = formData.get("projetId")?.toString();
  if (!projetId) return { erreur: "Projet manquant." };

  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return { erreur: "Non authentifié." };

  const projet = await prisma.projet.findUniqueOrThrow({ where: { id: projetId } });
  if (!(await peutAccederAuDossier(projet.dossierId))) return { erreur: "Accès refusé." };

  const anomaliesEnAttente = await prisma.anomalie.count({
    where: { projetId, statutValidation: "EN_ATTENTE" },
  });
  if (anomaliesEnAttente > 0) {
    return {
      erreur: `${anomaliesEnAttente} anomalie(s) restent à valider avant de pouvoir générer le rapport.`,
    };
  }

  const derniereVersion = await prisma.rapport.findFirst({
    where: { projetId },
    orderBy: { version: "desc" },
  });

  const contenu = await genererContenuRapportProjet(projetId);

  const rapport = await prisma.rapport.create({
    data: {
      projetId,
      dossierId: projet.dossierId,
      version: (derniereVersion?.version ?? 0) + 1,
      contenu: contenu as unknown as object,
      statut: "BROUILLON",
      genereParId: utilisateur.id,
    },
  });

  redirect(`/dossiers/${projet.dossierId}/projets/${projetId}/rapports/${rapport.id}`);
}

export async function changerStatutRapport(formData: FormData) {
  const rapportId = formData.get("rapportId")?.toString();
  const statut = formData.get("statut")?.toString() as StatutRapport | undefined;
  if (!rapportId || !statut) return;

  const rapport = await prisma.rapport.findUniqueOrThrow({
    where: { id: rapportId },
    include: { projet: true },
  });
  if (!rapport.projet) return;
  if (!(await peutAccederAuDossier(rapport.projet.dossierId))) throw new Error("Accès refusé.");

  await prisma.rapport.update({ where: { id: rapportId }, data: { statut } });
  revalidatePath(`/dossiers/${rapport.projet.dossierId}/projets/${rapport.projetId}/rapports/${rapportId}`);
}
