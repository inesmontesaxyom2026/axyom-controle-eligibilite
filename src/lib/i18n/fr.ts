// Dictionnaire de textes de l'interface, séparé des composants (section 3 du prompt de cadrage :
// l'application est en français pour l'instant, mais ne doit pas coder les textes en dur pour
// permettre l'ajout d'autres langues plus tard). Pour ajouter une langue : dupliquer ce fichier
// (ex. en.ts) avec la même forme, puis brancher un sélecteur de langue dans src/lib/i18n/index.ts.

export const dictionnaire = {
  commun: {
    nomApplication: "Contrôle d'éligibilité",
    boutons: {
      enregistrer: "Enregistrer",
      annuler: "Annuler",
      valider: "Valider",
      rejeter: "Rejeter",
      supprimer: "Supprimer",
      modifier: "Modifier",
      ajouter: "Ajouter",
      deposer: "Déposer",
      exporterPdf: "Exporter en PDF",
      exporterExcel: "Exporter en Excel",
      seDeconnecter: "Se déconnecter",
    },
    etats: {
      chargement: "Chargement…",
      aucunResultat: "Aucun résultat.",
    },
  },
  connexion: {
    titre: "Connexion",
    email: "Adresse e-mail",
    motDePasse: "Mot de passe",
    seConnecter: "Se connecter",
    erreurIdentifiants: "Adresse e-mail ou mot de passe incorrect.",
  },
  navigation: {
    dossiers: "Dossiers",
    administration: "Administration",
  },
  dossiers: {
    titreListe: "Mes dossiers",
    titreListeAdmin: "Tous les dossiers",
    client: "Client",
    projets: "Projets",
    creeLe: "Créé le",
  },
  projets: {
    profil: "Profil (bailleur × pays)",
    departement: "Département",
    typeDepense: "Type de dépense",
    niveauService: "Niveau de service",
    statutConformite: "Statut de conformité",
    suiviBudgetaire: "Suivi budgétaire",
    soldeAvancesPartenaires: "Solde des avances partenaires",
    pieces: "Pièces justificatives",
    anomalies: "Anomalies",
    rapports: "Rapports",
    statuts: {
      EN_COURS: "En cours",
      CONFORME: "Conforme",
      NON_CONFORME: "Non conforme",
      A_DISCUTER: "À discuter",
    },
    niveaux: {
      NIVEAU_1: "Niveau 1 — Conformité formelle",
      NIVEAU_2: "Niveau 2 — Analyse des tendances",
      NIVEAU_3: "Niveau 3 — Comparaisons sectorielles",
    },
  },
  pieces: {
    deposerUnePiece: "Déposer une pièce",
    nomFichier: "Nom du fichier",
    statutExtraction: "Extraction",
    statutsExtraction: {
      EN_ATTENTE: "En attente",
      REUSSIE: "Réussie",
      ECHEC: "Échec",
    },
    lancerExtraction: "Lancer l'extraction",
    donneesExtraites: "Données extraites",
  },
  regles: {
    titre: "Règles",
    journal: "Journal des règles",
    nouvelleRegle: "Nouvelle règle",
    type: "Référentiel",
    types: {
      LEGALE: "Exigence légale",
      CONTRACTUELLE: "Exigence contractuelle (bailleur)",
      PROCEDURE: "Procédure interne",
    },
    version: "Version",
    actif: "Active",
    inactive: "Remplacée",
    portee: {
      profil: "Générale (profil)",
      dossier: "Spécifique au dossier",
      projet: "Spécifique au projet",
    },
  },
  anomalies: {
    titre: "Anomalies à valider",
    types: {
      LEGAL: "Conformité légale",
      CONTRACTUEL: "Conformité contractuelle",
      PROCEDURE: "Procédure",
      FORMATAGE: "Formatage",
      INFO_MANQUANTE_ESSENTIELLE: "Information essentielle manquante",
      INFO_MANQUANTE: "Information manquante",
      INFO_INCOHERENTE: "Information incohérente",
      PIECE_MANQUANTE: "Pièce justificative manquante",
      A_DISCUTER: "À discuter",
    },
    statutsValidation: {
      EN_ATTENTE: "En attente de validation",
      VALIDEE: "Validée",
      REJETEE: "Rejetée",
      CORRIGEE: "Corrigée",
    },
    detailOperateur: "Commentaire de l'opérateur",
  },
  rapports: {
    titre: "Rapport",
    version: "Version",
    genererNouveau: "Générer un nouveau rapport",
    statuts: {
      BROUILLON: "Brouillon",
      VALIDE: "Validé",
      ENVOYE: "Envoyé au client",
    },
  },
  admin: {
    utilisateurs: "Utilisateurs",
    profils: "Profils (bailleur × pays)",
    bailleurs: "Bailleurs",
    parametres: "Paramètres",
    dureeConservationJours: "Durée de conservation des données (jours)",
  },
} as const;

export type Dictionnaire = typeof dictionnaire;
