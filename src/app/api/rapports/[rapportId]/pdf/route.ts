import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { peutAccederAuDossier } from "@/lib/auth/acces";
import { genererPdfRapport } from "@/lib/reports/pdf";
import type { ContenuRapport } from "@/lib/reports/types";

export async function GET(
  _requete: NextRequest,
  { params }: { params: Promise<{ rapportId: string }> },
) {
  const { rapportId } = await params;
  const rapport = await prisma.rapport.findUnique({ where: { id: rapportId } });
  if (!rapport?.dossierId || !(await peutAccederAuDossier(rapport.dossierId))) {
    return NextResponse.json({ erreur: "Accès refusé." }, { status: 403 });
  }

  const pdf = await genererPdfRapport(rapport.contenu as unknown as ContenuRapport);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="rapport-${rapport.version}.pdf"`,
    },
  });
}
