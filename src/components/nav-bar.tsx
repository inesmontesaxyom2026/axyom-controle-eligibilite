import Link from "next/link";
import { auth, signOut } from "@/auth";
import { d } from "@/lib/i18n";

export async function NavBar() {
  const session = await auth();
  if (!session) return null;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-slate-900">
            {d.commun.nomApplication}
          </Link>
          <Link href="/" className="text-sm text-slate-600 hover:text-slate-900">
            {d.navigation.dossiers}
          </Link>
          {session.user.role === "ADMIN" && (
            <Link href="/admin" className="text-sm text-slate-600 hover:text-slate-900">
              {d.navigation.administration}
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <span>{session.user.name}</span>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/connexion" });
            }}
          >
            <button type="submit" className="text-slate-600 underline hover:text-slate-900">
              {d.commun.boutons.seDeconnecter}
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
