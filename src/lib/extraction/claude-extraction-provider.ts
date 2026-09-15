import Anthropic from "@anthropic-ai/sdk";
import type { DonneesExtraites, ExtractionProvider, ExtractionResult } from "./types";

type MimeTypeImage = "image/png" | "image/jpeg" | "image/webp";

const MIME_TYPES_IMAGE: MimeTypeImage[] = ["image/png", "image/jpeg", "image/webp"];

function estMimeTypeImage(mimeType: string): mimeType is MimeTypeImage {
  return (MIME_TYPES_IMAGE as string[]).includes(mimeType);
}

// Schéma forcé via tool-use : Claude doit renvoyer exactement ces champs, plutôt qu'un texte libre
// à re-parser — plus fiable pour un pipeline automatisé (voir section 8 du prompt de cadrage).
const OUTIL_EXTRACTION = {
  name: "enregistrer_donnees_extraites",
  description:
    "Enregistre les données structurées extraites d'une pièce justificative comptable.",
  input_schema: {
    type: "object" as const,
    properties: {
      typeDocument: {
        type: ["string", "null"],
        description: "Ex. facture, note de frais, contrat, reçu.",
      },
      fournisseur: { type: ["string", "null"] },
      dateDocument: {
        type: ["string", "null"],
        description: "Date du document au format ISO YYYY-MM-DD si identifiable.",
      },
      montantTotal: { type: ["number", "null"] },
      devise: { type: ["string", "null"], description: "Code devise, ex. EUR, USD." },
      typeDepense: {
        type: ["string", "null"],
        description: "Catégorie de dépense si mentionnée ou déductible (ex. Missions, Fournitures).",
      },
      numeroPiece: { type: ["string", "null"] },
      autresChamps: {
        type: "object",
        description: "Autres informations pertinentes trouvées sur le document, en clé/valeur.",
        additionalProperties: { type: "string" },
      },
      confiance: {
        type: ["number", "null"],
        description: "Confiance globale de 0 à 1 dans l'exactitude de l'extraction.",
      },
    },
    required: [
      "typeDocument",
      "fournisseur",
      "dateDocument",
      "montantTotal",
      "devise",
      "typeDepense",
      "numeroPiece",
      "autresChamps",
      "confiance",
    ],
  },
};

/**
 * Extraction via l'API Claude (multimodale). ⚠️ Fiabilité à valider sur un échantillon réel
 * avant généralisation à tout le volume visé (~15 000 pièces/mois) — voir section 8 du prompt
 * de cadrage et ARCHITECTURE.md § Extraction. Si le coût ou la précision ne conviennent pas,
 * remplacer par une autre implémentation de ExtractionProvider (Tesseract, Document AI, Textract)
 * sans changer le reste du pipeline.
 */
export class ClaudeExtractionProvider implements ExtractionProvider {
  private readonly client: Anthropic;
  private readonly model: string;

  constructor(apiKey: string, model = "claude-sonnet-5") {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async extract({
    buffer,
    mimeType,
  }: {
    buffer: Buffer;
    mimeType: string;
  }): Promise<ExtractionResult> {
    if (mimeType !== "application/pdf" && !estMimeTypeImage(mimeType)) {
      return {
        statut: "ECHEC",
        raison: `Format non supporté par l'extraction automatique : ${mimeType}.`,
      };
    }

    const base64 = buffer.toString("base64");
    const contentBlock: Anthropic.ImageBlockParam | Anthropic.DocumentBlockParam =
      mimeType === "application/pdf"
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: base64 } }
        : { type: "image", source: { type: "base64", media_type: mimeType, data: base64 } };

    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 1024,
        tools: [OUTIL_EXTRACTION],
        tool_choice: { type: "tool", name: OUTIL_EXTRACTION.name },
        messages: [
          {
            role: "user",
            content: [
              contentBlock,
              {
                type: "text",
                text:
                  "Voici une pièce justificative comptable (facture, note de frais ou contrat). " +
                  "Extrais les informations demandées via l'outil fourni. Si une information est " +
                  "absente ou illisible, renvoie null pour ce champ plutôt que de deviner.",
              },
            ],
          },
        ],
      });

      const toolUse = message.content.find(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
      );

      if (!toolUse) {
        return {
          statut: "ECHEC",
          raison: "Le modèle n'a pas renvoyé de données structurées exploitables.",
        };
      }

      return {
        statut: "REUSSIE",
        donnees: toolUse.input as DonneesExtraites,
      };
    } catch (error) {
      return {
        statut: "ECHEC",
        raison: error instanceof Error ? error.message : "Erreur inconnue lors de l'extraction.",
      };
    }
  }
}
