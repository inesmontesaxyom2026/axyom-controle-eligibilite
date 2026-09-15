"use client";

import { useActionState } from "react";
import { creerUtilisateur, type EtatFormulaireUtilisateur } from "@/app/admin/utilisateurs/actions";
import { d } from "@/lib/i18n";

const ETAT_INITIAL: EtatFormulaireUtilisateur = {};

export function CreerUtilisateurForm() {
  const [etat, action, enCours] = useActionState(creerUtilisateur, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <label className="flex flex-col gap-1 text-sm">
        Nom
        <input name="nom" required className="rounded border border-slate-300 px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {d.connexion.email}
        <input name="email" type="email" required className="rounded border border-slate-300 px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Mot de passe provisoire
        <input
          name="motDePasse"
          type="password"
          required
          minLength={8}
          className="rounded border border-slate-300 px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Rôle
        <select name="role" required className="rounded border border-slate-300 px-3 py-2">
          <option value="CONSULTANT">Consultant</option>
          <option value="ADMIN">Administrateur</option>
        </select>
      </label>
      {etat.erreur && <p className="text-sm text-red-700">{etat.erreur}</p>}
      {etat.succes && <p className="text-sm text-green-700">Utilisateur créé.</p>}
      <button
        type="submit"
        disabled={enCours}
        className="self-start rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {d.commun.boutons.ajouter}
      </button>
    </form>
  );
}
