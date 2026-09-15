"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { estAdmin } from "@/lib/auth/acces";

export async function creerClient(formData: FormData) {
  if (!(await estAdmin())) throw new Error("Réservé à l'administrateur.");

  const nom = formData.get("nom")?.toString().trim();
  if (!nom) return;

  await prisma.client.create({ data: { nom } });
  revalidatePath("/admin/clients");
}
