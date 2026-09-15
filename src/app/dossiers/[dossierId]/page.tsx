import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { peutAccederAuDossier, utilisateurCourant } from "@/lib/auth/acces";
import { d } from "@/lib/i18n";
import { RegleListe } from "@/components/regle-liste";
import { RegleForm } from "@/components/regle-form";
import { assignerConsultant, retirerAssignation } from "../actions";

export default async function PageDossier({ params }: PageProps<"/dossiers/[dossierId]">) {
  const { dossierId } = await params;

  if (!(await peutAccederAuDossier(dossierId))) notFound();

  const utilisateur = await utilisateurCourant();
  const dossier = await prisma.dossier.findUnique({
    where: { id: dossierId },
    include: {
      client: true,
      projets: { include: { profil: { include: { bailleur: true } } } },
      regles: { include: { creePar: true }, orderBy: [{ libelle: "asc" }, { version: "desc" }] },
      assignations: { include: { user: true } },
    },
  });
  if (!dossier) notFound();

  const tousLesConsultants = utilisateur?.role === "ADMIN"
    ? await prisma.user.findMany({ where: { role: "CONSULTANT", actif: true } })
    : [];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold">{dossier.nom}</h1>
        <p className="text-slate-500">
          {d.dossiers.client} : {dossier.client.nom}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">{d.dossiers.projets}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {dossier.projets.map((projet) => (
            <Link
              key={projet.id}
              href={`/dossiers/${dossier.id}/projets/${projet.id}`}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-400"
            >
              <p className="font-medium">{projet.nom}</p>
              <p className="mt-1 text-sm text-slate-500">
                {projet.profil.bailleur.nom} × {projet.profil.pays}
              </p>
              <p className="mt-1 text-xs text-slate-400">{d.projets.statuts[projet.statutConformite]}</p>
            </Link>
          ))}
          {dossier.projets.length === 0 && <p className="text-slate-500">{d.commun.etats.aucunResultat}</p>}
        </div>
      </section>

      {utilisateur?.role === "ADMIN" && (
        <section>
          <h2 className="mb-3 text-lg font-medium">Consultants assignés</h2>
          <div className="flex flex-col gap-2">
            {dossier.assignations.map((assignation) => (
              <form
                key={assignation.id}
                action={retirerAssignation}
                className="flex items-center gap-3 rounded border border-slate-200 bg-white px-3 py-2"
              >
                <input type="hidden" name="dossierId" value={dossier.id} />
                <input type="hidden" name="assignationId" value={assignation.id} />
                <span className="flex-1 text-sm">{assignation.user.nom}</span>
                <button type="submit" className="text-xs text-red-600 underline">
                  {d.commun.boutons.supprimer}
                </button>
              </form>
            ))}
            <form action={assignerConsultant} className="flex items-center gap-2">
              <input type="hidden" name="dossierId" value={dossier.id} />
              <select name="userId" required className="rounded border border-slate-300 px-3 py-2 text-sm">
                <option value="">Choisir un consultant…</option>
                {tousLesConsultants.map((consultant) => (
                  <option key={consultant.id} value={consultant.id}>
                    {consultant.nom}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded bg-slate-900 px-3 py-2 text-xs text-white">
                {d.commun.boutons.ajouter}
              </button>
            </form>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-medium">Règles spécifiques à ce dossier</h2>
        <p className="mb-3 text-sm text-slate-500">
          S&apos;ajoutent aux règles générales du profil de chaque projet — elles ne les remplacent jamais silencieusement.
        </p>
        <RegleListe
          pageARevalider={`/dossiers/${dossier.id}`}
          portee={{ dossierId: dossier.id }}
          regles={dossier.regles.map((regle) => ({
            id: regle.id,
            libelle: regle.libelle,
            description: regle.description,
            type: regle.type,
            version: regle.version,
            actif: regle.actif,
            dateCreation: regle.dateCreation.toISOString(),
            dateFin: regle.dateFin?.toISOString() ?? null,
            conditions: regle.conditions,
            creePar: regle.creePar.nom,
          }))}
        />
        <div className="mt-4">
          <RegleForm pageARevalider={`/dossiers/${dossier.id}`} portee={{ dossierId: dossier.id }} />
        </div>
      </section>
    </div>
  );
}
