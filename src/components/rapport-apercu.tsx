import type { ContenuRapport } from "@/lib/reports/types";

export function RapportApercu({ contenu }: { contenu: ContenuRapport }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <h1 className="border-b border-slate-800 pb-2 text-xl font-semibold">{contenu.titre}</h1>
      <div className="mt-3 flex gap-6 text-sm text-slate-500">
        <span>Client : {contenu.client}</span>
        <span>Dossier : {contenu.dossier}</span>
        <span>Généré le {new Date(contenu.genereLe).toLocaleDateString("fr-FR")}</span>
      </div>

      <h2 className="mt-6 text-base font-medium text-slate-700">Résumé</h2>
      <p className="text-sm text-slate-500">
        {contenu.resume.totalPieces} pièce(s) contrôlée(s), {contenu.resume.totalAnomalies} anomalie(s) au total.
      </p>
      {Object.keys(contenu.resume.parType).length > 0 && (
        <table className="mt-2 w-full border-collapse text-sm">
          <tbody>
            {Object.entries(contenu.resume.parType).map(([type, total]) => (
              <tr key={type} className="border-b border-slate-100">
                <td className="py-1">{type}</td>
                <td className="py-1 text-right">{total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {contenu.sections.map((section) => (
        <div key={section.titre} className="mt-6">
          <h2 className="text-base font-medium text-slate-700">
            {section.titre} ({section.anomalies.length})
          </h2>
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-left text-xs text-slate-400">
                <th className="py-1 pr-2">Pièce</th>
                <th className="py-1 pr-2">Détail</th>
                <th className="py-1 pr-2">Règle</th>
                <th className="py-1">Statut</th>
              </tr>
            </thead>
            <tbody>
              {section.anomalies.map((anomalie, index) => (
                <tr key={index} className="border-b border-slate-100 align-top">
                  <td className="py-1 pr-2">{anomalie.pieceNom ?? "—"}</td>
                  <td className="py-1 pr-2">{anomalie.detailOperateur ?? anomalie.detailAutomatique}</td>
                  <td className="py-1 pr-2">{anomalie.regleLibelle ?? "—"}</td>
                  <td className="py-1">{anomalie.statutValidation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
