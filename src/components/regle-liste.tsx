"use client";

import { useState } from "react";
import { RegleForm } from "./regle-form";
import { d } from "@/lib/i18n";

export interface RegleAffichable {
  id: string;
  libelle: string;
  description: string | null;
  type: "LEGALE" | "CONTRACTUELLE" | "PROCEDURE";
  version: number;
  actif: boolean;
  dateCreation: string;
  dateFin: string | null;
  conditions: unknown;
  creePar: string;
}

interface Props {
  regles: RegleAffichable[];
  pageARevalider: string;
  portee: { profilId?: string; dossierId?: string; projetId?: string };
}

export function RegleListe({ regles, pageARevalider, portee }: Props) {
  const [regleEnEdition, setRegleEnEdition] = useState<string | null>(null);
  const [afficherHistorique, setAfficherHistorique] = useState(false);

  const reglesVisibles = regles.filter((regle) => regle.actif || afficherHistorique);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{d.regles.titre}</h3>
        <button
          type="button"
          onClick={() => setAfficherHistorique((v) => !v)}
          className="text-xs text-slate-500 underline"
        >
          {afficherHistorique ? "Masquer l'historique" : d.regles.journal}
        </button>
      </div>

      {reglesVisibles.length === 0 && <p className="text-sm text-slate-500">{d.commun.etats.aucunResultat}</p>}

      {reglesVisibles.map((regle) => (
        <div key={regle.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="mr-2 rounded bg-slate-100 px-2 py-0.5 text-xs">{d.regles.types[regle.type]}</span>
              <span className="font-medium">{regle.libelle}</span>
              <span className="ml-2 text-xs text-slate-400">
                {d.regles.version} {regle.version}
              </span>
              {!regle.actif && (
                <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                  {d.regles.inactive}
                </span>
              )}
            </div>
            {regle.actif && (
              <button
                type="button"
                onClick={() => setRegleEnEdition(regleEnEdition === regle.id ? null : regle.id)}
                className="text-xs text-slate-500 underline"
              >
                {regleEnEdition === regle.id ? d.commun.boutons.annuler : "Nouvelle version"}
              </button>
            )}
          </div>
          {regle.description && <p className="mt-1 text-sm text-slate-500">{regle.description}</p>}
          <p className="mt-1 text-xs text-slate-400">
            Créée le {new Date(regle.dateCreation).toLocaleDateString("fr-FR")} par {regle.creePar}
            {regle.dateFin && ` — remplacée le ${new Date(regle.dateFin).toLocaleDateString("fr-FR")}`}
          </p>

          {regleEnEdition === regle.id && (
            <div className="mt-3">
              <RegleForm pageARevalider={pageARevalider} portee={portee} regleActuelle={regle} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
