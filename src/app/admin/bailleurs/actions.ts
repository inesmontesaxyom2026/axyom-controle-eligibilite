"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { estAdmin } from "@/lib/auth/acces";

export async function creerBailleur(formData: FormData) {
  if (!(await estAdmin())) throw new Error("Réservé à l'administrateur.");

  const nom = formData.get("nom")?.toString().trim();
  const sigle = formData.get("sigle")?.toString().trim() || undefined;
  if (!nom) return;

  await prisma.bailleur.create({ data: { nom, sigle } });
  revalidatePath("/admin/bailleurs");
}
