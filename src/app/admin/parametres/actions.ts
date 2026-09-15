"use server";

import { revalidatePath } from "next/cache";
import { estAdmin } from "@/lib/auth/acces";
import { CLE_DUREE_CONSERVATION_JOURS, setParametre } from "@/lib/parametres";

export async function enregistrerDureeConservation(formData: FormData) {
  if (!(await estAdmin())) throw new Error("Réservé à l'administrateur.");

  const valeur = formData.get("dureeJours")?.toString().trim();
  if (!valeur || Number.isNaN(Number(valeur))) return;

  await setParametre(CLE_DUREE_CONSERVATION_JOURS, valeur);
  revalidatePath("/admin/parametres");
}
