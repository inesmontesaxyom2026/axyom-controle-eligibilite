import { prisma } from "@/lib/prisma";

export const CLE_DUREE_CONSERVATION_JOURS = "duree_conservation_jours";

export async function getParametre(cle: string): Promise<string | null> {
  const parametre = await prisma.parametre.findUnique({ where: { cle } });
  return parametre?.valeur ?? null;
}

export async function setParametre(cle: string, valeur: string): Promise<void> {
  await prisma.parametre.upsert({
    where: { cle },
    create: { cle, valeur },
    update: { valeur },
  });
}
