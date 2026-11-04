/**
 * Aperi'k — réception des commandes (retrait en magasin) et des demandes de carte adhérent.
 * À coller dans Google Sheets : Extensions → Apps Script. Voir GUIDE-TABLEAU-DE-BORD.md.
 *
 * Le site envoie ses données ici ; chaque envoi devient une ligne du classeur
 * et un e-mail de notification part vers ALERTE_EMAIL.
 */

const ALERTE_EMAIL = 'hamza.kadirihassani@gmail.com';
const STATUTS_COMMANDE = ['Nouvelle', 'En préparation', 'Prête', 'Retirée', 'Annulée'];
const STATUTS_ADHESION = ['Nouvelle', 'Contactée', 'Payée', 'Carte remise', 'Annulée'];

const COLONNES = {
  'Commandes': ['N°', 'Date', 'Statut', 'Cave', 'Retrait prévu', 'Prénom', 'Nom', 'Téléphone', 'E-mail',
                'Articles', 'Nb articles', 'Total (DH)', 'Note du client', 'Note interne'],
  'Adherents': ['N°', 'Date', 'Statut', 'Cave', 'Prénom', 'Nom', 'Téléphone', 'E-mail', 'Note interne'],
};

/** À lancer une fois depuis l'éditeur (bouton ▶ Exécuter) : crée les onglets et le tableau de bord. */
function installer() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  for (const [nom, cols] of Object.entries(COLONNES)) {
    const sh = ss.getSheetByName(nom) || ss.insertSheet(nom);
    if (sh.getLastRow() === 0) sh.appendRow(cols);
    sh.getRange(1, 1, 1, cols.length).setFontWeight('bold').setBackground('#2a1530').setFontColor('#ffffff');
    sh.setFrozenRows(1);
    const statuts = nom === 'Commandes' ? STATUTS_COMMANDE : STATUTS_ADHESION;
    sh.getRange('C2:C').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(statuts, true).build());
  }
  construireTableauDeBord_(ss);
  const vide = ss.getSheetByName('Feuille 1') || ss.getSheetByName('Sheet1');
  if (vide && vide.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(vide);
}

function construireTableauDeBord_(ss) {
  const sh = ss.getSheetByName('Tableau de bord') || ss.insertSheet('Tableau de bord', 0);
  sh.clear();
  const lignes = [
    ["Tableau de bord Aperi'k", ''],
    ['', ''],
    ['COMMANDES', ''],
    ['Commandes reçues (total)', '=COUNTA(Commandes!A2:A)'],
    ["Commandes aujourd'hui", '=COUNTIFS(Commandes!B2:B,">="&TODAY(),Commandes!B2:B,"<"&TODAY()+1)'],
    ['Commandes ce mois-ci', '=COUNTIFS(Commandes!B2:B,">="&EOMONTH(TODAY(),-1)+1)'],
    ['À préparer (Nouvelle + En préparation)', '=COUNTIF(Commandes!C2:C,"Nouvelle")+COUNTIF(Commandes!C2:C,"En préparation")'],
    ['Prêtes, en attente de retrait', '=COUNTIF(Commandes!C2:C,"Prête")'],
    ['Retirées', '=COUNTIF(Commandes!C2:C,"Retirée")'],
    ['Chiffre d\'affaires retiré (DH)', '=SUMIF(Commandes!C2:C,"Retirée",Commandes!L2:L)'],
    ['Montant total commandé (DH)', '=SUMIF(Commandes!C2:C,"<>Annulée",Commandes!L2:L)'],
    ['Commandes Casablanca', '=COUNTIF(Commandes!D2:D,"Casablanca")'],
    ['Commandes Marrakech', '=COUNTIF(Commandes!D2:D,"Marrakech")'],
    ['', ''],
    ['CARTES ADHÉRENT (399 DH/an)', ''],
    ['Demandes reçues (total)', '=COUNTA(Adherents!A2:A)'],
    ['Demandes ce mois-ci', '=COUNTIFS(Adherents!B2:B,">="&EOMONTH(TODAY(),-1)+1)'],
    ['À contacter (Nouvelle)', '=COUNTIF(Adherents!C2:C,"Nouvelle")'],
    ['Adhésions payées', '=COUNTIF(Adherents!C2:C,"Payée")+COUNTIF(Adherents!C2:C,"Carte remise")'],
    ['Recette adhésions (DH)', '=(COUNTIF(Adherents!C2:C,"Payée")+COUNTIF(Adherents!C2:C,"Carte remise"))*399'],
    ['Adhérents Casablanca', '=COUNTIF(Adherents!D2:D,"Casablanca")'],
    ['Adhérents Marrakech', '=COUNTIF(Adherents!D2:D,"Marrakech")'],
  ];
  sh.getRange(1, 1, lignes.length, 2).setValues(lignes);
  sh.getRange('A1').setFontSize(16).setFontWeight('bold');
  sh.getRange('A3').setFontWeight('bold').setFontColor('#b0187a');
  sh.getRange('A15').setFontWeight('bold').setFontColor('#b0187a');
  sh.getRange('B4:B22').setFontWeight('bold').setHorizontalAlignment('right');
  sh.setColumnWidth(1, 320); sh.setColumnWidth(2, 140);
}

/** Point d'entrée : le site envoie un JSON { type: 'commande' | 'adhesion', ... }. */
function doPost(e) {
  const verrou = LockService.getScriptLock();
  verrou.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    if (d.site_web) return repondre_({ ok: true }); // champ piège anti-robots rempli : on ignore
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss.getSheetByName('Commandes')) installer();
    if (d.type === 'commande') return repondre_({ ok: true, numero: enregistrerCommande_(ss, d) });
    if (d.type === 'adhesion') return repondre_({ ok: true, numero: enregistrerAdhesion_(ss, d) });
    return repondre_({ ok: false, erreur: 'type inconnu' });
  } catch (err) {
    return repondre_({ ok: false, erreur: String(err) });
  } finally {
    verrou.releaseLock();
  }
}

function doGet() {
  return repondre_({ ok: true, service: "Aperi'k" });
}

function enregistrerCommande_(ss, d) {
  const sh = ss.getSheetByName('Commandes');
  const numero = 'C' + String(sh.getLastRow()).padStart(4, '0');
  const articles = (d.articles || []).map(a => `${a.qte} × ${a.nom}${a.info ? ' (' + a.info + ')' : ''} — ${a.prix} DH`);
  const nb = (d.articles || []).reduce((s, a) => s + Number(a.qte || 0), 0);
  const total = Number(d.total || 0);
  sh.appendRow([numero, new Date(), 'Nouvelle', d.cave || '', d.retrait || '', d.prenom || '', d.nom || '',
                "'" + (d.telephone || ''), d.email || '', articles.join('\n'), nb, total, d.note || '', '']);
  MailApp.sendEmail(ALERTE_EMAIL, `Nouvelle commande ${numero} — ${d.cave} — ${total} DH`,
    `Commande ${numero} à retirer à ${d.cave}\nRetrait prévu : ${d.retrait}\n\n` +
    `Client : ${d.prenom} ${d.nom} — ${d.telephone}${d.email ? ' — ' + d.email : ''}\n\n` +
    `${articles.join('\n')}\n\nTotal : ${total} DH (paiement en magasin)\n` +
    (d.note ? `\nNote : ${d.note}\n` : '') + `\nSuivi : ${ss.getUrl()}`);
  return numero;
}

function enregistrerAdhesion_(ss, d) {
  const sh = ss.getSheetByName('Adherents');
  const numero = 'A' + String(sh.getLastRow()).padStart(4, '0');
  sh.appendRow([numero, new Date(), 'Nouvelle', d.cave || '', d.prenom || '', d.nom || '',
                "'" + (d.telephone || ''), d.email || '', '']);
  MailApp.sendEmail(ALERTE_EMAIL, `Nouvelle demande de carte adhérent ${numero} — ${d.cave}`,
    `${d.prenom} ${d.nom} — ${d.telephone}${d.email ? ' — ' + d.email : ''}\nCave : ${d.cave}\n\n` +
    `À rappeler pour finaliser l'adhésion (399 DH/an, 5 % de remise).\n\nSuivi : ${ss.getUrl()}`);
  return numero;
}

function repondre_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
