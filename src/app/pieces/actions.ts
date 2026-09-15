"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { peutAccederAuDossier } from "@/lib/auth/acces";
import { traiterPiece } from "@/lib/pipeline/traiter-piece";

export async function reessayerExtraction(formData: FormData) {
  const pieceId = formData.get("pieceId")?.toString();
  if (!pieceId) return;

  const piece = await prisma.piece.findUniqueOrThrow({
    where: { id: pieceId },
    include: { projet: true },
  });
  if (!(await peutAccederAuDossier(piece.projet.dossierId))) throw new Error("Accès refusé.");

  await traiterPiece(pieceId);
  revalidatePath(`/dossiers/${piece.projet.dossierId}/projets/${piece.projetId}`);
}
