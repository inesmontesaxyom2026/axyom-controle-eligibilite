"use server";

import { revalidatePath } from "next/cache";
import type { TypeRegle } from "@prisma/client";
import { utilisateurCourant } from "@/lib/auth/acces";
import { regleConditionsSchema } from "@/lib/rules-engine/validation";
import { creerNouvelleVersionRegle, creerRegle } from "@/lib/rules-engine/service";

export interface EtatFormulaireRegle {
  erreur?: string;
  succes?: boolean;
}

/**
 * Enregistre une règle (nouvelle ou nouvelle version d'une règle existante) depuis le formulaire
 * d'administration/de dossier. Les conditions sont saisies en JSON par l'opérateur — voir
 * ARCHITECTURE.md pour la syntaxe et des exemples ; un éditeur visuel pourra remplacer ce champ
 * dans une itération future sans changer le modèle de données.
 */
export async function enregistrerRegle(
  _etatPrecedent: EtatFormulaireRegle,
  formData: FormData,
): Promise<EtatFormulaireRegle> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return { erreur: "Non authentifié." };

  const regleActuelleId = formData.get("regleActuelleId")?.toString() || undefined;
  const libelle = formData.get("libelle")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || undefined;
  const conditionsBrutes = formData.get("conditionsJson")?.toString() ?? "";
  const pageARevalider = formData.get("pageARevalider")?.toString();

  if (!libelle) return { erreur: "Le libellé est obligatoire." };

  let conditionsJson: unknown;
  try {
    conditionsJson = JSON.parse(conditionsBrutes);
  } catch {
    return { erreur: "Le champ conditions n'est pas un JSON valide." };
  }

  const analyse = regleConditionsSchema.safeParse(conditionsJson);
  if (!analyse.success) {
    return { erreur: `Conditions invalides : ${analyse.error.issues[0]?.message ?? "format inattendu"}.` };
  }

  if (regleActuelleId) {
    await creerNouvelleVersionRegle(regleActuelleId, {
      libelle,
      description,
      conditions: analyse.data,
      creeParId: utilisateur.id,
    });
  } else {
    const type = formData.get("type")?.toString() as TypeRegle | undefined;
    if (!type) return { erreur: "Le référentiel (type de règle) est obligatoire." };

    await creerRegle({
      portee: {
        profilId: formData.get("profilId")?.toString() || undefined,
        dossierId: formData.get("dossierId")?.toString() || undefined,
        projetId: formData.get("projetId")?.toString() || undefined,
      },
      type,
      libelle,
      description,
      conditions: analyse.data,
      creeParId: utilisateur.id,
    });
  }

  if (pageARevalider) revalidatePath(pageARevalider);
  return { succes: true };
}
