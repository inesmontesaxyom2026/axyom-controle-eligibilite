import type { ContenuRapport } from "./types";

function echapper(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Gabarit HTML par défaut du rapport (web + source de l'export PDF). Une surcharge par dossier
 * pourra plus tard remplacer cette fonction via RapportTemplate.structure (voir schema.prisma).
 */
export function genererHtmlRapport(contenu: ContenuRapport): string {
  const dateFormattee = new Date(contenu.genereLe).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lignesResume = Object.entries(contenu.resume.parType)
    .map(([type, total]) => `<tr><td>${echapper(type)}</td><td>${total}</td></tr>`)
    .join("");

  const sectionsHtml = contenu.sections
    .map(
      (section) => `
      <section class="section-anomalies">
        <h2>${echapper(section.titre)} (${section.anomalies.length})</h2>
        <table>
          <thead>
            <tr><th>Pièce</th><th>Détail</th><th>Règle</th><th>Statut</th></tr>
          </thead>
          <tbody>
            ${section.anomalies
              .map(
                (anomalie) => `
              <tr>
                <td>${echapper(anomalie.pieceNom ?? "—")}</td>
                <td>${echapper(anomalie.detailOperateur ?? anomalie.detailAutomatique)}</td>
                <td>${echapper(anomalie.regleLibelle ?? "—")}</td>
                <td>${echapper(anomalie.statutValidation)}</td>
              </tr>`,
              )
              .join("")}
          </tbody>
        </table>
      </section>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${echapper(contenu.titre)}</title>
<style>
  body { font-family: "Segoe UI", Arial, sans-serif; color: #1a1a1a; margin: 40px; }
  h1 { font-size: 22px; border-bottom: 2px solid #0f4c81; padding-bottom: 8px; }
  h2 { font-size: 16px; color: #0f4c81; margin-top: 28px; }
  .meta { color: #555; margin-bottom: 24px; }
  .meta span { margin-right: 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th, td { border: 1px solid #d8d8d8; padding: 6px 10px; text-align: left; font-size: 13px; }
  th { background: #f2f5f8; }
  .projets-table td, .projets-table th { font-size: 13px; }
  footer { margin-top: 40px; font-size: 11px; color: #888; }
</style>
</head>
<body>
  <h1>${echapper(contenu.titre)}</h1>
  <div class="meta">
    <span><strong>Client :</strong> ${echapper(contenu.client)}</span>
    <span><strong>Dossier :</strong> ${echapper(contenu.dossier)}</span>
    <span><strong>Généré le :</strong> ${dateFormattee}</span>
  </div>

  <h2>Résumé</h2>
  <table class="projets-table">
    <thead><tr><th>Type d'anomalie</th><th>Nombre</th></tr></thead>
    <tbody>${lignesResume || "<tr><td colspan=\"2\">Aucune anomalie détectée.</td></tr>"}</tbody>
  </table>
  <p>${contenu.resume.totalPieces} pièce(s) contrôlée(s), ${contenu.resume.totalAnomalies} anomalie(s) au total.</p>

  ${sectionsHtml}

  <footer>Rapport généré par l'outil de contrôle interne de l'éligibilité — Axyom.</footer>
</body>
</html>`;
}
