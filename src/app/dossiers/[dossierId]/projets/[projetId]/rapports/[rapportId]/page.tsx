import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { peutAccederAuDossier } from "@/lib/auth/acces";
import { d } from "@/lib/i18n";
import { RapportApercu } from "@/components/rapport-apercu";
import { changerStatutRapport } from "@/app/rapports/actions";
import type { ContenuRapport } from "@/lib/reports/types";

export default async function PageRapport({
  params,
}: PageProps<"/dossiers/[dossierId]/projets/[projetId]/rapports/[rapportId]">) {
  const { dossierId, projetId, rapportId } = await params;
  if (!(await peutAccederAuDossier(dossierId))) notFound();

  const rapport = await prisma.rapport.findUnique({ where: { id: rapportId } });
  if (!rapport || rapport.projetId !== projetId) notFound();

  const contenu = rapport.contenu as unknown as ContenuRapport;

  return (
    <div className="flex flex-col gap-4">
      <Link href={`/dossiers/${dossierId}/projets/${projetId}`} className="text-sm text-slate-500 underline">
        ← Retour au projet
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="rounded bg-slate-100 px-2 py-1">
            {d.rapports.version} {rapport.version}
          </span>
          <span className="rounded bg-slate-100 px-2 py-1">{d.rapports.statuts[rapport.statut]}</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/rapports/${rapport.id}/pdf`}
            className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
          >
            {d.commun.boutons.exporterPdf}
          </a>
          <a
            href={`/api/rapports/${rapport.id}/excel`}
            className="rounded border border-slate-300 px-3 py-2 text-sm hover:bg-slate-100"
          >
            {d.commun.boutons.exporterExcel}
          </a>
          {rapport.statut === "BROUILLON" && (
            <form action={changerStatutRapport}>
              <input type="hidden" name="rapportId" value={rapport.id} />
              <input type="hidden" name="statut" value="VALIDE" />
              <button type="submit" className="rounded bg-green-700 px-3 py-2 text-sm text-white">
                {d.commun.boutons.valider}
              </button>
            </form>
          )}
          {rapport.statut === "VALIDE" && (
            <form action={changerStatutRapport}>
              <input type="hidden" name="rapportId" value={rapport.id} />
              <input type="hidden" name="statut" value="ENVOYE" />
              <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-sm text-white">
                Marquer envoyé au client
              </button>
            </form>
          )}
        </div>
      </div>

      <RapportApercu contenu={contenu} />
    </div>
  );
}
