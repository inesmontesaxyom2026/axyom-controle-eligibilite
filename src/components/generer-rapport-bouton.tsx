"use client";

import { useActionState } from "react";
import { genererRapport, type EtatGenerationRapport } from "@/app/rapports/actions";
import { d } from "@/lib/i18n";

const ETAT_INITIAL: EtatGenerationRapport = {};

export function GenererRapportBouton({ projetId }: { projetId: string }) {
  const [etat, action, enCours] = useActionState(genererRapport, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col items-start gap-2">
      <input type="hidden" name="projetId" value={projetId} />
      <button
        type="submit"
        disabled={enCours}
        className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {d.rapports.genererNouveau}
      </button>
      {etat.erreur && <p className="text-sm text-red-700">{etat.erreur}</p>}
    </form>
  );
}
