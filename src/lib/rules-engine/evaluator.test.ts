import { describe, expect, it } from "vitest";
import { evaluerCondition, interpolerMessage } from "./evaluator";
import { detecterCasNonCouvert, evaluerRegles, type RegleActive } from "./index";
import type { ContexteEvaluation } from "./types";

describe("evaluerCondition", () => {
  it("évalue une condition simple (plafond numérique)", () => {
    const contexte: ContexteEvaluation = {
      projet: {},
      piece: { montantTotal: 6000 },
      piecesTypesPresents: [],
    };
    expect(
      evaluerCondition({ champ: "piece.montantTotal", operateur: "superieur", valeur: 5000 }, contexte),
    ).toBe(true);
    expect(
      evaluerCondition({ champ: "piece.montantTotal", operateur: "superieur", valeur: 7000 }, contexte),
    ).toBe(false);
  });

  it("évalue une condition combinée (ET)", () => {
    const contexte: ContexteEvaluation = {
      projet: { typeDepense: "Missions" },
      piecesTypesPresents: [],
    };
    const condition = {
      et: [
        { champ: "projet.typeDepense", operateur: "egal" as const, valeur: "Missions" },
        { champ: "piecesTypesPresents", operateur: "ne_contient_pas" as const, valeur: "ordre_de_mission" },
      ],
    };
    expect(evaluerCondition(condition, contexte)).toBe(true);

    const contexteAvecPiece: ContexteEvaluation = {
      ...contexte,
      piecesTypesPresents: ["ordre_de_mission"],
    };
    expect(evaluerCondition(condition, contexteAvecPiece)).toBe(false);
  });

  it("gère présent/absent", () => {
    const contexte: ContexteEvaluation = { projet: {}, piece: { numeroPiece: null }, piecesTypesPresents: [] };
    expect(evaluerCondition({ champ: "piece.numeroPiece", operateur: "absent" }, contexte)).toBe(true);
    expect(evaluerCondition({ champ: "piece.numeroPiece", operateur: "present" }, contexte)).toBe(false);
  });
});

describe("interpolerMessage", () => {
  it("remplace les gabarits par les valeurs du contexte", () => {
    const contexte: ContexteEvaluation = {
      projet: {},
      piece: { montantTotal: 6000, devise: "EUR" },
      piecesTypesPresents: [],
    };
    expect(interpolerMessage("Montant {{piece.montantTotal}} {{piece.devise}}", contexte)).toBe(
      "Montant 6000 EUR",
    );
  });

  it("affiche '?' pour un champ manquant", () => {
    const contexte: ContexteEvaluation = { projet: {}, piecesTypesPresents: [] };
    expect(interpolerMessage("Fournisseur : {{piece.fournisseur}}", contexte)).toBe("Fournisseur : ?");
  });
});

describe("evaluerRegles", () => {
  const regle: RegleActive = {
    id: "regle-1",
    version: 1,
    conditions: {
      si: { champ: "piece.montantTotal", operateur: "superieur", valeur: 5000 },
      alors: { typeAnomalie: "CONTRACTUEL", message: "Montant {{piece.montantTotal}} trop élevé." },
    },
  };

  it("déclenche une anomalie quand la condition est vraie", () => {
    const contexte: ContexteEvaluation = { projet: {}, piece: { montantTotal: 6000 }, piecesTypesPresents: [] };
    const candidats = evaluerRegles([regle], contexte);
    expect(candidats).toHaveLength(1);
    expect(candidats[0]).toMatchObject({ type: "CONTRACTUEL", regleId: "regle-1", regleVersion: 1 });
    expect(candidats[0].detailAutomatique).toContain("6000");
  });

  it("ne déclenche rien quand la condition est fausse", () => {
    const contexte: ContexteEvaluation = { projet: {}, piece: { montantTotal: 100 }, piecesTypesPresents: [] };
    expect(evaluerRegles([regle], contexte)).toHaveLength(0);
  });
});

describe("detecterCasNonCouvert", () => {
  const regleSurMissions: RegleActive = {
    id: "regle-missions",
    version: 1,
    conditions: {
      si: { champ: "piece.typeDepense", operateur: "egal", valeur: "Missions" },
      alors: { typeAnomalie: "PIECE_MANQUANTE", message: "…" },
    },
  };

  it("marque 'à discuter' un type de dépense non référencé par aucune règle", () => {
    const contexte: ContexteEvaluation = {
      projet: {},
      piece: { typeDepense: "Communication" },
      piecesTypesPresents: [],
    };
    const resultat = detecterCasNonCouvert([regleSurMissions], contexte);
    expect(resultat).not.toBeNull();
    expect(resultat?.type).toBe("A_DISCUTER");
  });

  it("ne marque rien si le type de dépense est déjà référencé par une règle", () => {
    const contexte: ContexteEvaluation = {
      projet: {},
      piece: { typeDepense: "Missions" },
      piecesTypesPresents: [],
    };
    expect(detecterCasNonCouvert([regleSurMissions], contexte)).toBeNull();
  });
});
