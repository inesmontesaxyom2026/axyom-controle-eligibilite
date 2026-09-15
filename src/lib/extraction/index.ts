import { ClaudeExtractionProvider } from "./claude-extraction-provider";
import type { ExtractionProvider } from "./types";

export type {
  DonneesExtraites,
  ExtractionEchec,
  ExtractionProvider,
  ExtractionResult,
  ExtractionSuccess,
} from "./types";

let cached: ExtractionProvider | null = null;

export function getExtractionProvider(): ExtractionProvider {
  if (cached) return cached;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY manquant dans .env — voir .env.example.");
  }

  cached = new ClaudeExtractionProvider(apiKey);
  return cached;
}
