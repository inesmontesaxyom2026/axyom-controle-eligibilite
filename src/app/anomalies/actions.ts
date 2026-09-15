"use server";

import { revalidatePath } from "next/cache";
import type { StatutValidation } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { peutAccederAuDossier } from "@/lib/auth/acces";

const STATUTS_VALIDES: StatutValidation[] = ["VALIDEE", "REJETEE", "CORRIGEE"];

/**
 * Validation humaine obligatoire d'une anomalie (section 5 du prompt de cadrage) : l'opérateur
 * confirme, rejette ou corrige le constat automatique avant toute restitution au client.
 */
export async function validerAnomalie(formData: FormData) {
  const anomalieId = formData.get("anomalieId")?.toString();
  const statut = formData.get("statut")?.toString() as StatutValidation | undefined;
  const detailOperateur = formData.get("detailOperateur")?.toString() || null;

  if (!anomalieId || !statut || !STATUTS_VALIDES.includes(statut)) return;

  const anomalie = await prisma.anomalie.findUniqueOrThrow({
    where: { id: anomalieId },
    include: { projet: true },
  });
  if (!(await peutAccederAuDossier(anomalie.projet.dossierId))) throw new Error("Accès refusé.");

  await prisma.anomalie.update({
    where: { id: anomalieId },
    data: { statutValidation: statut, detailOperateur, valideeLe: new Date() },
  });

  revalidatePath(`/dossiers/${anomalie.projet.dossierId}/projets/${anomalie.projetId}`);
}
