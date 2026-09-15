import { prisma } from "@/lib/prisma";
import { d } from "@/lib/i18n";
import { creerBailleur } from "./actions";

export default async function PageBailleurs() {
  const bailleurs = await prisma.bailleur.findMany({ orderBy: { nom: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{d.admin.bailleurs}</h1>

      <div className="flex flex-col gap-2">
        {bailleurs.map((bailleur) => (
          <div key={bailleur.id} className="rounded border border-slate-200 bg-white px-4 py-2">
            {bailleur.nom} {bailleur.sigle && <span className="text-slate-400">({bailleur.sigle})</span>}
          </div>
        ))}
        {bailleurs.length === 0 && <p className="text-slate-500">{d.commun.etats.aucunResultat}</p>}
      </div>

      <form action={creerBailleur} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <input name="nom" placeholder="Nom (ex. Commission européenne)" required className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm" />
        <input name="sigle" placeholder="Sigle (ex. INTPA)" className="w-32 rounded border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          {d.commun.boutons.ajouter}
        </button>
      </form>
    </div>
  );
}
