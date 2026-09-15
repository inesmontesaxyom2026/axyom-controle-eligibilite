import puppeteer from "puppeteer";
import type { ContenuRapport } from "./types";
import { genererHtmlRapport } from "./html-template";

/** Convertit le contenu d'un rapport en PDF imprimable (mise en page soignée, voir html-template.ts). */
export async function genererPdfRapport(contenu: ContenuRapport): Promise<Buffer> {
  const navigateur = await puppeteer.launch({ headless: true });
  try {
    const page = await navigateur.newPage();
    await page.setContent(genererHtmlRapport(contenu), { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20mm", bottom: "20mm", left: "15mm", right: "15mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await navigateur.close();
  }
}
