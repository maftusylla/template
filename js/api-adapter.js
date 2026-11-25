/**
 * Cours-Alygne — Adaptateur de données statiques & carte des routes API
 * ----------------------------------------------------------------------
 * Maquette autonome prête à brancher manuellement sur votre backend Express.
 * Pour passer sur le vrai serveur, remplacez le corps des méthodes de
 * `TemplateApi` par des appels `fetch(`${API_BASE_URL}...`, ...)`.
 */

export const API_BASE_URL = '/api'

export const API_ROUTES_CATALOG = [
  { group: 'Système', method: 'GET', path: '/api/health', access: 'Public', summary: 'État du processus HTTP' },
  { group: 'Système', method: 'GET', path: '/api/health/database', access: 'Public', summary: 'Vérification connexion MySQL' },
  { group: 'Auth', method: 'POST', path: '/api/auth/register', access: 'Public', summary: 'Inscription apprenant + 1re session' },
  { group: 'Auth', method: 'POST', path: '/api/auth/login', access: 'Public', summary: 'Connexion + émission JWT' },
  { group: 'Auth', method: 'POST', path: '/api/auth/refresh', access: 'Public', summary: 'Rotation du refresh token' },
  { group: 'Auth', method: 'POST', path: '/api/auth/logout', access: 'Public', summary: 'Révocation de session courante' },
  { group: 'Auth', method: 'POST', path: '/api/auth/forgot-password', access: 'Public', summary: 'Demande de lien de réinitialisation' },
  { group: 'Auth', method: 'POST', path: '/api/auth/reset-password', access: 'Public', summary: 'Réinitialisation via token unique' },
  { group: 'Auth', method: 'POST', path: '/api/auth/email/verify', access: 'Public', summary: 'Vérification d’adresse e-mail' },
  { group: 'Profil', method: 'GET', path: '/api/auth/me', access: 'Authentifié', summary: 'Profil de l’utilisateur courant' },
  { group: 'Profil', method: 'PATCH', path: '/api/auth/profile', access: 'Authentifié', summary: 'Modification du nom du profil' },
  { group: 'Profil', method: 'PATCH', path: '/api/auth/password', access: 'Authentifié', summary: 'Changement de mot de passe' },
  { group: 'Profil', method: 'POST', path: '/api/auth/email/change', access: 'Authentifié', summary: 'Changement d’adresse e-mail' },
  { group: 'Profil', method: 'POST', path: '/api/auth/email/verification-notification', access: 'Authentifié', summary: 'Renvoi du lien de vérification' },
  { group: 'Sessions', method: 'POST', path: '/api/auth/logout-all', access: 'Authentifié', summary: 'Déconnexion de tous les appareils' },
  { group: 'Sessions', method: 'GET', path: '/api/auth/sessions', access: 'Authentifié', summary: 'Liste des sessions actives' },
  { group: 'Sessions', method: 'DELETE', path: '/api/auth/sessions/:sessionId', access: 'Authentifié', summary: 'Révocation d’une session' },
  { group: 'Profil', method: 'DELETE', path: '/api/auth/account', access: 'Authentifié (non-admin)', summary: 'Désactivation du compte (DESACTIVER)' },
  { group: 'Cours', method: 'GET', path: '/api/courses', access: 'Vérifié', summary: 'Catalogue paginé selon le rôle' },
  { group: 'Cours', method: 'POST', path: '/api/courses', access: 'admin | teacher', summary: 'Création d’un cours (brouillon)' },
  { group: 'Cours', method: 'GET', path: '/api/courses/:id', access: 'Vérifié', summary: 'Détail d’un cours' },
  { group: 'Cours', method: 'PATCH', path: '/api/courses/:id', access: 'admin | teacher', summary: 'Mise à jour titre / description' },
  { group: 'Cours', method: 'DELETE', path: '/api/courses/:id', access: 'admin | teacher', summary: 'Suppression logique du cours' },
  { group: 'Cours', method: 'PATCH', path: '/api/courses/:id/publish', access: 'admin | teacher', summary: 'Publication d’un cours' },
  { group: 'Modules', method: 'GET', path: '/api/courses/:id/modules', access: 'Authentifié', summary: 'Modules paginés d’un cours' },
  { group: 'Modules', method: 'POST', path: '/api/courses/:id/modules', access: 'admin | teacher', summary: 'Ajout d’un module au cours' },
  { group: 'Leçons', method: 'GET', path: '/api/courses/modules/:moduleId/lessons', access: 'Authentifié', summary: 'Leçons paginées d’un module' },
  { group: 'Leçons', method: 'POST', path: '/api/courses/modules/:moduleId/lessons', access: 'admin | teacher', summary: 'Création d’une leçon' },
  { group: 'Inscriptions', method: 'POST', path: '/api/courses/:courseId/enroll', access: 'learner', summary: 'Auto-inscription à un cours publié' },
  { group: 'Inscriptions', method: 'GET', path: '/api/courses/:courseId/enrollments', access: 'admin | teacher', summary: 'Liste des inscrits d’un cours' },
  { group: 'Inscriptions', method: 'POST', path: '/api/courses/:courseId/enrollments', access: 'admin | teacher', summary: 'Inscription manuelle par userId' },
  { group: 'Inscriptions', method: 'GET', path: '/api/enrollments/me', access: 'learner', summary: 'Mes inscriptions et progressions' },
  { group: 'Inscriptions', method: 'PUT', path: '/api/enrollments/:enrollmentId/lessons/:lessonId/progress', access: 'learner', summary: 'Mise à jour progression leçon (0–100)' },
  { group: 'Admin', method: 'GET', path: '/api/users', access: 'admin', summary: 'Liste filtrée et paginée des comptes' },
  { group: 'Admin', method: 'POST', path: '/api/users', access: 'admin', summary: 'Création d’un compte avec rôle' },
  { group: 'Admin', method: 'GET', path: '/api/users/:id', access: 'admin', summary: 'Fiche détaillée d’un utilisateur' },
  { group: 'Admin', method: 'PATCH', path: '/api/users/:id/role', access: 'admin', summary: 'Changement de rôle + révocation sessions' },
  { group: 'Admin', method: 'PATCH', path: '/api/users/:id/active', access: 'admin', summary: 'Activation / désactivation de compte' },
  { group: 'Admin', method: 'POST', path: '/api/users/:id/revoke-sessions', access: 'admin', summary: 'Révocation forcée des sessions' },
  { group: 'Admin', method: 'GET', path: '/api/users/:id/security-events', access: 'admin', summary: 'Journal des événements d’audit' },
  { group: 'Démo RBAC', method: 'GET', path: '/api/demo/authenticated', access: 'Authentifié', summary: 'Test middleware authenticate' },
  { group: 'Démo RBAC', method: 'GET', path: '/api/demo/verified', access: 'Vérifié', summary: 'Test middleware requireVerifiedEmail' },
  { group: 'Démo RBAC', method: 'GET', path: '/api/demo/admin', access: 'admin', summary: 'Test middleware authorize(admin)' },
  { group: 'Démo RBAC', method: 'GET', path: '/api/demo/teaching-team', access: 'admin | teacher', summary: 'Test authorize(admin, teacher)' },
]

export const initialStore = {
  users: [
    {
      id: '927d26c0-c408-4d9e-90d3-459b5d0ea701',
      name: 'Awa Ndiaye',
      email: 'awa.ndiaye@cours-alygne.edu',
      role: 'learner',
      is_active: true,
      email_verified: true,
      email_verified_at: '2026-10-12T09:30:00.000Z',
      last_login_at: '2026-11-24T18:10:00.000Z',
      created_at: '2026-10-12T09:00:00.000Z',
      avatar: 'assets/images/instructor-portrait.jpg',
    },
    {
      id: '927d26c0-c408-4d9e-90d3-459b5d0ea702',
      name: 'Mame Fatou Sylla',
      email: 'fatou.sylla@cours-alygne.edu',
      role: 'teacher',
      is_active: true,
      email_verified: true,
      email_verified_at: '2026-09-18T11:20:00.000Z',
      last_login_at: '2026-11-24T19:45:00.000Z',
      created_at: '2026-09-18T11:00:00.000Z',
      avatar: 'assets/images/instructor-portrait.jpg',
    },
    {
      id: '927d26c0-c408-4d9e-90d3-459b5d0ea703',
      name: 'Ibrahima Diallo',
      email: 'ibrahima.admin@cours-alygne.edu',
      role: 'admin',
      is_active: true,
      email_verified: true,
      email_verified_at: '2026-09-01T08:00:00.000Z',
      last_login_at: '2026-11-24T20:15:00.000Z',
      created_at: '2026-09-01T08:00:00.000Z',
      avatar: 'assets/images/instructor-portrait.jpg',
    },
    {
      id: '927d26c0-c408-4d9e-90d3-459b5d0ea704',
      name: 'Cheikh Mbaye',
      email: 'cheikh.mbaye@cours-alygne.edu',
      role: 'learner',
      is_active: true,
      email_verified: false,
      email_verified_at: null,
      last_login_at: '2026-11-22T14:12:00.000Z',
      created_at: '2026-11-20T10:00:00.000Z',
      avatar: 'assets/images/instructor-portrait.jpg',
    },
    {
      id: '927d26c0-c408-4d9e-90d3-459b5d0ea705',
      name: 'Mariama Bâ',
      email: 'mariama.ba@cours-alygne.edu',
      role: 'teacher',
      is_active: false,
      email_verified: true,
      email_verified_at: '2026-08-14T16:40:00.000Z',
      last_login_at: '2026-10-02T09:15:00.000Z',
      created_at: '2026-08-14T16:00:00.000Z',
      avatar: 'assets/images/instructor-portrait.jpg',
    },
  ],

  courses: [
    {
      id: 'c1111111-1111-4111-8111-111111111101',
      titre: 'Architecture API REST avec Node.js, TypeScript et Express 5',
      description:
        'Concevez des services backend maintenables : séparation contrôleur/service/repository, validation Zod stricte, gestion centralisée des erreurs et documentation OpenAPI.',
      status: 'published',
      userId: '927d26c0-c408-4d9e-90d3-459b5d0ea702',
      authorName: 'Mame Fatou Sylla',
      image: 'assets/images/course-architecture.jpg',
      category: 'Ingénierie Backend',
      duration: '6h 40m',
      createdAt: '2026-10-15T09:00:00.000Z',
    },
    {
      id: 'c1111111-1111-4111-8111-111111111102',
      titre: 'Systèmes de Design Éditoriaux & Interfaces Responsives',
      description:
        'Maîtrisez les grilles CSS modernes, la hiérarchie typographique, les jetons sémantiques clair/sombre et l’accessibilité WCAG AA pour des produits numériques durables.',
      status: 'published',
      userId: '927d26c0-c408-4d9e-90d3-459b5d0ea702',
      authorName: 'Mame Fatou Sylla',
      image: 'assets/images/course-ui-systems.jpg',
      category: 'Design d’Interface',
      duration: '5h 15m',
      createdAt: '2026-10-28T14:20:00.000Z',
    },
    {
      id: 'c1111111-1111-4111-8111-111111111103',
      titre: 'Sécurité Applicative, JWT, Rotation de Jetons & RBAC',
      description:
        'Implémentez une authentification robuste : hachage bcryptjs, détection de réutilisation des refresh tokens, auth_version, audit de sécurité et contrôle d’accès par rôles.',
      status: 'published',
      userId: '927d26c0-c408-4d9e-90d3-459b5d0ea703',
      authorName: 'Ibrahima Diallo',
      image: 'assets/images/course-security.jpg',
      category: 'Cybersécurité',
      duration: '7h 10m',
      createdAt: '2026-11-04T11:00:00.000Z',
    },
    {
      id: 'c1111111-1111-4111-8111-111111111104',
      titre: 'Ingénierie Pédagogique & Scénarisation de Parcours en Ligne',
      description:
        'Structurez vos cours en modules progressifs, rédigez des leçons actionnables et mesurez la rétention des apprenants grâce aux indicateurs de complétion.',
      status: 'draft',
      userId: '927d26c0-c408-4d9e-90d3-459b5d0ea702',
      authorName: 'Mame Fatou Sylla',
      image: 'assets/images/course-pedagogy.jpg',
      category: 'Pédagogie Numérique',
      duration: '4h 20m',
      createdAt: '2026-11-19T16:30:00.000Z',
    },
  ],

  modules: [
    {
      id: 'm1111111-1111-4111-8111-111111111101',
      courseId: 'c1111111-1111-4111-8111-111111111101',
      titre: 'Module 01 · Architecture en couches et cycle de requête',
      description: 'Comprendre la traversée des middlewares Express 5, la validation et l’injection de dépendances.',
      order: 1,
    },
    {
      id: 'm1111111-1111-4111-8111-111111111102',
      courseId: 'c1111111-1111-4111-8111-111111111101',
      titre: 'Module 02 · Persistance Sequelize et gestion des erreurs',
      description: 'Modéliser les entités relationnelles, transactions verrouillées et réponses normalisées.',
      order: 2,
    },
    {
      id: 'm1111111-1111-4111-8111-111111111103',
      courseId: 'c1111111-1111-4111-8111-111111111102',
      titre: 'Module 01 · Fondations typographiques et échelles spatiales',
      description: 'Composer une lecture confortable sur bureau et mobile avec des proportions cohérentes.',
      order: 1,
    },
    {
      id: 'm1111111-1111-4111-8111-111111111104',
      courseId: 'c1111111-1111-4111-8111-111111111103',
      titre: 'Module 01 · Anatomie des jetons JWT et sessions révocables',
      description: 'Concilier performance des access tokens courts et sécurité des refresh tokens rotatifs.',
      order: 1,
    },
    {
      id: 'm1111111-1111-4111-8111-111111111105',
      courseId: 'c1111111-1111-4111-8111-111111111104',
      titre: 'Module 01 · Structurer un syllabus orienté compétence',
      description: 'Découper un objectif global en modules cohérents et séquences de 15 minutes.',
      order: 1,
    },
  ],

  lessons: [
    {
      id: 'l1111111-1111-4111-8111-111111111101',
      moduleId: 'm1111111-1111-4111-8111-111111111101',
      titre: '1.1 Anatomie d’une route Express 5 et contrat request_id',
      contenu:
        'Chaque requête entrante traverse une chaîne ordonnée de middlewares : attribution d’un identifiant UUID traçable (x-request-id), journalisation structurée avec rédaction des champs sensibles, en-têtes de sécurité HTTP, contrôle CORS et limitation de débit par couple réseau/identité.\n\nEn isolant la validation des paramètres et du corps JSON via Zod avant d’entrer dans le contrôleur, la couche métier ne manipule jamais de données brutes non vérifiées.',
      duration: '18 min',
    },
    {
      id: 'l1111111-1111-4111-8111-111111111102',
      moduleId: 'm1111111-1111-4111-8111-111111111101',
      titre: '1.2 Séparer Controller, Service et Repository',
      contenu:
        'Le contrôleur extrait uniquement les champs validés et formate la réponse HTTP uniforme (sendSuccess). Le service porte les règles métier (droits d’auteur, règles de publication, unicité) et reste testable en mémoire sans base SQL grâce à des interfaces de repository.\n\nCe découplage permet d’exécuter près de cent tests unitaires en quelques secondes tout en conservant une implémentation Sequelize stricte en production.',
      duration: '24 min',
    },
    {
      id: 'l1111111-1111-4111-8111-111111111103',
      moduleId: 'm1111111-1111-4111-8111-111111111102',
      titre: '2.1 Suppression logique et intégrité des inscriptions',
      contenu:
        'L’utilisation de paranoid: true avec colonne deleted_at évite de briser l’historique d’apprentissage des apprenants lorsqu’un formateur archive un cours.\n\nLes contraintes de clé étrangère restent intactes et les cours archivés disparaissent automatiquement des requêtes standards.',
      duration: '21 min',
    },
    {
      id: 'l1111111-1111-4111-8111-111111111104',
      moduleId: 'm1111111-1111-4111-8111-111111111103',
      titre: '1.1 Palette 60-30-10 et contraste en mode sombre',
      contenu:
        'Un thème sombre réussi n’est jamais une simple inversion de couleurs. Il repose sur des surfaces graphite nuancées avec un écart de luminosité inférieur à 12 %, une compensation optique légère de l’interlettrage et un accent ambre calibré pour préserver un ratio WCAG AA sur tous les boutons.',
      duration: '19 min',
    },
    {
      id: 'l1111111-1111-4111-8111-111111111105',
      moduleId: 'm1111111-1111-4111-8111-111111111104',
      titre: '1.1 Rotation des refresh tokens et détection de vol',
      contenu:
        'Un refresh token n’est utilisé qu’une seule fois. Lors de son renouvellement via POST /api/auth/refresh, le serveur révoque l’ancien jeton sous verrou transactionnel et émet un successeur lié par replacedById.\n\nSi un ancien jeton déjà roté est rejoué, toute la famille de session (sessionId) est immédiatement révoquée et auth_version est incrémenté.',
      duration: '26 min',
    },
    {
      id: 'l1111111-1111-4111-8111-111111111106',
      moduleId: 'm1111111-1111-4111-8111-111111111105',
      titre: '1.1 Concevoir la courbe de progression d’un module',
      contenu:
        'Chaque module doit répondre à un objectif observable et contenir trois à cinq leçons progressives permettant à l’apprenant de valider sa progression étape par étape.',
      duration: '15 min',
    },
  ],

  enrollments: [
    {
      id: 'e1111111-1111-4111-8111-111111111101',
      courseId: 'c1111111-1111-4111-8111-111111111101',
      userId: '927d26c0-c408-4d9e-90d3-459b5d0ea701',
      enrolledAt: '2026-11-10T10:00:00.000Z',
      lessonProgress: {
        'l1111111-1111-4111-8111-111111111101': 100,
        'l1111111-1111-4111-8111-111111111102': 65,
        'l1111111-1111-4111-8111-111111111103': 0,
      },
    },
    {
      id: 'e1111111-1111-4111-8111-111111111102',
      courseId: 'c1111111-1111-4111-8111-111111111103',
      userId: '927d26c0-c408-4d9e-90d3-459b5d0ea701',
      enrolledAt: '2026-11-18T15:30:00.000Z',
      lessonProgress: {
        'l1111111-1111-4111-8111-111111111105': 40,
      },
    },
  ],

  sessions: [
    {
      session_id: 's1111111-1111-4111-8111-111111111101',
      ip_address: '197.149.240.18',
      user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/131.0',
      last_used_at: '2026-11-24T21:40:00.000Z',
      expires_at: '2026-12-01T21:40:00.000Z',
      is_current: true,
    },
    {
      session_id: 's1111111-1111-4111-8111-111111111102',
      ip_address: '41.82.114.92',
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1) Safari/604.1',
      last_used_at: '2026-11-23T08:15:00.000Z',
      expires_at: '2026-11-30T08:15:00.000Z',
      is_current: false,
    },
  ],

  securityEvents: [
    {
      id: 'a1',
      userId: '927d26c0-c408-4d9e-90d3-459b5d0ea701',
      event_type: 'auth.login.succeeded',
      status: 'success',
      ip_address: '197.149.240.18',
      created_at: '2026-11-24T18:10:00.000Z',
    },
    {
      id: 'a2',
      userId: '927d26c0-c408-4d9e-90d3-459b5d0ea701',
      event_type: 'auth.token.refreshed',
      status: 'success',
      ip_address: '197.149.240.18',
      created_at: '2026-11-24T18:25:00.000Z',
    },
    {
      id: 'a3',
      userId: '927d26c0-c408-4d9e-90d3-459b5d0ea701',
      event_type: 'auth.email.verified',
      status: 'success',
      ip_address: '41.82.114.92',
      created_at: '2026-10-12T09:30:00.000Z',
    },
  ],
}
