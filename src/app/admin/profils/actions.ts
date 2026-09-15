"use server";

import { revalidatePath } from "next/cache";
import type { TypeOrganisation } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { estAdmin } from "@/lib/auth/acces";

export interface EtatFormulaireProfil {
  erreur?: string;
  succes?: boolean;
}

export async function creerProfil(
  _etatPrecedent: EtatFormulaireProfil,
  formData: FormData,
): Promise<EtatFormulaireProfil> {
  if (!(await estAdmin())) return { erreur: "Réservé à l'administrateur." };

  const bailleurId = formData.get("bailleurId")?.toString();
  const pays = formData.get("pays")?.toString().trim();
  const typeOrganisationBrut = formData.get("typeOrganisation")?.toString();
  const typeOrganisation = (typeOrganisationBrut || undefined) as TypeOrganisation | undefined;

  if (!bailleurId || !pays) return { erreur: "Bailleur et pays sont obligatoires." };

  const bailleur = await prisma.bailleur.findUnique({ where: { id: bailleurId } });
  if (!bailleur) return { erreur: "Bailleur introuvable." };

  try {
    await prisma.profil.create({
      data: {
        bailleurId,
        pays,
        typeOrganisation,
        libelle: `${bailleur.nom} × ${pays}${typeOrganisation ? ` × ${typeOrganisation}` : ""}`,
      },
    });
  } catch {
    return { erreur: "Ce profil (bailleur × pays × type d'organisation) existe déjà." };
  }

  revalidatePath("/admin/profils");
  return { succes: true };
}
