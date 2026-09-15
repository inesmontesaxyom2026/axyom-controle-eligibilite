# Outil de contrôle interne de l'éligibilité — Axyom

Application web interne permettant d'externaliser le contrôle de l'éligibilité des dépenses
d'organisations (ONG, associations, structures de coopération) financées par des bailleurs
internationaux. Voir [`ARCHITECTURE.md`](./ARCHITECTURE.md) pour une explication détaillée,
écrite pour une personne pas nécessairement technique.

Ce projet correspond à la Phase A (MVP) décrite dans le document de cadrage
`Prompt_developpement_complet.md` : pipeline complet (dépôt → extraction → règles → anomalies →
validation → restitution), exécutable en local, sur 2 profils / 2 dossiers × 2 projets.

## Démarrage rapide (première installation)

**Prérequis** : Node.js 20+ (déjà installé si vous lisez ceci depuis ce poste), un compte gratuit
sur [neon.tech](https://neon.tech) pour la base de données, et une clé API sur
[console.anthropic.com](https://console.anthropic.com) pour l'extraction des pièces.

1. **Copier la configuration** : dupliquez `.env.example` en `.env` et remplissez :
   - `DATABASE_URL` : l'URL de connexion fournie par Neon (créez un projet, région UE la plus proche
     de la Belgique — voir `.env.example` pour le détail).
   - `ANTHROPIC_API_KEY` : votre clé API Anthropic.
   - `NEXTAUTH_SECRET` : une valeur aléatoire (voir le commentaire dans `.env.example` pour la
     générer).

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Créer les tables dans la base de données** :
   ```bash
   npx prisma migrate dev --name init
   ```

4. **Charger un jeu de données de test** (2 profils, 2 dossiers × 2 projets, comptes de test) :
   ```bash
   npx prisma db seed
   ```
   Cela affiche dans le terminal les identifiants de connexion à utiliser (à changer avant tout
   usage réel).

5. **Lancer l'application** :
   ```bash
   npm run dev
   ```
   puis ouvrir [http://localhost:3000](http://localhost:3000).

## Commandes utiles

| Commande | Effet |
|---|---|
| `npm run dev` | Lance l'application en local (rechargement automatique). |
| `npm run build` puis `npm run start` | Construit puis lance une version de production locale. |
| `npm run lint` | Vérifie la qualité du code. |
| `npm test` | Exécute les tests automatisés (moteur de règles, extraction). |
| `npx prisma studio` | Interface graphique pour explorer/modifier directement les données. |
| `npx prisma migrate dev --name <description>` | Applique un changement du modèle de données (`prisma/schema.prisma`). |

## Où trouver quoi

- `prisma/schema.prisma` : modèle de données (toutes les entités : dossiers, projets, pièces, règles, anomalies, rapports…).
- `prisma/seed.ts` : jeu de données de test.
- `src/app/` : les pages de l'application et les points d'API.
- `src/lib/` : la logique métier (extraction, moteur de règles, rapports, stockage, authentification).
- `src/components/` : les éléments d'interface réutilisables.

Pour une explication de l'architecture destinée à une personne non technique, voir
[`ARCHITECTURE.md`](./ARCHITECTURE.md).
