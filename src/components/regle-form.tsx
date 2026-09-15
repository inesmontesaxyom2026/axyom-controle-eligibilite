"use client";

import { useActionState } from "react";
import { enregistrerRegle, type EtatFormulaireRegle } from "@/app/regles/actions";
import { d } from "@/lib/i18n";

const GABARIT_CONDITIONS = `{
  "si": {
    "champ": "piece.montantTotal",
    "operateur": "superieur",
    "valeur": 1000
  },
  "alors": {
    "typeAnomalie": "CONTRACTUEL",
    "message": "Montant {{piece.montantTotal}} {{piece.devise}} supérieur au plafond autorisé pour ce type de dépense."
  }
}`;

const ETAT_INITIAL: EtatFormulaireRegle = {};

interface Props {
  pageARevalider: string;
  portee: { profilId?: string; dossierId?: string; projetId?: string };
  regleActuelle?: {
    id: string;
    libelle: string;
    description: string | null;
    conditions: unknown;
  };
}

export function RegleForm({ pageARevalider, portee, regleActuelle }: Props) {
  const [etat, action, enCours] = useActionState(enregistrerRegle, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <input type="hidden" name="pageARevalider" value={pageARevalider} />
      {regleActuelle && <input type="hidden" name="regleActuelleId" value={regleActuelle.id} />}
      {portee.profilId && <input type="hidden" name="profilId" value={portee.profilId} />}
      {portee.dossierId && <input type="hidden" name="dossierId" value={portee.dossierId} />}
      {portee.projetId && <input type="hidden" name="projetId" value={portee.projetId} />}

      {!regleActuelle && (
        <label className="flex flex-col gap-1 text-sm">
          {d.regles.type}
          <select name="type" required className="rounded border border-slate-300 px-3 py-2">
            <option value="LEGALE">{d.regles.types.LEGALE}</option>
            <option value="CONTRACTUELLE">{d.regles.types.CONTRACTUELLE}</option>
            <option value="PROCEDURE">{d.regles.types.PROCEDURE}</option>
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm">
        Libellé
        <input
          name="libelle"
          required
          defaultValue={regleActuelle?.libelle}
          className="rounded border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Description (optionnelle)
        <input
          name="description"
          defaultValue={regleActuelle?.description ?? ""}
          className="rounded border border-slate-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Conditions (JSON — voir ARCHITECTURE.md pour la syntaxe)
        <textarea
          name="conditionsJson"
          required
          rows={10}
          spellCheck={false}
          defaultValue={
            regleActuelle ? JSON.stringify(regleActuelle.conditions, null, 2) : GABARIT_CONDITIONS
          }
          className="rounded border border-slate-300 px-3 py-2 font-mono text-xs"
        />
      </label>

      {etat.erreur && <p className="text-sm text-red-700">{etat.erreur}</p>}
      {etat.succes && <p className="text-sm text-green-700">Règle enregistrée.</p>}

      <button
        type="submit"
        disabled={enCours}
        className="self-start rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {regleActuelle ? "Enregistrer une nouvelle version" : d.commun.boutons.ajouter}
      </button>
    </form>
  );
}
