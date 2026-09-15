import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/i18n";
import { creerDossier, creerProjet } from "./actions";

export default async function PageAdminDossiers() {
  const [dossiers, clients, profils] = await Promise.all([
    prisma.dossier.findMany({
      include: { client: true, projets: { include: { profil: { include: { bailleur: true } } } } },
      orderBy: { creeLe: "desc" },
    }),
    prisma.client.findMany({ orderBy: { nom: "asc" } }),
    prisma.profil.findMany({ orderBy: { libelle: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Dossiers et projets</h1>

      {clients.length === 0 ? (
        <p className="text-sm text-slate-500">
          Ajoutez d&apos;abord un <Link href="/admin/clients" className="underline">client</Link>.
        </p>
      ) : (
        <form action={creerDossier} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <label className="flex flex-col gap-1 text-sm">
            Nom du dossier
            <input name="nom" required className="rounded border border-slate-300 px-3 py-2" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Client
            <select name="clientId" required className="rounded border border-slate-300 px-3 py-2">
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.nom}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
            Créer le dossier
          </button>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {dossiers.map((dossier) => (
          <div key={dossier.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between">
              <Link href={`/dossiers/${dossier.id}`} className="font-medium hover:underline">
                {dossier.nom}
              </Link>
              <span className="text-sm text-slate-500">{dossier.client.nom}</span>
            </div>

            <ul className="mt-2 flex flex-col gap-1 text-sm text-slate-600">
              {dossier.projets.map((projet) => (
                <li key={projet.id}>
                  {projet.nom} — {projet.profil.bailleur.nom} × {projet.profil.pays}
                </li>
              ))}
            </ul>

            {profils.length === 0 ? (
              <p className="mt-2 text-xs text-slate-400">
                Ajoutez d&apos;abord un <Link href="/admin/profils" className="underline">profil</Link> pour créer un projet.
              </p>
            ) : (
              <form action={creerProjet} className="mt-3 flex flex-wrap items-end gap-2">
                <input type="hidden" name="dossierId" value={dossier.id} />
                <input name="nom" placeholder="Nom du projet" required className="rounded border border-slate-300 px-2 py-1 text-sm" />
                <select name="profilId" required className="rounded border border-slate-300 px-2 py-1 text-sm">
                  {profils.map((profil) => (
                    <option key={profil.id} value={profil.id}>
                      {profil.libelle}
                    </option>
                  ))}
                </select>
                <input name="departement" placeholder={d.projets.departement} className="rounded border border-slate-300 px-2 py-1 text-sm" />
                <input name="typeDepense" placeholder={d.projets.typeDepense} className="rounded border border-slate-300 px-2 py-1 text-sm" />
                <select name="niveauService" className="rounded border border-slate-300 px-2 py-1 text-sm">
                  <option value="NIVEAU_1">Niveau 1</option>
                  <option value="NIVEAU_2">Niveau 2</option>
                  <option value="NIVEAU_3">Niveau 3</option>
                </select>
                <button type="submit" className="rounded bg-slate-100 px-3 py-1 text-sm hover:bg-slate-200">
                  {d.commun.boutons.ajouter} un projet
                </button>
              </form>
            )}
          </div>
        ))}
        {dossiers.length === 0 && <p className="text-slate-500">{d.commun.etats.aucunResultat}</p>}
      </div>
    </div>
  );
}
