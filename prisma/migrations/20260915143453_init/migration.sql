-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'CONSULTANT');

-- CreateEnum
CREATE TYPE "TypeOrganisation" AS ENUM ('SIEGE', 'ANTENNE_LOCALE', 'PARTENAIRE');

-- CreateEnum
CREATE TYPE "NiveauService" AS ENUM ('NIVEAU_1', 'NIVEAU_2', 'NIVEAU_3');

-- CreateEnum
CREATE TYPE "StatutConformite" AS ENUM ('EN_COURS', 'CONFORME', 'NON_CONFORME', 'A_DISCUTER');

-- CreateEnum
CREATE TYPE "StatutExtraction" AS ENUM ('EN_ATTENTE', 'REUSSIE', 'ECHEC');

-- CreateEnum
CREATE TYPE "TypeRegle" AS ENUM ('LEGALE', 'CONTRACTUELLE', 'PROCEDURE');

-- CreateEnum
CREATE TYPE "TypeAnomalie" AS ENUM ('LEGAL', 'CONTRACTUEL', 'PROCEDURE', 'FORMATAGE', 'INFO_MANQUANTE_ESSENTIELLE', 'INFO_MANQUANTE', 'INFO_INCOHERENTE', 'PIECE_MANQUANTE', 'A_DISCUTER');

-- CreateEnum
CREATE TYPE "StatutValidation" AS ENUM ('EN_ATTENTE', 'VALIDEE', 'REJETEE', 'CORRIGEE');

-- CreateEnum
CREATE TYPE "StatutRapport" AS ENUM ('BROUILLON', 'VALIDE', 'ENVOYE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasseHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CONSULTANT',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bailleurs" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "sigle" TEXT,

    CONSTRAINT "bailleurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profils" (
    "id" TEXT NOT NULL,
    "bailleurId" TEXT NOT NULL,
    "pays" TEXT NOT NULL,
    "typeOrganisation" "TypeOrganisation",
    "libelle" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profils_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossiers" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dossiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dossier_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "assigneLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dossier_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projets" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "profilId" TEXT NOT NULL,
    "departement" TEXT,
    "typeDepense" TEXT,
    "niveauService" "NiveauService" NOT NULL DEFAULT 'NIVEAU_1',
    "statutConformite" "StatutConformite" NOT NULL DEFAULT 'EN_COURS',
    "suiviBudgetaire" DECIMAL(14,2),
    "soldeAvancesPartenaires" DECIMAL(14,2),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pieces" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "nomFichierOriginal" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "tailleOctets" INTEGER NOT NULL,
    "statutExtraction" "StatutExtraction" NOT NULL DEFAULT 'EN_ATTENTE',
    "donneesExtraites" JSONB,
    "erreurExtraction" TEXT,
    "deposeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pieces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regles" (
    "id" TEXT NOT NULL,
    "profilId" TEXT,
    "dossierId" TEXT,
    "projetId" TEXT,
    "type" "TypeRegle" NOT NULL,
    "libelle" TEXT NOT NULL,
    "description" TEXT,
    "conditions" JSONB NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "versionPrecedenteId" TEXT,
    "creeParId" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" TIMESTAMP(3),

    CONSTRAINT "regles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anomalies" (
    "id" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "pieceId" TEXT,
    "type" "TypeAnomalie" NOT NULL,
    "regleId" TEXT,
    "regleVersion" INTEGER,
    "detailAutomatique" TEXT NOT NULL,
    "detailOperateur" TEXT,
    "statutValidation" "StatutValidation" NOT NULL DEFAULT 'EN_ATTENTE',
    "detecteeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valideeLe" TIMESTAMP(3),

    CONSTRAINT "anomalies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapport_templates" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT,
    "nom" TEXT NOT NULL,
    "structure" JSONB NOT NULL,
    "parDefaut" BOOLEAN NOT NULL DEFAULT false,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rapport_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapports" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT,
    "projetId" TEXT,
    "templateId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "contenu" JSONB NOT NULL,
    "statut" "StatutRapport" NOT NULL DEFAULT 'BROUILLON',
    "genereParId" TEXT NOT NULL,
    "dateGeneration" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rapports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parametres" (
    "cle" TEXT NOT NULL,
    "valeur" TEXT NOT NULL,

    CONSTRAINT "parametres_pkey" PRIMARY KEY ("cle")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "bailleurs_nom_key" ON "bailleurs"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "profils_bailleurId_pays_typeOrganisation_key" ON "profils"("bailleurId", "pays", "typeOrganisation");

-- CreateIndex
CREATE UNIQUE INDEX "dossier_assignments_userId_dossierId_key" ON "dossier_assignments"("userId", "dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "regles_versionPrecedenteId_key" ON "regles"("versionPrecedenteId");

-- CreateIndex
CREATE UNIQUE INDEX "rapport_templates_dossierId_key" ON "rapport_templates"("dossierId");

-- AddForeignKey
ALTER TABLE "profils" ADD CONSTRAINT "profils_bailleurId_fkey" FOREIGN KEY ("bailleurId") REFERENCES "bailleurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_assignments" ADD CONSTRAINT "dossier_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dossier_assignments" ADD CONSTRAINT "dossier_assignments_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projets" ADD CONSTRAINT "projets_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "profils"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pieces" ADD CONSTRAINT "pieces_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regles" ADD CONSTRAINT "regles_profilId_fkey" FOREIGN KEY ("profilId") REFERENCES "profils"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regles" ADD CONSTRAINT "regles_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regles" ADD CONSTRAINT "regles_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regles" ADD CONSTRAINT "regles_versionPrecedenteId_fkey" FOREIGN KEY ("versionPrecedenteId") REFERENCES "regles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regles" ADD CONSTRAINT "regles_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_pieceId_fkey" FOREIGN KEY ("pieceId") REFERENCES "pieces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anomalies" ADD CONSTRAINT "anomalies_regleId_fkey" FOREIGN KEY ("regleId") REFERENCES "regles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapport_templates" ADD CONSTRAINT "rapport_templates_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "dossiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "projets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "rapport_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_genereParId_fkey" FOREIGN KEY ("genereParId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
