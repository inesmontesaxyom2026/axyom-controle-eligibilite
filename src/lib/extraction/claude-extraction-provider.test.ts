import { describe, expect, it } from "vitest";
import { ClaudeExtractionProvider } from "./claude-extraction-provider";

describe("ClaudeExtractionProvider", () => {
  it("échoue proprement sur un format non supporté, sans appeler l'API", async () => {
    const fournisseur = new ClaudeExtractionProvider("clé-factice-non-utilisee");
    const resultat = await fournisseur.extract({
      buffer: Buffer.from("contenu quelconque"),
      mimeType: "application/zip",
    });

    expect(resultat.statut).toBe("ECHEC");
    if (resultat.statut === "ECHEC") {
      expect(resultat.raison).toContain("non supporté");
    }
  });
});
