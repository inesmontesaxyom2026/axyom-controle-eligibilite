import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { peutAccederAuDossier } from "@/lib/auth/acces";
import { genererExcelRapport } from "@/lib/reports/excel";
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

  const excel = await genererExcelRapport(rapport.contenu as unknown as ContenuRapport);
  return new NextResponse(new Uint8Array(excel), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="rapport-${rapport.version}.xlsx"`,
    },
  });
}
