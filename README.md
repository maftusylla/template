# Template HTML / CSS / JS — Cours-Alygne

Template front-end autonome, moderne et responsive conçu dans un dossier séparé (`/template`) pour s’intégrer manuellement au backend **Cours-Alygne** sans dépendance de build.

## Structure du dossier

- `index.html` — Page d’accueil / Catalogue des formations (`GET /api/courses`).
- `cours.html` — Détail d’un cours, syllabus des modules, lecteur de leçons, inscription et progression `0–100%`.
- `mes-cours.html` — Suivi personnel des inscriptions (`GET /api/enrollments/me`).
- `connexion.html` — Connexion utilisateur (`POST /api/auth/login`, rotation `POST /api/auth/refresh`).
- `inscription.html` — Création de compte apprenant (`POST /api/auth/register`).
- `verification-email.html` — Validation d’adresse e-mail par jeton unique (`POST /api/auth/email/verify`).
- `mot-de-passe-oublie.html` — Demande de lien et réinitialisation de mot de passe (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`).
- `profil.html` — Édition du profil, mot de passe, changement d’e-mail, gestion/révocation des sessions et désactivation du compte.
- `studio.html` — Studio formateur : création, modification, publication, suppression logique de cours, modules, leçons et inscriptions manuelles.
- `admin.html` — Administration des utilisateurs (`/api/users/*`), journal d’audit, simulateur Santé/RBAC (`/api/demo/*`) et inventaire des 44 routes.
- `styles.css` — Système de design *Studio moderne chaleureux* (graphite, pierre et ambre) incluant mode clair et mode sombre (`html.dark`).
- `js/api-adapter.js` — Données de démonstration hors ligne et inventaire des 44 routes de l’API Express.
- `js/app.js` — Logique interactive multi-pages avec persistance de session de démonstration (`sessionStorage`) et thème (`localStorage`).
- `assets/images/` — Visuels haute résolution générés localement.

## Visualisation & Intégration

1. **Visualisation immédiate** : ouvrez `/preview/index.html` sur le serveur de développement (ou servez le dossier `template/` avec `npx serve template`).
2. **Intégration backend** : remplacez les mutations en mémoire de `template/js/app.js` par des appels `fetch('/api/...')` avec l’en-tête `Authorization: Bearer <access_token>`.
