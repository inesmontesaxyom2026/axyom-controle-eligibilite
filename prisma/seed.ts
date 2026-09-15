/**
 * Jeu de données synthétique pour valider le pipeline complet en local (section 13 du prompt de
 * cadrage : 2 profils, 2 dossiers × 2 projets). Aucune donnée réelle de client — les pièces
 * justificatives, elles, se déposent ensuite via l'interface (dépôt → extraction → règles).
 *
 * Lancer avec : npx prisma db seed
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import type { RegleConditions } from "../src/lib/rules-engine/types";

const prisma = new PrismaClient();

const MOT_DE_PASSE_PROVISOIRE = "ChangeMoi123!";

async function main() {
  const motDePasseHash = await bcrypt.hash(MOT_DE_PASSE_PROVISOIRE, 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@axyom.org" },
    create: { nom: "Administrateur Axyom", email: "admin@axyom.org", motDePasseHash, role: "ADMIN" },
    update: {},
  });

  const consultant = await prisma.user.upsert({
    where: { email: "consultant@axyom.org" },
    create: { nom: "Consultant Axyom", email: "consultant@axyom.org", motDePasseHash, role: "CONSULTANT" },
    update: {},
  });

  const intpa = await prisma.bailleur.upsert({
    where: { nom: "Commission européenne" },
    create: { nom: "Commission européenne", sigle: "INTPA" },
    update: {},
  });

  const dgd = await prisma.bailleur.upsert({
    where: { nom: "Direction générale de la Coopération au Développement" },
    create: { nom: "Direction générale de la Coopération au Développement", sigle: "DGD" },
    update: {},
  });

  const profilIntpaRdc =
    (await prisma.profil.findFirst({ where: { bailleurId: intpa.id, pays: "RD Congo", typeOrganisation: null } })) ??
    (await prisma.profil.create({ data: { bailleurId: intpa.id, pays: "RD Congo", libelle: "INTPA × RD Congo" } }));

  const profilDgdSenegal =
    (await prisma.profil.findFirst({ where: { bailleurId: dgd.id, pays: "Sénégal", typeOrganisation: null } })) ??
    (await prisma.profil.create({ data: { bailleurId: dgd.id, pays: "Sénégal", libelle: "DGD × Sénégal" } }));

  const clientAlpha = await prisma.client.create({ data: { nom: "ONG Alpha" } });
  const clientBeta = await prisma.client.create({ data: { nom: "ONG Beta" } });

  const dossierAlpha = await prisma.dossier.create({
    data: {
      nom: "Dossier Alpha 2025",
      clientId: clientAlpha.id,
      projets: {
        create: [
          { nom: "Projet Santé RDC 2025", profilId: profilIntpaRdc.id, typeDepense: "Missions", niveauService: "NIVEAU_1" },
          { nom: "Projet Éducation RDC 2025", profilId: profilIntpaRdc.id, typeDepense: "Fournitures", niveauService: "NIVEAU_1" },
        ],
      },
      assignations: { create: [{ userId: consultant.id }] },
    },
  });

  const dossierBeta = await prisma.dossier.create({
    data: {
      nom: "Dossier Beta 2025",
      clientId: clientBeta.id,
      projets: {
        create: [
          { nom: "Projet Agriculture Sénégal 2025", profilId: profilDgdSenegal.id, typeDepense: "Équipement", niveauService: "NIVEAU_1" },
          { nom: "Projet Eau Sénégal 2025", profilId: profilDgdSenegal.id, typeDepense: "Missions", niveauService: "NIVEAU_1" },
        ],
      },
      assignations: { create: [{ userId: consultant.id }] },
    },
  });

  const conditionsPlafondIntpa: RegleConditions = {
    si: { champ: "piece.montantTotal", operateur: "superieur", valeur: 5000 },
    alors: {
      typeAnomalie: "CONTRACTUEL",
      message:
        "Montant {{piece.montantTotal}} {{piece.devise}} supérieur au plafond de 5 000 fixé par INTPA sans devis comparatif — vérifier la présence des devis.",
    },
  };

  const conditionsMissionSansOrdreIntpa: RegleConditions = {
    si: {
      et: [
        { champ: "projet.typeDepense", operateur: "egal", valeur: "Missions" },
        { champ: "piecesTypesPresents", operateur: "ne_contient_pas", valeur: "ordre_de_mission" },
      ],
    },
    alors: {
      typeAnomalie: "PIECE_MANQUANTE",
      message: "Dépense de type Missions sans ordre de mission déposé dans ce projet.",
    },
  };

  const conditionsPlafondDgd: RegleConditions = {
    si: { champ: "piece.montantTotal", operateur: "superieur", valeur: 3000 },
    alors: {
      typeAnomalie: "CONTRACTUEL",
      message: "Montant {{piece.montantTotal}} {{piece.devise}} supérieur au plafond de 3 000 fixé par la DGD.",
    },
  };

  const conditionsNumeroPieceObligatoireDgd: RegleConditions = {
    si: { champ: "piece.numeroPiece", operateur: "absent" },
    alors: {
      typeAnomalie: "INFO_MANQUANTE",
      message: "Numéro de pièce absent — exigence de formalisme comptable local (Sénégal).",
    },
  };

  await prisma.regle.create({
    data: {
      profilId: profilIntpaRdc.id,
      type: "CONTRACTUELLE",
      libelle: "Plafond montant sans devis comparatif",
      conditions: conditionsPlafondIntpa as unknown as object,
      creeParId: admin.id,
    },
  });

  await prisma.regle.create({
    data: {
      profilId: profilIntpaRdc.id,
      type: "LEGALE",
      libelle: "Ordre de mission requis pour les frais de mission",
      conditions: conditionsMissionSansOrdreIntpa as unknown as object,
      creeParId: admin.id,
    },
  });

  await prisma.regle.create({
    data: {
      profilId: profilDgdSenegal.id,
      type: "CONTRACTUELLE",
      libelle: "Plafond montant DGD",
      conditions: conditionsPlafondDgd as unknown as object,
      creeParId: admin.id,
    },
  });

  await prisma.regle.create({
    data: {
      profilId: profilDgdSenegal.id,
      type: "LEGALE",
      libelle: "Numéro de pièce obligatoire (formalisme local)",
      conditions: conditionsNumeroPieceObligatoireDgd as unknown as object,
      creeParId: admin.id,
    },
  });

  console.log("Jeu de données créé.");
  console.log(`Dossiers : ${dossierAlpha.nom}, ${dossierBeta.nom}`);
  console.log("Comptes de test :");
  console.log(`  admin@axyom.org / ${MOT_DE_PASSE_PROVISOIRE} (rôle ADMIN)`);
  console.log(`  consultant@axyom.org / ${MOT_DE_PASSE_PROVISOIRE} (rôle CONSULTANT)`);
  console.log("Changez ces mots de passe avant tout usage au-delà du test local.");
}

main()
  .catch((erreur) => {
    console.error(erreur);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
