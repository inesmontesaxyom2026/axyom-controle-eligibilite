import { collecterValeursReferencees, evaluerCondition, interpolerMessage } from "./evaluator";
import type { ConditionNode, ContexteEvaluation, RegleConditions, TypeAnomalieRegle } from "./types";

export * from "./types";
export { evaluerCondition, interpolerMessage } from "./evaluator";

/** Sous-ensemble des colonnes Prisma de Regle dont l'engine a besoin (évite de dépendre de @prisma/client ici). */
export interface RegleActive {
  id: string;
  version: number;
  conditions: unknown; // RegleConditions en JSON — structure validée à l'enregistrement, voir src/lib/rules-engine/validation.ts
}

export interface AnomalieCandidate {
  type: TypeAnomalieRegle | "A_DISCUTER";
  regleId: string | null;
  regleVersion: number | null;
  detailAutomatique: string;
}

/**
 * Applique un ensemble de règles actives à une pièce/projet et retourne les anomalies déclenchées.
 * Toute règle dont la condition est vraie produit une anomalie du type qu'elle définit.
 */
export function evaluerRegles(
  regles: RegleActive[],
  contexte: ContexteEvaluation,
): AnomalieCandidate[] {
  const candidats: AnomalieCandidate[] = [];

  for (const regle of regles) {
    const conditions = regle.conditions as RegleConditions;
    if (!conditions?.si || !conditions?.alors) continue;

    const declenchee = evaluerCondition(conditions.si, contexte);
    if (declenchee) {
      candidats.push({
        type: conditions.alors.typeAnomalie,
        regleId: regle.id,
        regleVersion: regle.version,
        detailAutomatique: interpolerMessage(conditions.alors.message, contexte),
      });
    }
  }

  return candidats;
}

/**
 * Heuristique "cas non couvert" (section 7 : "tout cas non couvert explicitement par une règle
 * existante doit être marqué automatiquement À DISCUTER"). On vérifie que le type de dépense de la
 * pièce est bien mentionné par au moins une règle active applicable — sinon personne n'a jamais
 * statué sur ce cas et on le remonte plutôt que de rester silencieux. C'est un point de départ
 * volontairement simple : à affiner avec l'équipe au fil de l'usage réel (voir ARCHITECTURE.md).
 */
export function detecterCasNonCouvert(
  regles: RegleActive[],
  contexte: ContexteEvaluation,
): AnomalieCandidate | null {
  const typeDepense = contexte.piece?.typeDepense ?? contexte.projet?.typeDepense;
  if (typeof typeDepense !== "string" || typeDepense.length === 0) return null;

  const valeursReferencees = new Set<string>();
  for (const regle of regles) {
    const conditions = regle.conditions as RegleConditions;
    if (!conditions?.si) continue;
    collecterValeursReferencees(conditions.si as ConditionNode, "piece.typeDepense", valeursReferencees);
    collecterValeursReferencees(conditions.si as ConditionNode, "projet.typeDepense", valeursReferencees);
  }

  if (valeursReferencees.has(typeDepense)) return null;

  return {
    type: "A_DISCUTER",
    regleId: null,
    regleVersion: null,
    detailAutomatique: `Aucune règle active ne couvre explicitement le type de dépense "${typeDepense}" — à valider manuellement avant de conclure à la conformité.`,
  };
}
