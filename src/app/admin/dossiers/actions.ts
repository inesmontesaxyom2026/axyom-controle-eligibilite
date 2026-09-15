"use server";

import { revalidatePath } from "next/cache";
import type { NiveauService } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { estAdmin } from "@/lib/auth/acces";

export async function creerDossier(formData: FormData) {
  if (!(await estAdmin())) throw new Error("Réservé à l'administrateur.");

  const nom = formData.get("nom")?.toString().trim();
  const clientId = formData.get("clientId")?.toString();
  if (!nom || !clientId) return;

  await prisma.dossier.create({ data: { nom, clientId } });
  revalidatePath("/admin/dossiers");
}

export async function creerProjet(formData: FormData) {
  if (!(await estAdmin())) throw new Error("Réservé à l'administrateur.");

  const nom = formData.get("nom")?.toString().trim();
  const dossierId = formData.get("dossierId")?.toString();
  const profilId = formData.get("profilId")?.toString();
  const departement = formData.get("departement")?.toString().trim() || undefined;
  const typeDepense = formData.get("typeDepense")?.toString().trim() || undefined;
  const niveauService = (formData.get("niveauService")?.toString() || "NIVEAU_1") as NiveauService;

  if (!nom || !dossierId || !profilId) return;

  await prisma.projet.create({
    data: { nom, dossierId, profilId, departement, typeDepense, niveauService },
  });
  revalidatePath("/admin/dossiers");
}
