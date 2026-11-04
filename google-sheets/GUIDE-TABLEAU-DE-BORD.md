# Tableau de bord Aperi'k (Google Sheets)

Chaque commande « retrait en magasin » et chaque demande de carte adhérent du site arrive
dans un Google Sheets, avec un e-mail de notification sur hamza.kadirihassani@gmail.com.

Le classeur contient 3 onglets :
- **Tableau de bord** : nombre de commandes (jour, mois, total), à préparer, prêtes, retirées,
  chiffre d'affaires, nombre d'adhérents, recette des cartes (399 DH), par cave.
- **Commandes** : une ligne par commande. Change la colonne **Statut** au fil de l'eau :
  Nouvelle → En préparation → Prête → Retirée (ou Annulée).
- **Adherents** : une ligne par demande. Statut : Nouvelle → Contactée → Payée → Carte remise.

## Installation (10 minutes, une seule fois)

1. Va sur **sheets.google.com** et crée un classeur vide. Nomme-le « Aperi'k – Commandes ».
2. Menu **Extensions → Apps Script**.
3. Efface tout le code affiché, puis colle le contenu du fichier **Code.gs** (dans ce dossier).
   Clique l'icône **Enregistrer** (disquette).
4. En haut, dans la liste des fonctions, choisis **installer**, puis clique **▶ Exécuter**.
   - Google demande une autorisation : **Examiner les autorisations** → choisis ton compte →
     **Paramètres avancés** → **Accéder à Aperi'k (non sécurisé)** → **Autoriser**.
     (C'est ton propre script : Google affiche ce message pour tout script personnel.)
   - Reviens sur le classeur : les 3 onglets sont créés.
5. Clique **Déployer → Nouveau déploiement**.
   - Roue dentée → **Application Web**.
   - **Exécuter en tant que** : Moi.
   - **Qui a accès** : **Tout le monde**.
   - **Déployer**, puis copie l'**URL de l'application Web** (elle se termine par `/exec`).
6. Envoie cette URL à Claude : il la met dans le site (`SHEETS_URL` dans `index.html`) et republie.

Tant que l'URL n'est pas mise, les commandes partent sur WhatsApp (07 68 70 85 07)
et les adhésions par e-mail (FormSubmit).

## Au quotidien

- Ouvre le classeur sur ton téléphone (application Google Sheets) : onglet **Tableau de bord**.
- Une nouvelle commande = un e-mail « Nouvelle commande C0001… ». Rappelle le client,
  prépare la commande, passe le statut à **Prête**, puis **Retirée** quand il est passé.
- Pour partager avec le personnel de la cave : bouton **Partager** du classeur.

## Si tu modifies le script plus tard

Après chaque modification : **Déployer → Gérer les déploiements → crayon → Version : Nouvelle version → Déployer**.
L'URL reste la même.
