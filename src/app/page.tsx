import Link from "next/link";
import { dossiersAccessibles, utilisateurCourant } from "@/lib/auth/acces";
import { d } from "@/lib/i18n";

export default async function PageAccueil() {
  const utilisateur = await utilisateurCourant();
  const dossiers = await dossiersAccessibles();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">
        {utilisateur?.role === "ADMIN" ? d.dossiers.titreListeAdmin : d.dossiers.titreListe}
      </h1>

      {dossiers.length === 0 ? (
        <p className="text-slate-500">{d.commun.etats.aucunResultat}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dossiers.map((dossier) => (
            <Link
              key={dossier.id}
              href={`/dossiers/${dossier.id}`}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-400"
            >
              <p className="font-medium">{dossier.nom}</p>
              <p className="mt-1 text-sm text-slate-500">
                {d.dossiers.client} : {dossier.client.nom}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {d.dossiers.creeLe} {new Date(dossier.creeLe).toLocaleDateString("fr-FR")}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
