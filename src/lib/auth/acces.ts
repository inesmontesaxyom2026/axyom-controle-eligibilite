import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Session courante ou null — à utiliser dans les Server Components/route handlers. */
export async function utilisateurCourant() {
  const session = await auth();
  return session?.user ?? null;
}

export async function estAdmin() {
  const utilisateur = await utilisateurCourant();
  return utilisateur?.role === "ADMIN";
}

/**
 * Vérifie qu'un consultant a accès à un dossier donné (section 3 : accès par dossier assigné).
 * Un administrateur a toujours accès à tout.
 */
export async function peutAccederAuDossier(dossierId: string): Promise<boolean> {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return false;
  if (utilisateur.role === "ADMIN") return true;

  const assignation = await prisma.dossierAssignment.findUnique({
    where: { userId_dossierId: { userId: utilisateur.id, dossierId } },
  });
  return assignation !== null;
}

/** Liste des dossiers visibles par l'utilisateur courant (tous pour un admin, assignés sinon). */
export async function dossiersAccessibles() {
  const utilisateur = await utilisateurCourant();
  if (!utilisateur) return [];

  if (utilisateur.role === "ADMIN") {
    return prisma.dossier.findMany({ include: { client: true }, orderBy: { creeLe: "desc" } });
  }

  return prisma.dossier.findMany({
    where: { assignations: { some: { userId: utilisateur.id } } },
    include: { client: true },
    orderBy: { creeLe: "desc" },
  });
}
