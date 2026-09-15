"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { estAdmin } from "@/lib/auth/acces";

export interface EtatFormulaireUtilisateur {
  erreur?: string;
  succes?: boolean;
}

export async function creerUtilisateur(
  _etatPrecedent: EtatFormulaireUtilisateur,
  formData: FormData,
): Promise<EtatFormulaireUtilisateur> {
  if (!(await estAdmin())) return { erreur: "Réservé à l'administrateur." };

  const nom = formData.get("nom")?.toString().trim();
  const email = formData.get("email")?.toString().trim().toLowerCase();
  const motDePasse = formData.get("motDePasse")?.toString();
  const role = formData.get("role")?.toString() as Role | undefined;

  if (!nom || !email || !motDePasse || !role) return { erreur: "Tous les champs sont obligatoires." };
  if (motDePasse.length < 8) return { erreur: "Le mot de passe doit contenir au moins 8 caractères." };

  const motDePasseHash = await bcrypt.hash(motDePasse, 12);

  try {
    await prisma.user.create({ data: { nom, email, motDePasseHash, role } });
  } catch {
    return { erreur: "Un utilisateur avec cette adresse e-mail existe déjà." };
  }

  revalidatePath("/admin/utilisateurs");
  return { succes: true };
}

export async function desactiverUtilisateur(formData: FormData) {
  if (!(await estAdmin())) throw new Error("Réservé à l'administrateur.");
  const userId = formData.get("userId")?.toString();
  if (!userId) return;

  await prisma.user.update({ where: { id: userId }, data: { actif: false } });
  revalidatePath("/admin/utilisateurs");
}
