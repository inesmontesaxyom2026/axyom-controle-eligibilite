import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { d } from "@/lib/i18n";
import { CreerProfilForm } from "@/components/creer-profil-form";

export default async function PageProfils() {
  const [profils, bailleurs] = await Promise.all([
    prisma.profil.findMany({ include: { bailleur: true }, orderBy: { libelle: "asc" } }),
    prisma.bailleur.findMany({ orderBy: { nom: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">{d.admin.profils}</h1>

      <div className="flex flex-col gap-2">
        {profils.map((profil) => (
          <Link
            key={profil.id}
            href={`/admin/profils/${profil.id}`}
            className="rounded border border-slate-200 bg-white px-4 py-2 hover:border-slate-400"
          >
            {profil.libelle}
          </Link>
        ))}
        {profils.length === 0 && <p className="text-slate-500">{d.commun.etats.aucunResultat}</p>}
      </div>

      {bailleurs.length === 0 ? (
        <p className="text-sm text-slate-500">
          Ajoutez d&apos;abord un <Link href="/admin/bailleurs" className="underline">bailleur</Link>.
        </p>
      ) : (
        <CreerProfilForm bailleurs={bailleurs} />
      )}
    </div>
  );
}
