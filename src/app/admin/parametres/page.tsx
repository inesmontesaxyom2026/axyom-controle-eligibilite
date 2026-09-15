import { d } from "@/lib/i18n";
import { CLE_DUREE_CONSERVATION_JOURS, getParametre } from "@/lib/parametres";
import { enregistrerDureeConservation } from "./actions";

export default async function PageParametres() {
  const dureeConservation = await getParametre(CLE_DUREE_CONSERVATION_JOURS);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{d.admin.parametres}</h1>

      <form
        action={enregistrerDureeConservation}
        className="flex max-w-md flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          {d.admin.dureeConservationJours}
          <input
            name="dureeJours"
            type="number"
            min={1}
            defaultValue={dureeConservation ?? ""}
            placeholder="Aucune limite si laissé vide"
            className="rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <p className="text-xs text-slate-500">
          Aucune purge automatique n&apos;est encore active dans cette version — ce paramètre sert
          de référence pour une future tâche de nettoyage (voir ARCHITECTURE.md).
        </p>
        <button type="submit" className="self-start rounded bg-slate-900 px-4 py-2 text-sm text-white">
          {d.commun.boutons.enregistrer}
        </button>
      </form>
    </div>
  );
}
