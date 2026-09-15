import type { ConditionNode, ContexteEvaluation } from "./types";

function getValeurAuChemin(contexte: ContexteEvaluation, chemin: string): unknown {
  return chemin
    .split(".")
    .reduce<unknown>(
      (acc, cle) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[cle] : undefined),
      contexte as unknown,
    );
}

/** Évalue un arbre de conditions (simples et/ou combinées) contre un contexte donné. */
export function evaluerCondition(noeud: ConditionNode, contexte: ContexteEvaluation): boolean {
  if ("et" in noeud) {
    return noeud.et.every((enfant) => evaluerCondition(enfant, contexte));
  }
  if ("ou" in noeud) {
    return noeud.ou.some((enfant) => evaluerCondition(enfant, contexte));
  }
  if ("non" in noeud) {
    return !evaluerCondition(noeud.non, contexte);
  }

  const valeurContexte = getValeurAuChemin(contexte, noeud.champ);

  switch (noeud.operateur) {
    case "present":
      return valeurContexte !== undefined && valeurContexte !== null && valeurContexte !== "";
    case "absent":
      return valeurContexte === undefined || valeurContexte === null || valeurContexte === "";
    case "egal":
      return valeurContexte === noeud.valeur;
    case "different":
      return valeurContexte !== noeud.valeur;
    case "superieur":
      return typeof valeurContexte === "number" && typeof noeud.valeur === "number" && valeurContexte > noeud.valeur;
    case "superieur_egal":
      return typeof valeurContexte === "number" && typeof noeud.valeur === "number" && valeurContexte >= noeud.valeur;
    case "inferieur":
      return typeof valeurContexte === "number" && typeof noeud.valeur === "number" && valeurContexte < noeud.valeur;
    case "inferieur_egal":
      return typeof valeurContexte === "number" && typeof noeud.valeur === "number" && valeurContexte <= noeud.valeur;
    case "contient":
      return Array.isArray(valeurContexte) && valeurContexte.includes(noeud.valeur);
    case "ne_contient_pas":
      return Array.isArray(valeurContexte) && !valeurContexte.includes(noeud.valeur);
    default:
      return false;
  }
}

/** Remplace les {{chemin.champ}} d'un gabarit de message par leur valeur dans le contexte. */
export function interpolerMessage(gabarit: string, contexte: ContexteEvaluation): string {
  return gabarit.replace(/{{\s*([\w.]+)\s*}}/g, (_correspondance, chemin: string) => {
    const valeur = getValeurAuChemin(contexte, chemin);
    return valeur === undefined || valeur === null ? "?" : String(valeur);
  });
}

/** Collecte les valeurs littérales comparées à un champ donné dans un ensemble de règles (pour heuristique "À DISCUTER"). */
export function collecterValeursReferencees(noeud: ConditionNode, champCible: string, sortie: Set<string>): void {
  if ("et" in noeud) {
    noeud.et.forEach((enfant) => collecterValeursReferencees(enfant, champCible, sortie));
    return;
  }
  if ("ou" in noeud) {
    noeud.ou.forEach((enfant) => collecterValeursReferencees(enfant, champCible, sortie));
    return;
  }
  if ("non" in noeud) {
    collecterValeursReferencees(noeud.non, champCible, sortie);
    return;
  }
  if (noeud.champ === champCible && noeud.valeur !== undefined) {
    sortie.add(String(noeud.valeur));
  }
}
