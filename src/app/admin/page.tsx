import Link from "next/link";
import { d } from "@/lib/i18n";

const LIENS = [
  { href: "/admin/utilisateurs", libelle: d.admin.utilisateurs },
  { href: "/admin/bailleurs", libelle: d.admin.bailleurs },
  { href: "/admin/profils", libelle: d.admin.profils },
  { href: "/admin/clients", libelle: "Clients" },
  { href: "/admin/dossiers", libelle: "Dossiers et projets" },
  { href: "/admin/parametres", libelle: d.admin.parametres },
];

export default function PageAdmin() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">{d.navigation.administration}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LIENS.map((lien) => (
          <Link
            key={lien.href}
            href={lien.href}
            className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:border-slate-400"
          >
            {lien.libelle}
          </Link>
        ))}
      </div>
    </div>
  );
}
