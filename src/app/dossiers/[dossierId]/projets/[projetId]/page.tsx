import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { peutAccederAuDossier } from "@/lib/auth/acces";
import { d } from "@/lib/i18n";
import { RegleListe } from "@/components/regle-liste";
import { RegleForm } from "@/components/regle-form";
import { GenererRapportBouton } from "@/components/generer-rapport-bouton";
import { reessayerExtraction } from "@/app/pieces/actions";
import { validerAnomalie } from "@/app/anomalies/actions";
import type { DonneesExtraites } from "@/lib/extraction/types";

export default async function PageProjet({
  params,
}: PageProps<"/dossiers/[dossierId]/projets/[projetId]">) {
  const { dossierId, projetId } = await params;
  if (!(await peutAccederAuDossier(dossierId))) notFound();

  const projet = await prisma.projet.findUnique({
    where: { id: projetId },
    include: {
      dossier: true,
      profil: { include: { bailleur: true } },
      pieces: { orderBy: { deposeLe: "desc" } },
      anomalies: { include: { piece: true, regle: true }, orderBy: { detecteeLe: "desc" } },
      rapports: { orderBy: { version: "desc" } },
      regles: { include: { creePar: true }, orderBy: [{ libelle: "asc" }, { version: "desc" }] },
    },
  });
  if (!projet || projet.dossierId !== dossierId) notFound();

  const anomaliesEnAttente = projet.anomalies.filter((a) => a.statutValidation === "EN_ATTENTE");
  const anomaliesTraitees = projet.anomalies.filter((a) => a.statutValidation !== "EN_ATTENTE");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href={`/dossiers/${dossierId}`} className="text-sm text-slate-500 underline">
          ← {projet.dossier.nom}
        </Link>
        <h1 className="mt-1 text-2xl font-semibold">{projet.nom}</h1>
        <p className="text-slate-500">
          {d.projets.profil} : {projet.profil.bailleur.nom} × {projet.profil.pays}
        </p>
        <p className="text-sm text-slate-400">
          {d.projets.statutConformite} : {d.projets.statuts[projet.statutConformite]} —{" "}
          {d.projets.niveaux[projet.niveauService]}
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">{d.projets.pieces}</h2>
        <form
          action="/api/pieces"
          method="POST"
          encType="multipart/form-data"
          className="mb-4 flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4"
        >
          <input type="hidden" name="projetId" value={projet.id} />
          <label className="flex flex-1 flex-col gap-1 text-sm">
            {d.pieces.deposerUnePiece}
            <input
              type="file"
              name="fichier"
              required
              accept="application/pdf,image/png,image/jpeg,image/webp"
              className="text-sm"
            />
          </label>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            {d.commun.boutons.deposer}
          </button>
        </form>

        <div className="flex flex-col gap-2">
          {projet.pieces.map((piece) => {
            const donnees = piece.donneesExtraites as DonneesExtraites | null;
            return (
              <div key={piece.id} className="rounded-lg border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{piece.nomFichierOriginal}</span>
                  <span className="text-xs text-slate-400">
                    {d.pieces.statutsExtraction[piece.statutExtraction]}
                  </span>
                </div>
                {piece.erreurExtraction && (
                  <p className="mt-1 text-xs text-red-600">{piece.erreurExtraction}</p>
                )}
                {donnees && (
                  <p className="mt-1 text-xs text-slate-500">
                    {donnees.typeDocument ?? "?"} — {donnees.fournisseur ?? "?"} —{" "}
                    {donnees.montantTotal ?? "?"} {donnees.devise ?? ""}
                  </p>
                )}
                <form action={reessayerExtraction} className="mt-2">
                  <input type="hidden" name="pieceId" value={piece.id} />
                  <button type="submit" className="text-xs text-slate-500 underline">
                    {d.pieces.lancerExtraction}
                  </button>
                </form>
              </div>
            );
          })}
          {projet.pieces.length === 0 && <p className="text-slate-500">{d.commun.etats.aucunResultat}</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">
          {d.anomalies.titre} ({anomaliesEnAttente.length})
        </h2>
        <div className="flex flex-col gap-2">
          {anomaliesEnAttente.map((anomalie) => (
            <form
              key={anomalie.id}
              action={validerAnomalie}
              className="rounded-lg border border-amber-200 bg-amber-50 p-3"
            >
              <input type="hidden" name="anomalieId" value={anomalie.id} />
              <div className="flex items-center gap-2 text-xs">
                <span className="rounded bg-amber-200 px-2 py-0.5">{d.anomalies.types[anomalie.type]}</span>
                {anomalie.piece && <span className="text-slate-500">{anomalie.piece.nomFichierOriginal}</span>}
              </div>
              <p className="mt-2 text-sm">{anomalie.detailAutomatique}</p>
              <textarea
                name="detailOperateur"
                placeholder={d.anomalies.detailOperateur}
                rows={2}
                className="mt-2 w-full rounded border border-slate-300 px-2 py-1 text-sm"
              />
              <div className="mt-2 flex gap-2">
                <button name="statut" value="VALIDEE" className="rounded bg-green-700 px-3 py-1 text-xs text-white">
                  {d.commun.boutons.valider}
                </button>
                <button name="statut" value="CORRIGEE" className="rounded bg-blue-700 px-3 py-1 text-xs text-white">
                  Corrigée
                </button>
                <button name="statut" value="REJETEE" className="rounded bg-red-700 px-3 py-1 text-xs text-white">
                  {d.commun.boutons.rejeter}
                </button>
              </div>
            </form>
          ))}
          {anomaliesEnAttente.length === 0 && (
            <p className="text-slate-500">Aucune anomalie en attente de validation.</p>
          )}
        </div>

        {anomaliesTraitees.length > 0 && (
          <details className="mt-4">
            <summary className="cursor-pointer text-sm text-slate-500">
              Anomalies déjà traitées ({anomaliesTraitees.length})
            </summary>
            <div className="mt-2 flex flex-col gap-2">
              {anomaliesTraitees.map((anomalie) => (
                <div key={anomalie.id} className="rounded border border-slate-200 bg-white p-3 text-sm">
                  <span className="mr-2 rounded bg-slate-100 px-2 py-0.5 text-xs">
                    {d.anomalies.types[anomalie.type]}
                  </span>
                  {anomalie.detailOperateur ?? anomalie.detailAutomatique} —{" "}
                  <span className="text-slate-400">
                    {d.anomalies.statutsValidation[anomalie.statutValidation]}
                  </span>
                </div>
              ))}
            </div>
          </details>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">{d.projets.rapports}</h2>
        <GenererRapportBouton projetId={projet.id} />
        <div className="mt-3 flex flex-col gap-2">
          {projet.rapports.map((rapport) => (
            <Link
              key={rapport.id}
              href={`/dossiers/${dossierId}/projets/${projetId}/rapports/${rapport.id}`}
              className="rounded border border-slate-200 bg-white px-3 py-2 text-sm hover:border-slate-400"
            >
              {d.rapports.version} {rapport.version} — {d.rapports.statuts[rapport.statut]} —{" "}
              {new Date(rapport.dateGeneration).toLocaleDateString("fr-FR")}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Règles spécifiques à ce projet</h2>
        <RegleListe
          pageARevalider={`/dossiers/${dossierId}/projets/${projetId}`}
          portee={{ projetId: projet.id }}
          regles={projet.regles.map((regle) => ({
            id: regle.id,
            libelle: regle.libelle,
            description: regle.description,
            type: regle.type,
            version: regle.version,
            actif: regle.actif,
            dateCreation: regle.dateCreation.toISOString(),
            dateFin: regle.dateFin?.toISOString() ?? null,
            conditions: regle.conditions,
            creePar: regle.creePar.nom,
          }))}
        />
        <div className="mt-4">
          <RegleForm
            pageARevalider={`/dossiers/${dossierId}/projets/${projetId}`}
            portee={{ projetId: projet.id }}
          />
        </div>
      </section>
    </div>
  );
}
