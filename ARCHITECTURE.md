# Architecture — pour une personne pas nécessairement technique

Ce document explique comment l'outil est construit et où intervenir pour le faire évoluer, sans
prérequis de développement. Pour l'installation, voir [`README.md`](./README.md).

## 1. Vue d'ensemble du pipeline

L'application suit exactement le processus décrit dans le document de cadrage :

1. Un consultant dépose une **pièce justificative** (facture, contrat, note de frais) sur la page
   d'un **projet**.
2. L'application envoie automatiquement la pièce à Claude (l'IA d'Anthropic) pour en extraire les
   informations (montant, fournisseur, date, type de dépense…).
3. Les règles actives applicables à ce projet (générales + spécifiques) sont évaluées sur ces
   informations. Chaque règle qui « se déclenche » crée une **anomalie**.
4. Le consultant relit chaque anomalie sur la page du projet et la **valide, corrige ou rejette** —
   c'est la validation humaine obligatoire.
5. Une fois qu'il n'y a plus d'anomalie en attente, le consultant peut **générer un rapport**, le
   consulter à l'écran, l'exporter en PDF/Excel, puis le marquer comme envoyé au client.

Aucune étape ne « bloque » silencieusement : un échec (pièce illisible, aucune règle ne couvrant un
cas) devient toujours une anomalie visible, jamais une absence de résultat.

## 2. Le modèle de données (`prisma/schema.prisma`)

C'est le plan de toutes les informations que l'application enregistre. Les entités principales,
dans l'ordre où elles s'emboîtent :

```
Client → Dossier → Projet → Pièce
                 → Règle (spécifique au dossier ou au projet)
                 → Anomalie (détectée sur une pièce)
                 → Rapport
Bailleur → Profil (Bailleur × Pays) → Règle (générale) + Projet
```

- **Profil** = un couple Bailleur × Pays (ex. « INTPA × RD Congo »). C'est à ce niveau que sont
  rattachées les règles générales, réutilisées automatiquement pour tous les projets sur ce profil.
- **Dossier** appartient à un **Client** et regroupe un ou plusieurs **Projets** (ex. un dossier par
  année, des projets par zone/bailleur).
- Un consultant ne voit que les dossiers qui lui sont assignés (table `DossierAssignment`) ; un
  administrateur voit tout.

Toute modification du modèle de données se fait dans `prisma/schema.prisma`, suivie de :
```bash
npx prisma migrate dev --name description-du-changement
```

## 3. Les règles : où elles sont, comment les modifier

Les règles sont gérées **entièrement depuis l'interface**, pas dans le code :

- Règles **générales** : page d'un profil (`/admin/profils/<id>`).
- Règles **spécifiques à un dossier** : bas de la page du dossier.
- Règles **spécifiques à un projet** : bas de la page du projet.

Une règle a deux parties :
- **Condition** (« si ») : ce qui doit être vrai pour que la règle se déclenche.
- **Conséquence** (« alors ») : le type d'anomalie créé et le message affiché à l'opérateur.

Dans cette première version, la condition se saisit en JSON dans le formulaire (un éditeur visuel
plus convivial est une amélioration naturelle pour une prochaine itération — voir section 8).
Exemple d'une condition simple (plafond de montant) :

```json
{
  "si": { "champ": "piece.montantTotal", "operateur": "superieur", "valeur": 5000 },
  "alors": {
    "typeAnomalie": "CONTRACTUEL",
    "message": "Montant {{piece.montantTotal}} {{piece.devise}} supérieur au plafond autorisé."
  }
}
```

Exemple combiné (ET) — pièce obligatoire manquante :

```json
{
  "si": {
    "et": [
      { "champ": "projet.typeDepense", "operateur": "egal", "valeur": "Missions" },
      { "champ": "piecesTypesPresents", "operateur": "ne_contient_pas", "valeur": "ordre_de_mission" }
    ]
  },
  "alors": { "typeAnomalie": "PIECE_MANQUANTE", "message": "Ordre de mission manquant." }
}
```

Opérateurs disponibles : `egal`, `different`, `superieur`, `superieur_egal`, `inferieur`,
`inferieur_egal`, `contient`, `ne_contient_pas`, `present`, `absent`. Combinaisons : `et`, `ou`,
`non` (imbricables). Le type d'anomalie (`alors.typeAnomalie`) doit être l'une des valeurs :
`LEGAL`, `CONTRACTUEL`, `PROCEDURE`, `FORMATAGE`, `INFO_MANQUANTE_ESSENTIELLE`, `INFO_MANQUANTE`,
`INFO_INCOHERENTE`, `PIECE_MANQUANTE`.

**Versionnage** : modifier une règle active crée une nouvelle version ; l'ancienne reste visible
dans l'historique (bouton « Journal des règles ») et reste attachée aux anomalies passées qui l'ont
utilisée — un contrôle déjà réalisé ne change jamais rétroactivement.

**Cas non couverts** : si le type de dépense d'une pièce n'est mentionné par aucune règle active,
l'application crée automatiquement une anomalie « À discuter » plutôt que de conclure silencieusement
à la conformité (voir `src/lib/rules-engine/index.ts`, fonction `detecterCasNonCouvert`). C'est une
première version volontairement simple de cette protection : à affiner avec l'usage réel.

## 4. Extraction des pièces (`src/lib/extraction/`)

L'extraction utilise l'API Claude (vision) pour lire chaque pièce et en sortir des données
structurées (montant, fournisseur, date, type de document…). Un échec (pièce illisible, format non
supporté) devient une anomalie plutôt que de bloquer le traitement du dossier.

**⚠️ Point à valider avant un usage à grande échelle** (voir section 8 du document de cadrage) :
tester la fiabilité sur un échantillon réel de pièces représentatif avant de généraliser à tout le
volume visé (~15 000 pièces/mois). Si la précision ou le coût par pièce ne conviennent pas, il est
possible de remplacer Claude par un autre outil (Tesseract, Google Document AI, AWS Textract) **sans
changer le reste de l'application** : il suffit d'écrire une nouvelle classe qui respecte
l'interface `ExtractionProvider` (voir `src/lib/extraction/types.ts`) et de la brancher dans
`src/lib/extraction/index.ts`.

## 5. Stockage des fichiers (`src/lib/storage/`)

Même principe d'interface interchangeable (`StorageProvider`) :
- **En local/test** (réglage actuel, `STORAGE_DRIVER=local` dans `.env`) : les fichiers sont
  enregistrés sur le disque, dans le dossier `storage-local/`.
- **En production** : basculer vers `STORAGE_DRIVER=gcs` (Google Cloud Storage, région Belgique
  recommandée — voir section 7) après avoir installé `@google-cloud/storage` et complété
  `src/lib/storage/gcs-storage-provider.ts` (le squelette et les instructions y sont déjà).

Les données structurées (dossiers, règles, anomalies…), elles, vivent dans la base PostgreSQL
(`DATABASE_URL`) — jamais dans un fichier Excel : Excel n'est utilisé que comme **format d'export**
des rapports (voir `src/lib/reports/excel.ts`).

## 6. Rapports (`src/lib/reports/`)

Un rapport est généré à partir des anomalies déjà validées d'un projet (impossible de générer un
rapport tant qu'il reste des anomalies en attente — c'est la validation humaine obligatoire). Le
même contenu sert à trois usages :
- aperçu à l'écran (`src/components/rapport-apercu.tsx`) ;
- export PDF, via une page HTML imprimable convertie en PDF par Puppeteer (`html-template.ts` +
  `pdf.ts`) ;
- export Excel (`excel.ts`).

**Limitation connue** : la table `RapportTemplate` existe dans le modèle de données (pour permettre
un modèle personnalisé par dossier, comme prévu section 11 du cadrage) mais n'est pas encore
utilisée par la génération — tous les rapports utilisent aujourd'hui le même modèle par défaut. La
personnalisation visuelle par dossier (mise en page, graphiques) reste à construire.

## 7. Sécurité et hébergement

- Chiffrement au repos et connexions HTTPS assurés nativement par l'hébergeur (aucun chiffrement
  applicatif supplémentaire pour l'instant, conformément à la décision du client).
- Accès aux dossiers limité par assignation (`DossierAssignment`) ; un administrateur voit tout.
- Hébergement visé : Belgique ou, à défaut, la région UE la plus proche. Pour la base de données de
  test, Neon (gratuit) ne propose pas de région Belgique — Frankfurt est la plus proche. Pour un
  déploiement définitif avec stockage objet, Google Cloud Storage propose une vraie région Belgique
  (`europe-west1`, à Saint-Ghislain).
- Durée de conservation : paramètre configurable par l'administrateur
  (`/admin/parametres`, table `Parametre`). **Aucune purge automatique n'est encore implémentée** —
  ce paramètre sert de référence pour une future tâche planifiée.

## 8. Limites connues de cette première version (pistes pour la suite)

- Fiabilité de l'extraction Claude non encore validée sur un échantillon réel à l'échelle visée.
- Les conditions de règle se saisissent en JSON ; un éditeur visuel (menus déroulants) serait plus
  accessible pour un usage courant sans risque d'erreur de syntaxe.
- Personnalisation visuelle des rapports par dossier non implémentée (voir section 6).
- Pas de purge automatique liée à la durée de conservation configurée.
- Niveaux de service 2 et 3 (analyse des tendances, comparaisons sectorielles) : le champ existe
  sur chaque projet, mais aucune analyse n'est encore calculée automatiquement.
- Une seule langue d'interface (français) ; les textes sont déjà séparés du code
  (`src/lib/i18n/fr.ts`) pour faciliter l'ajout d'une langue plus tard.
