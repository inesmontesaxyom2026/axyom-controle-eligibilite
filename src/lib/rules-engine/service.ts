import { prisma } from "@/lib/prisma";
import type { TypeRegle } from "@prisma/client";
import type { RegleConditionsInput } from "./validation";

interface PorteeRegle {
  profilId?: string;
  dossierId?: string;
  projetId?: string;
}

interface DonneesRegle {
  portee: PorteeRegle;
  type: TypeRegle;
  libelle: string;
  description?: string;
  conditions: RegleConditionsInput;
  creeParId: string;
}

/** Crée une règle en version 1 (aucune règle existante sur ce libellé/portée). */
export async function creerRegle(donnees: DonneesRegle) {
  return prisma.regle.create({
    data: {
      profilId: donnees.portee.profilId,
      dossierId: donnees.portee.dossierId,
      projetId: donnees.portee.projetId,
      type: donnees.type,
      libelle: donnees.libelle,
      description: donnees.description,
      conditions: donnees.conditions as unknown as object,
      version: 1,
      actif: true,
      creeParId: donnees.creeParId,
    },
  });
}

/**
 * Remplace une règle par une nouvelle version (section 7 : les règles doivent pouvoir évoluer
 * sans casser les contrôles déjà réalisés). L'ancienne version est désactivée mais conservée :
 * les anomalies passées qui la référencent (Anomalie.regleId + regleVersion) restent traçables.
 */
export async function creerNouvelleVersionRegle(
  regleActuelleId: string,
  donnees: Pick<DonneesRegle, "libelle" | "description" | "conditions" | "creeParId">,
) {
  const regleActuelle = await prisma.regle.findUniqueOrThrow({ where: { id: regleActuelleId } });

  return prisma.$transaction(async (tx) => {
    await tx.regle.update({
      where: { id: regleActuelle.id },
      data: { actif: false, dateFin: new Date() },
    });

    return tx.regle.create({
      data: {
        profilId: regleActuelle.profilId,
        dossierId: regleActuelle.dossierId,
        projetId: regleActuelle.projetId,
        type: regleActuelle.type,
        libelle: donnees.libelle,
        description: donnees.description,
        conditions: donnees.conditions as unknown as object,
        version: regleActuelle.version + 1,
        actif: true,
        versionPrecedenteId: regleActuelle.id,
        creeParId: donnees.creeParId,
      },
    });
  });
}
