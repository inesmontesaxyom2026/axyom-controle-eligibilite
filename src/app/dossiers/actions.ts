"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { estAdmin } from "@/lib/auth/acces";

export async function assignerConsultant(formData: FormData) {
  if (!(await estAdmin())) throw new Error("Réservé à l'administrateur.");

  const dossierId = formData.get("dossierId")?.toString();
  const userId = formData.get("userId")?.toString();
  if (!dossierId || !userId) return;

  await prisma.dossierAssignment.upsert({
    where: { userId_dossierId: { userId, dossierId } },
    create: { userId, dossierId },
    update: {},
  });
  revalidatePath(`/dossiers/${dossierId}`);
}

export async function retirerAssignation(formData: FormData) {
  if (!(await estAdmin())) throw new Error("Réservé à l'administrateur.");

  const dossierId = formData.get("dossierId")?.toString();
  const assignationId = formData.get("assignationId")?.toString();
  if (!dossierId || !assignationId) return;

  await prisma.dossierAssignment.delete({ where: { id: assignationId } });
  revalidatePath(`/dossiers/${dossierId}`);
}
