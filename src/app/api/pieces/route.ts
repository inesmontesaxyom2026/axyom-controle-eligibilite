import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorageProvider } from "@/lib/storage";
import { peutAccederAuDossier } from "@/lib/auth/acces";
import { traiterPiece } from "@/lib/pipeline/traiter-piece";

/**
 * Dépôt d'une pièce justificative (formulaire HTML classique, multipart/form-data) : enregistrement
 * du fichier dans le StorageProvider actif, création de la ligne Piece, puis extraction + règles
 * (voir src/lib/pipeline/traiter-piece.ts). Un échec d'extraction ne bloque pas la réponse : il est
 * remonté comme anomalie (section 8 du prompt de cadrage).
 */
export async function POST(requete: NextRequest) {
  const formData = await requete.formData();
  const projetId = formData.get("projetId")?.toString();
  const fichier = formData.get("fichier");

  if (!projetId || !(fichier instanceof File) || fichier.size === 0) {
    return NextResponse.json({ erreur: "projetId et fichier sont requis." }, { status: 400 });
  }

  const projet = await prisma.projet.findUnique({ where: { id: projetId } });
  if (!projet) return NextResponse.json({ erreur: "Projet introuvable." }, { status: 404 });
  if (!(await peutAccederAuDossier(projet.dossierId))) {
    return NextResponse.json({ erreur: "Accès refusé." }, { status: 403 });
  }

  const buffer = Buffer.from(await fichier.arrayBuffer());
  const { storageKey } = await getStorageProvider().upload({
    buffer,
    suggestedName: fichier.name,
    mimeType: fichier.type || "application/octet-stream",
  });

  const piece = await prisma.piece.create({
    data: {
      projetId,
      nomFichierOriginal: fichier.name,
      storageKey,
      mimeType: fichier.type || "application/octet-stream",
      tailleOctets: buffer.byteLength,
    },
  });

  await traiterPiece(piece.id);

  return NextResponse.redirect(
    new URL(`/dossiers/${projet.dossierId}/projets/${projetId}`, requete.url),
    { status: 303 },
  );
}
