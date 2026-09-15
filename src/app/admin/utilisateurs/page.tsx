import { prisma } from "@/lib/prisma";
import { d } from "@/lib/i18n";
import { CreerUtilisateurForm } from "@/components/creer-utilisateur-form";
import { desactiverUtilisateur } from "./actions";

export default async function PageUtilisateurs() {
  const utilisateurs = await prisma.user.findMany({ orderBy: { creeLe: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{d.admin.utilisateurs}</h1>

      <div className="flex flex-col gap-2">
        {utilisateurs.map((utilisateur) => (
          <div
            key={utilisateur.id}
            className="flex items-center justify-between rounded border border-slate-200 bg-white px-4 py-2"
          >
            <div>
              <span className="font-medium">{utilisateur.nom}</span>{" "}
              <span className="text-sm text-slate-500">({utilisateur.email})</span>{" "}
              <span className="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs">{utilisateur.role}</span>
              {!utilisateur.actif && (
                <span className="ml-2 rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">Désactivé</span>
              )}
            </div>
            {utilisateur.actif && (
              <form action={desactiverUtilisateur}>
                <input type="hidden" name="userId" value={utilisateur.id} />
                <button type="submit" className="text-xs text-red-600 underline">
                  Désactiver
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      <CreerUtilisateurForm />
    </div>
  );
}
