import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RegleListe } from "@/components/regle-liste";
import { RegleForm } from "@/components/regle-form";

export default async function PageProfil({ params }: PageProps<"/admin/profils/[profilId]">) {
  const { profilId } = await params;

  const profil = await prisma.profil.findUnique({
    where: { id: profilId },
    include: {
      bailleur: true,
      regles: { include: { creePar: true }, orderBy: [{ libelle: "asc" }, { version: "desc" }] },
    },
  });
  if (!profil) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{profil.libelle}</h1>
        <p className="text-slate-500">Règles générales — s&apos;appliquent à tous les dossiers/projets sur ce profil.</p>
      </div>

      <RegleListe
        pageARevalider={`/admin/profils/${profil.id}`}
        portee={{ profilId: profil.id }}
        regles={profil.regles.map((regle) => ({
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

      <RegleForm pageARevalider={`/admin/profils/${profil.id}`} portee={{ profilId: profil.id }} />
    </div>
  );
}
