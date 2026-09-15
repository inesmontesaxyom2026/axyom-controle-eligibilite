// Schéma des conditions de règle (section 7 du prompt de cadrage) : conditions simples
// (plafond numérique, présence/absence) et combinées (ET/OU/NON), stocké dans Regle.conditions (Json).

export type Operateur =
  | "egal"
  | "different"
  | "superieur"
  | "superieur_egal"
  | "inferieur"
  | "inferieur_egal"
  | "contient"
  | "ne_contient_pas"
  | "present"
  | "absent";

export interface ConditionSimple {
  champ: string; // chemin pointé dans le contexte d'évaluation, ex. "piece.montantTotal"
  operateur: Operateur;
  valeur?: string | number | boolean;
}

export interface ConditionEt {
  et: ConditionNode[];
}

export interface ConditionOu {
  ou: ConditionNode[];
}

export interface ConditionNon {
  non: ConditionNode;
}

export type ConditionNode = ConditionSimple | ConditionEt | ConditionOu | ConditionNon;

export type TypeAnomalieRegle =
  | "LEGAL"
  | "CONTRACTUEL"
  | "PROCEDURE"
  | "FORMATAGE"
  | "INFO_MANQUANTE_ESSENTIELLE"
  | "INFO_MANQUANTE"
  | "INFO_INCOHERENTE"
  | "PIECE_MANQUANTE";

export interface RegleConditions {
  si: ConditionNode;
  alors: {
    typeAnomalie: TypeAnomalieRegle;
    // Gabarit de message, ex. "Montant {{piece.montantTotal}} supérieur au plafond autorisé."
    message: string;
  };
}

/** Contexte plat mis à disposition de l'évaluateur pour une pièce donnée. */
export interface ContexteEvaluation {
  projet: Record<string, unknown>;
  piece?: Record<string, unknown>;
  /** Types de document (donneesExtraites.typeDocument) déjà déposés pour ce projet. */
  piecesTypesPresents: string[];
}
