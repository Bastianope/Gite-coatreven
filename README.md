# 🏡 Gîte du Trégor — gite-coatreven.fr

## ✅ Configuration actuelle

| Paramètre | Valeur |
|-----------|--------|
| Supabase URL | https://ikiuywbosyvcvaaifxfo.supabase.co |
| Email contact | herve.peillet@orange.fr |
| Mot de passe admin | Kermest |
| Hébergement | Vercel |
| Domaine | gite-coatreven.fr |

---

## 🚀 Déploiement — étapes restantes

### 1. Supabase — créer les tables (à faire UNE SEULE FOIS)

1. Allez sur [supabase.com](https://supabase.com) → votre projet
2. **SQL Editor** → **New**
3. Copiez-collez le contenu de `supabase_setup.sql`
4. Cliquez **Run**

### 2. GitHub — pousser le code

```bash
git init
git add .
git commit -m "Gîte du Trégor — premier déploiement"
git remote add origin https://github.com/VOTRE_PSEUDO/gite-coatreven.git
git push -u origin main
```

### 3. Vercel — déployer

1. Allez sur [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Importez votre repo GitHub `gite-coatreven`
3. Laissez tous les paramètres par défaut → **Deploy**
4. Le site est en ligne sur `gite-coatreven.vercel.app`

### 4. OVH — brancher le domaine gite-coatreven.fr

Dans Vercel → votre projet → **Settings** → **Domains** :
- Ajoutez `gite-coatreven.fr`
- Vercel vous donne les valeurs DNS à renseigner

Dans OVH → Zone DNS de `gite-coatreven.fr` :
- Supprimez l'entrée **A** existante (216.198.79.1)
- Supprimez le **CNAME www** existant (vercel-dns-017)
- Ajoutez les nouvelles entrées que Vercel vous indique

> ⏳ Propagation DNS : 1 à 4 heures

### 5. EmailJS — à faire avec vos parents (plus tard)

1. [emailjs.com](https://emailjs.com) → compte gratuit
2. Add Service → Gmail → connecter herve.peillet@orange.fr
3. Email Templates → créer un template
4. Renseigner les 3 IDs dans `js/app.js` (CONFIG.EMAILJS_*)

---

## 🔐 Espace admin

- Bouton **⚙ Propriétaires** en haut à droite
- Mot de passe : **Kermest**
- Gestion des réservations, tarifs, demandes reçues

