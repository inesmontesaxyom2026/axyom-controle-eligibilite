import { prisma } from "@/lib/prisma";
import { d } from "@/lib/i18n";
import { creerClient } from "./actions";

export default async function PageClients() {
  const clients = await prisma.client.findMany({ orderBy: { nom: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Clients</h1>

      <div className="flex flex-col gap-2">
        {clients.map((client) => (
          <div key={client.id} className="rounded border border-slate-200 bg-white px-4 py-2">
            {client.nom}
          </div>
        ))}
        {clients.length === 0 && <p className="text-slate-500">{d.commun.etats.aucunResultat}</p>}
      </div>

      <form action={creerClient} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <input name="nom" placeholder="Nom du client (ONG, association…)" required className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm" />
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm text-white">
          {d.commun.boutons.ajouter}
        </button>
      </form>
    </div>
  );
}
