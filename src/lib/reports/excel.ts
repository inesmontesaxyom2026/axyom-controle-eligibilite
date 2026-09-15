import ExcelJS from "exceljs";
import type { ContenuRapport } from "./types";

/** Export Excel du rapport (section 9 : Excel est un format d'export, jamais le moteur de stockage). */
export async function genererExcelRapport(contenu: ContenuRapport): Promise<Buffer> {
  const classeur = new ExcelJS.Workbook();
  classeur.creator = "Outil de contrôle interne de l'éligibilité — Axyom";
  classeur.created = new Date(contenu.genereLe);

  const feuilleResume = classeur.addWorksheet("Résumé");
  feuilleResume.columns = [
    { header: "Champ", key: "champ", width: 30 },
    { header: "Valeur", key: "valeur", width: 50 },
  ];
  feuilleResume.addRows([
    { champ: "Titre", valeur: contenu.titre },
    { champ: "Client", valeur: contenu.client },
    { champ: "Dossier", valeur: contenu.dossier },
    { champ: "Généré le", valeur: new Date(contenu.genereLe).toLocaleString("fr-FR") },
    { champ: "Total pièces", valeur: contenu.resume.totalPieces },
    { champ: "Total anomalies", valeur: contenu.resume.totalAnomalies },
  ]);
  feuilleResume.getRow(1).font = { bold: true };

  const feuilleAnomalies = classeur.addWorksheet("Anomalies");
  feuilleAnomalies.columns = [
    { header: "Type", key: "type", width: 28 },
    { header: "Pièce", key: "piece", width: 30 },
    { header: "Détail", key: "detail", width: 60 },
    { header: "Règle", key: "regle", width: 30 },
    { header: "Statut de validation", key: "statut", width: 22 },
  ];
  feuilleAnomalies.getRow(1).font = { bold: true };

  for (const section of contenu.sections) {
    for (const anomalie of section.anomalies) {
      feuilleAnomalies.addRow({
        type: section.titre,
        piece: anomalie.pieceNom ?? "—",
        detail: anomalie.detailOperateur ?? anomalie.detailAutomatique,
        regle: anomalie.regleLibelle ?? "—",
        statut: anomalie.statutValidation,
      });
    }
  }

  const buffer = await classeur.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
