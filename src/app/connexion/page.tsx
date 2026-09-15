import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { d } from "@/lib/i18n";

export default async function PageConnexion({
  searchParams,
}: PageProps<"/connexion">) {
  const params = await searchParams;
  const retour = typeof params.retour === "string" ? params.retour : "/";
  const erreur = typeof params.erreur === "string";

  async function connecter(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        motDePasse: formData.get("motDePasse"),
        redirectTo: retour,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect(`/connexion?erreur=1&retour=${encodeURIComponent(retour)}`);
      }
      throw error;
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-6 text-xl font-semibold">{d.connexion.titre}</h1>
      {erreur && (
        <p className="mb-4 rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {d.connexion.erreurIdentifiants}
        </p>
      )}
      <form action={connecter} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {d.connexion.email}
          <input
            name="email"
            type="email"
            required
            className="rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {d.connexion.motDePasse}
          <input
            name="motDePasse"
            type="password"
            required
            className="rounded border border-slate-300 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {d.connexion.seConnecter}
        </button>
      </form>
    </div>
  );
}
