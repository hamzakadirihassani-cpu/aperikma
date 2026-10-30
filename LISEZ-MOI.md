# Site Aperi'k : mise en ligne sur Render

Site statique (une page `index.html`, le logo et le dossier `photos/`). Pas de serveur, pas de base de données, rien à installer.

## Contenu du dossier

| Fichier | Rôle |
|---|---|
| `index.html` | Le site complet (accueil, catalogue, contact) |
| `logo.png` | Le logo, aussi utilisé comme icône d'onglet |
| `photos/` | Les 270 photos de bouteilles |
| `render.yaml` | La configuration Render (lue automatiquement) |
| `.gitignore` | Fichiers Windows à ne pas envoyer |

## 1. Mettre le dossier sur GitHub

L'envoi par le site GitHub est limité à 100 fichiers à la fois, et il y a 270 photos. Passe par GitHub Desktop ou par Git.

**Avec GitHub Desktop (le plus simple)**
1. File → Add local repository → choisir le dossier `Aperik-site` → « create a repository ».
2. Commit to main.
3. Publish repository (tu peux le laisser privé).

**Avec Git, dans le dossier `Aperik-site`**
```
git init
git add .
git commit -m "Site Aperi'k"
git branch -M main
git remote add origin https://github.com/TON-COMPTE/aperik-site.git
git push -u origin main
```
(Crée d'abord le dépôt vide `aperik-site` sur github.com.)

## 2. Créer le site sur Render

**Option A, Blueprint (utilise `render.yaml`)**
1. Sur dashboard.render.com : New → Blueprint.
2. Choisir le dépôt `aperik-site`, puis Apply.

**Option B, à la main**
1. New → Static Site → choisir le dépôt.
2. Build Command : laisser vide (ou `echo ok`).
3. Publish Directory : `.`
4. Create Static Site.

Le site sera en ligne sur une adresse du type `https://aperik.onrender.com`. Les sites statiques sont gratuits sur Render.

## 3. Brancher ton nom de domaine (facultatif)

1. Dans Render : le site → Settings → Custom Domains → Add (par ex. `www.aperik.ma`).
2. Chez ton registraire de domaine, ajoute l'enregistrement DNS que Render t'indique (un CNAME vers `aperik.onrender.com` pour `www`).
3. Le certificat HTTPS est créé automatiquement.

## Mettre à jour le site

Chaque modification envoyée sur GitHub (commit + push) est republiée automatiquement par Render en une minute environ.

- **Ajouter une photo** : mettre le fichier dans `photos/`, puis dans `index.html` remplir `img:"photos/nom-du-fichier.webp"` sur la ligne du produit (tableau `PRODUITS`). Les produits avec `img:null` restent cachés tant qu'ils n'ont pas de photo.
- **Mettre un prix** : remplacer `prix:null` par `prix:"250 DH"` sur la ligne du produit.
