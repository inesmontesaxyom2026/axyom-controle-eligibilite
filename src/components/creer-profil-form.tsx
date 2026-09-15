"use client";

import { useActionState } from "react";
import { creerProfil, type EtatFormulaireProfil } from "@/app/admin/profils/actions";
import { d } from "@/lib/i18n";

const ETAT_INITIAL: EtatFormulaireProfil = {};

export function CreerProfilForm({ bailleurs }: { bailleurs: { id: string; nom: string }[] }) {
  const [etat, action, enCours] = useActionState(creerProfil, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <label className="flex flex-col gap-1 text-sm">
        Bailleur
        <select name="bailleurId" required className="rounded border border-slate-300 px-3 py-2">
          <option value="">Choisir…</option>
          {bailleurs.map((bailleur) => (
            <option key={bailleur.id} value={bailleur.id}>
              {bailleur.nom}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Pays
        <input name="pays" required className="rounded border border-slate-300 px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Type d&apos;organisation (optionnel)
        <select name="typeOrganisation" className="rounded border border-slate-300 px-3 py-2">
          <option value="">—</option>
          <option value="SIEGE">Siège</option>
          <option value="ANTENNE_LOCALE">Antenne locale</option>
          <option value="PARTENAIRE">Partenaire</option>
        </select>
      </label>
      <button type="submit" disabled={enCours} className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-50">
        {d.commun.boutons.ajouter}
      </button>
      {etat.erreur && <p className="w-full text-sm text-red-700">{etat.erreur}</p>}
      {etat.succes && <p className="w-full text-sm text-green-700">Profil créé.</p>}
    </form>
  );
}
