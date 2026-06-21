# CASA Coord

Outil de coordination de chantier pour CASA Zellner, ElenaFrank et les
projets suivants. Vue calendrier des projets -> Gantt chart par projet ->
table des taches editable, avec un compte par intervenant (macon,
electricien, plombier, architecte, coordinateur).

## Stack
- **Frontend** : React + Vite, deploye sur **Vercel**
- **Backend** : **Supabase** (Postgres + Auth email/mot de passe + Row Level Security + Realtime)
- **Code** : **GitHub**

## Regle de droits
- Tout le monde (authentifie) voit tous les projets et toutes les taches.
- Chacun ne peut **modifier/supprimer** que les taches qui lui sont assignees.
- Le coordinateur (Ahmed, `is_admin = true`) peut tout creer/modifier/supprimer,
  et seul lui peut creer de nouveaux projets.
- L'architecte (Barbara) voit tout, comme tout le monde, mais comme aucune
  tache ne lui est assignee par defaut, elle est de facto en lecture seule.

---

## 1. Mise en place Supabase

1. Va sur [supabase.com](https://supabase.com) -> **New project**.
   - Nom : `casa-coord` (ou ce que tu veux)
   - Region : `eu-central-1` (Frankfurt -- le plus proche de Munich)
   - Note le mot de passe de la base, tu n'en auras pas besoin au quotidien.

2. Une fois le projet cree, va dans **SQL Editor** -> **New query**, colle le
   contenu de `supabase/schema.sql` (dans ce depot) -> **Run**.
   Cela cree les tables `profiles`, `projects`, `tasks`, `task_comments`,
   les policies RLS, et le trigger qui cree automatiquement un profil a
   chaque inscription.

3. Va dans **Authentication -> Users -> Add user -> Create new user**, et cree
   les 5 comptes suivants. Pour chacun, mets un mot de passe temporaire
   (qu'ils pourront changer ensuite), et colle le JSON correspondant dans
   le champ **User Metadata** AVANT de cliquer sur "Create user" (c'est ce
   qui determine le role et le corps de metier -- voir `supabase/seed.sql`
   pour le detail exact) :

   | Personne | Email a choisir | trade | is_admin |
   |---|---|---|---|
   | Danuvvio Crispin | danuvvio@... | `general` | false |
   | Amin (Elektro Schmidtke) | amin@... | `electricite` | false |
   | Mehran (Pourhaustechnik) | mehran@... | `plomberie` | false |
   | Barbara Di Gregorio | barbara@... | `architecte` | false |
   | Ahmed Touati | ahmed@... | `coordinateur` | **true** |

4. Dans **SQL Editor**, ouvre `supabase/seed.sql`, remplace
   `COORDINATEUR_USER_ID` par l'UUID d'Ahmed (visible dans
   **Authentication -> Users**, colonne UID), puis execute la requete pour
   creer les deux premiers projets (CASA Zellner, ElenaFrank).

5. Recupere tes cles API : **Project Settings -> API**.
   - `Project URL` -> c'est `VITE_SUPABASE_URL`
   - `anon public` key -> c'est `VITE_SUPABASE_ANON_KEY`

6. (Recommande) Dans **Authentication -> Providers -> Email**, desactive
   "Allow new users to sign up" si tu veux que seuls ces 5 comptes crees
   manuellement puissent exister -- sinon n'importe qui pourrait s'inscrire
   tout seul depuis l'ecran de login (qui n'a pas de bouton inscription,
   mais autant fermer la porte cote Supabase aussi).

---

## 2. Mise en place GitHub

```bash
cd casa-coord
git init
git add .
git commit -m "Initial commit: CASA Coord"
gh repo create casa-coord --private --source=. --remote=origin --push
```

(Ou cree le repo manuellement sur github.com puis `git remote add origin ...`
et `git push -u origin main`.)

**Important** : ne commit jamais `.env.local` (deja ignore par `.gitignore`
via la regle `*.local`).

---

## 3. Mise en place Vercel

1. Sur [vercel.com](https://vercel.com) -> **Add New -> Project** -> importe
   le repo GitHub `casa-coord`.
2. Framework Preset : Vercel detecte Vite automatiquement.
3. Dans **Environment Variables**, ajoute :
   - `VITE_SUPABASE_URL` = (ton URL Supabase)
   - `VITE_SUPABASE_ANON_KEY` = (ta cle anon)
4. **Deploy**. A chaque `git push` sur `main`, Vercel redeploie automatiquement.

---

## 4. Lancer en local

```bash
npm install
cp .env.example .env.local
# edite .env.local avec tes vraies valeurs Supabase
npm run dev
```

---

## Fonctionnement

- **Page d'accueil** : calendrier/liste des projets actifs (comme l'onglet
  Proyectos). Clic sur une carte projet -> vue detaillee.
- **Page projet** : Gantt chart (barres colorees par statut, bordure
  coloree par corps de metier) au-dessus, table editable des taches
  en dessous -- exactement le schema demande.
- **Temps reel** : les mises a jour de taches se synchronisent
  automatiquement entre tous les utilisateurs connectes (Supabase Realtime),
  donc si Amin coche une tache "fait", Ahmed et Barbara la voient changer
  sans recharger la page.
- **Droits** : un non-admin qui tente d'editer une tache qui n'est pas la
  sienne recoit un refus (bloque cote base de donnees par RLS, pas
  seulement cote interface -- donc impossible a contourner).

## Etapes suivantes possibles
- Ajouter des pieces jointes/photos par tache (Supabase Storage)
- Notifications par email a l'assignation d'une tache
- Export PDF du planning pour Barbara
