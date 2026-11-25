import { API_ROUTES_CATALOG, initialStore } from './api-adapter.js'

const STORAGE_KEY_STORE = 'cours-alygne-demo-store-v1'
const STORAGE_KEY_USER = 'cours-alygne-demo-user-v1'

function loadStore() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_STORE)
    if (raw) return JSON.parse(raw)
  } catch (_e) {}
  return structuredClone(initialStore)
}

function loadUserId(loadedStore) {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY_USER)
    if (saved && loadedStore.users.some((u) => u.id === saved)) return saved
  } catch (_e) {}
  return loadedStore.users[0].id
}

const store = loadStore()

function persistState() {
  try {
    sessionStorage.setItem(STORAGE_KEY_STORE, JSON.stringify(store))
    sessionStorage.setItem(STORAGE_KEY_USER, state.currentUserId)
  } catch (_e) {}
}

const state = {
  route: document.body?.getAttribute('data-page') || 'catalogue',
  selectedCourseId:
    new URLSearchParams(window.location.search).get('id') || store.courses[0]?.id || '',
  selectedModuleId: store.modules[0]?.id || '',
  selectedLessonId: store.lessons[0]?.id || '',
  currentUserId: loadUserId(store),
  authTab: 'forgot',
  studioCourseId: store.courses[0]?.id || '',
  adminSelectedUserId: store.users[0]?.id || '',
  filters: {
    search: '',
    status: 'all',
    page: 1,
    perPage: 6,
    userSearch: '',
    userRole: '',
    userActive: '',
    userVerified: '',
  },
  demoResult: null,
}

function currentUser() {
  return store.users.find((u) => u.id === state.currentUserId) ?? store.users[0]
}

function uuid() {
  return crypto.randomUUID
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
      })
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function roleLabel(role) {
  if (role === 'admin') return 'Administrateur'
  if (role === 'teacher') return 'Formateur'
  return 'Apprenant'
}

function showToast(message, tone = 'info') {
  const region = document.getElementById('toast-region')
  if (!region) return
  const el = document.createElement('div')
  el.className = 'toast'
  const label = tone === 'error' ? 'Erreur' : tone === 'success' ? 'Confirmé' : 'Info'
  el.innerHTML = `
    <div>
      <strong class="status-text ${tone === 'error' ? 'is-danger' : tone === 'success' ? 'is-success' : ''}">${label}</strong>
      <div>${escapeHtml(message)}</div>
    </div>
    <button type="button" class="btn btn-ghost btn-sm" aria-label="Fermer">×</button>
  `
  el.querySelector('button').addEventListener('click', () => el.remove())
  region.appendChild(el)
  setTimeout(() => el.remove(), 4200)
}

function visibleCoursesForRole(user) {
  if (user.role === 'admin') return store.courses
  if (user.role === 'teacher') {
    return store.courses.filter((c) => c.status === 'published' || c.userId === user.id)
  }
  return store.courses.filter((c) => c.status === 'published')
}

function courseModules(courseId) {
  return store.modules.filter((m) => m.courseId === courseId)
}

function moduleLessons(moduleId) {
  return store.lessons.filter((l) => l.moduleId === moduleId)
}

function courseLessons(courseId) {
  const modIds = new Set(courseModules(courseId).map((m) => m.id))
  return store.lessons.filter((l) => modIds.has(l.moduleId))
}

function enrollmentFor(userId, courseId) {
  return store.enrollments.find((e) => e.userId === userId && e.courseId === courseId) ?? null
}

function computeCourseProgress(enrollment, courseId) {
  if (!enrollment) return 0
  const lessons = courseLessons(courseId)
  if (!lessons.length) return 0
  const total = lessons.reduce((acc, l) => acc + (enrollment.lessonProgress[l.id] ?? 0), 0)
  return Math.round(total / lessons.length)
}

/* ==========================================================================
   Thème Clair / Sombre & Navigation
   ========================================================================== */

function syncThemeUi() {
  const isDark = document.documentElement.classList.contains('dark')
  const label = document.getElementById('theme-toggle-label')
  if (label) label.textContent = isDark ? 'Mode clair' : 'Mode sombre'
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark')
  try {
    localStorage.setItem('cours-alygne-theme', isDark ? 'dark' : 'light')
  } catch (_e) {}
  syncThemeUi()
}

function pageHref(route, params = {}) {
  const map = {
    catalogue: 'index.html',
    'course-detail': `cours.html${params.courseId ? `?id=${encodeURIComponent(params.courseId)}` : ''}`,
    'mes-cours': 'mes-cours.html',
    connexion: 'connexion.html',
    inscription: 'inscription.html',
    'verification-email': 'verification-email.html',
    'mot-de-passe-oublie': 'mot-de-passe-oublie.html',
    profil: 'profil.html',
    studio: 'studio.html',
    admin: 'admin.html',
  }
  return map[route] || 'index.html'
}

function syncWorkspaceChrome() {
  const user = currentUser()
  const sessionLabel = document.getElementById('workspace-session-label')
  if (sessionLabel) {
    sessionLabel.textContent = `${user.name} · ${user.email_verified ? 'Email vérifié' : 'Email non vérifié'}`
  }

  document.querySelectorAll('[data-role-switch]').forEach((btn) => {
    btn.classList.toggle('is-active', btn.getAttribute('data-role-switch') === user.role)
  })

  document.querySelectorAll('[data-nav]').forEach((link) => {
    const target = link.getAttribute('data-nav')
    const active =
      target === state.route || (state.route === 'course-detail' && target === 'catalogue')
    link.classList.toggle('is-active', active)
  })

  const cta = document.getElementById('header-auth-cta')
  const isAuthPage = [
    'connexion',
    'inscription',
    'verification-email',
    'mot-de-passe-oublie',
  ].includes(state.route)
  if (cta) {
    cta.textContent = isAuthPage ? 'Catalogue' : 'Connexion'
    cta.setAttribute('href', isAuthPage ? 'index.html' : 'connexion.html')
  }
}

function navigate(route, params = {}) {
  persistState()
  window.location.href = pageHref(route, params)
}

/* ==========================================================================
   Vues
   ========================================================================== */

function renderCatalogueView() {
  const user = currentUser()
  const allVisible = visibleCoursesForRole(user)
  const search = state.filters.search.trim().toLowerCase()

  const filtered = allVisible.filter((course) => {
    const matchStatus = state.filters.status === 'all' || course.status === state.filters.status
    const matchSearch =
      !search ||
      course.titre.toLowerCase().includes(search) ||
      course.description.toLowerCase().includes(search) ||
      course.category.toLowerCase().includes(search)
    return matchStatus && matchSearch
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / state.filters.perPage))
  if (state.filters.page > totalPages) state.filters.page = totalPages
  const offset = (state.filters.page - 1) * state.filters.perPage
  const pageItems = filtered.slice(offset, offset + state.filters.perPage)

  const totalLessonsCount = store.lessons.length
  const totalModulesCount = store.modules.length

  return `
    <section class="hero-split" aria-labelledby="hero-heading">
      <div class="hero-copy">
        <span class="hero-kicker">Studio d’apprentissage Cours-Alygne</span>
        <h1 class="hero-title" id="hero-heading">
          Apprenez l’ingénierie web et la sécurité dans un cadre structuré.
        </h1>
        <p class="lead-text">
          Explorez notre catalogue de formations modulaires, suivez votre progression leçon par leçon et gérez vos parcours avec des comptes sécurisés.
        </p>
        <div class="hero-actions">
          <a href="#catalogue-grid" class="btn btn-primary" data-scroll-catalog>Explorer le catalogue</a>
          <a href="inscription.html" class="btn btn-secondary">Créer un compte apprenant</a>
        </div>
      </div>

      <div class="hero-media">
        <img
          src="assets/images/hero-studio.jpg"
          alt="Espace de travail architectural chaleureux du studio Cours-Alygne"
          referrerpolicy="no-referrer"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <div class="media-fallback" style="display:none;">
          <span>Studio Cours-Alygne</span>
        </div>
        <div class="hero-media-scrim">
          <p class="hero-caption">
            Parcours pratiques conçus avec Node.js, TypeScript, architecture modulaire et suivi précis des acquis.
          </p>
        </div>
      </div>
    </section>

    <section class="kpi-strip" aria-label="Indicateurs de la plateforme">
      <div class="kpi-item">
        <div class="kpi-value">${allVisible.length}</div>
        <div class="kpi-label">Cours accessibles (${roleLabel(user.role)})</div>
      </div>
      <div class="kpi-item">
        <div class="kpi-value">${totalModulesCount}</div>
        <div class="kpi-label">Modules structurés</div>
      </div>
      <div class="kpi-item">
        <div class="kpi-value">${totalLessonsCount}</div>
        <div class="kpi-label">Leçons détaillées</div>
      </div>
      <div class="kpi-item">
        <div class="kpi-value">44</div>
        <div class="kpi-label">Routes API couvertes</div>
      </div>
    </section>

    <section id="catalogue-grid" aria-labelledby="catalog-heading">
      <div class="section-header">
        <div>
          <h2 class="section-title" id="catalog-heading">Catalogue des formations</h2>
          <p class="muted-text">
            Endpoint associé : <span class="mono-num">GET /api/courses?page=${state.filters.page}&amp;per_page=${state.filters.perPage}</span>
          </p>
        </div>

        <div class="filter-toolbar">
          <div class="search-input-wrap">
            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              class="input"
              id="catalog-search"
              placeholder="Rechercher un cours..."
              value="${escapeHtml(state.filters.search)}"
              aria-label="Rechercher un cours"
            />
          </div>

          <div class="segmented" role="group" aria-label="Filtrer par statut">
            <button type="button" class="segmented-btn ${state.filters.status === 'all' ? 'is-active' : ''}" data-status-filter="all">Tous</button>
            <button type="button" class="segmented-btn ${state.filters.status === 'published' ? 'is-active' : ''}" data-status-filter="published">Publiés</button>
            <button type="button" class="segmented-btn ${state.filters.status === 'draft' ? 'is-active' : ''}" data-status-filter="draft">Brouillons</button>
          </div>
        </div>
      </div>

      ${
        pageItems.length === 0
          ? `<div class="empty-state">
              <h3 class="card-title">Aucun cours ne correspond à votre recherche</h3>
              <p class="muted-text">Ajustez vos mots-clés ou basculez le rôle d’aperçu en Formateur pour voir les brouillons.</p>
              <button type="button" class="btn btn-secondary" id="reset-catalog-filters">Réinitialiser les filtres</button>
            </div>`
          : `<div class="course-grid">
              ${pageItems
                .map((course) => {
                  const mods = courseModules(course.id)
                  const lessons = courseLessons(course.id)
                  const enrolled = enrollmentFor(user.id, course.id)
                  return `
                    <article class="course-card">
                      <div class="media-frame">
                        <img
                          src="${escapeHtml(course.image)}"
                          alt="${escapeHtml(course.titre)}"
                          referrerpolicy="no-referrer"
                          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                        />
                        <div class="media-fallback" style="display:none;">
                          <span>${escapeHtml(course.category)}</span>
                        </div>
                      </div>
                      <div class="course-card-body">
                        <div class="meta-line">
                          <span>${escapeHtml(course.category)}</span>
                          <span aria-hidden="true">·</span>
                          <span class="mono-num">${mods.length} modules</span>
                          <span aria-hidden="true">·</span>
                          <span class="mono-num">${lessons.length} leçons</span>
                          <span aria-hidden="true">·</span>
                          <span class="status-text ${course.status === 'published' ? 'is-success' : 'is-warning'}">
                            ${course.status === 'published' ? 'Publié' : 'Brouillon'}
                          </span>
                        </div>

                        <h3 class="card-title">${escapeHtml(course.titre)}</h3>
                        <p class="course-card-desc">${escapeHtml(course.description)}</p>

                        <div class="course-card-footer">
                          <div class="author-inline">
                            <img
                              src="assets/images/instructor-portrait.jpg"
                              alt="${escapeHtml(course.authorName)}"
                              class="avatar-sm"
                              referrerpolicy="no-referrer"
                            />
                            <span class="muted-text">${escapeHtml(course.authorName)}</span>
                          </div>
                          <a
                            href="cours.html?id=${encodeURIComponent(course.id)}"
                            class="btn btn-primary btn-sm"
                          >
                            ${enrolled ? 'Continuer' : 'Voir le cours'}
                          </a>
                        </div>
                      </div>
                    </article>
                  `
                })
                .join('')}
            </div>`
      }

      <div class="pagination-bar">
        <span class="muted-text mono-num">
          Page ${state.filters.page} / ${totalPages} · ${filtered.length} résultat(s)
        </span>
        <div class="filter-toolbar">
          <button type="button" class="btn btn-secondary btn-sm" id="page-prev" ${state.filters.page <= 1 ? 'disabled' : ''}>Précédent</button>
          <button type="button" class="btn btn-secondary btn-sm" id="page-next" ${state.filters.page >= totalPages ? 'disabled' : ''}>Suivant</button>
        </div>
      </div>
    </section>
  `
}

function renderCourseDetailView() {
  const user = currentUser()
  const course = store.courses.find((c) => c.id === state.selectedCourseId) ?? store.courses[0]
  const modules = courseModules(course.id)
  if (!modules.some((m) => m.id === state.selectedModuleId) && modules[0]) {
    state.selectedModuleId = modules[0].id
  }
  const lessons = courseLessons(course.id)
  const activeLesson =
    lessons.find((l) => l.id === state.selectedLessonId) ?? lessons[0] ?? null
  const enrollment = enrollmentFor(user.id, course.id)
  const overallProgress = computeCourseProgress(enrollment, course.id)
  const lessonProgress = activeLesson && enrollment ? enrollment.lessonProgress[activeLesson.id] ?? 0 : 0

  return `
    <nav class="breadcrumb" aria-label="Fil d'Ariane">
      <a href="index.html">Catalogue</a>
      <span aria-hidden="true">/</span>
      <span>${escapeHtml(course.category)}</span>
      <span aria-hidden="true">/</span>
      <span>${escapeHtml(course.titre)}</span>
    </nav>

    <section class="course-detail-header">
      <div class="stack-md">
        <div class="meta-line">
          <span>${escapeHtml(course.category)}</span>
          <span aria-hidden="true">·</span>
          <span class="mono-num">${escapeHtml(course.duration)}</span>
          <span aria-hidden="true">·</span>
          <span class="status-text ${course.status === 'published' ? 'is-success' : 'is-warning'}">
            ${course.status === 'published' ? 'Cours publié' : 'Brouillon'}
          </span>
        </div>

        <h1 class="section-title">${escapeHtml(course.titre)}</h1>
        <p class="lead-text">${escapeHtml(course.description)}</p>

        <div class="author-inline">
          <img src="assets/images/instructor-portrait.jpg" alt="${escapeHtml(course.authorName)}" class="avatar-lg" referrerpolicy="no-referrer" />
          <div>
            <div><strong>${escapeHtml(course.authorName)}</strong></div>
            <div class="muted-text">Créé le ${formatDate(course.createdAt)} · <span class="mono-num">GET /api/courses/${course.id.slice(0, 8)}…</span></div>
          </div>
        </div>

        ${
          enrollment
            ? `<div class="stack-md">
                <div class="meta-line">
                  <span>Progression globale</span>
                  <span aria-hidden="true">·</span>
                  <strong class="mono-num">${overallProgress}%</strong>
                </div>
                <div class="progress-track" aria-label="Progression du cours">
                  <div class="progress-fill" style="width:${overallProgress}%"></div>
                </div>
              </div>`
            : `<div class="hero-actions">
                <button type="button" class="btn btn-primary" id="enroll-course-btn" data-course-id="${escapeHtml(course.id)}">
                  S’inscrire à ce cours
                </button>
                <span class="muted-text mono-num">POST /api/courses/:courseId/enroll</span>
              </div>`
        }
      </div>

      <div class="course-detail-media">
        <img src="${escapeHtml(course.image)}" alt="${escapeHtml(course.titre)}" referrerpolicy="no-referrer" />
      </div>
    </section>

    <section class="learning-split">
      <article class="surface-panel">
        ${
          activeLesson
            ? `<div class="meta-line">
                <span>Lecteur de leçon</span>
                <span aria-hidden="true">·</span>
                <span class="mono-num">${escapeHtml(activeLesson.duration)}</span>
              </div>
              <h2 class="section-title" style="margin-top:0.5rem;">${escapeHtml(activeLesson.titre)}</h2>
              <div class="lesson-prose">
                ${activeLesson.contenu
                  .split('\n\n')
                  .map((p) => `<p>${escapeHtml(p)}</p>`)
                  .join('')}
              </div>

              ${
                enrollment
                  ? `<div class="notice-box" style="margin-top:1.75rem;">
                      <div style="flex:1; min-width:220px;">
                        <label for="lesson-progress-range" class="field-label">
                          Avancement de cette leçon : <span class="mono-num" id="lesson-progress-val">${lessonProgress}%</span>
                        </label>
                        <input
                          id="lesson-progress-range"
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value="${lessonProgress}"
                          class="range-input"
                          data-enrollment-id="${escapeHtml(enrollment.id)}"
                          data-lesson-id="${escapeHtml(activeLesson.id)}"
                        />
                        <div class="field-hint mono-num">PUT /api/enrollments/:enrollmentId/lessons/:lessonId/progress</div>
                      </div>
                      <button
                        type="button"
                        class="btn btn-primary btn-sm"
                        id="mark-lesson-done"
                        data-enrollment-id="${escapeHtml(enrollment.id)}"
                        data-lesson-id="${escapeHtml(activeLesson.id)}"
                      >
                        Marquer à 100%
                      </button>
                    </div>`
                  : `<div class="notice-box" style="margin-top:1.75rem;">
                      <span>Inscrivez-vous au cours pour enregistrer votre progression sur cette leçon.</span>
                      <button type="button" class="btn btn-secondary btn-sm" id="enroll-course-inline" data-course-id="${escapeHtml(course.id)}">M’inscrire</button>
                    </div>`
              }`
            : `<div class="empty-state">
                <h3 class="card-title">Aucune leçon disponible dans ce cours</h3>
                <p class="muted-text">Ajoutez un module et des leçons depuis le Studio formateur.</p>
              </div>`
        }
      </article>

      <aside class="module-list" aria-label="Programme du cours">
        ${
          modules.length === 0
            ? `<div class="surface-panel"><p class="muted-text">Aucun module créé pour ce cours.</p></div>`
            : modules
                .map((mod) => {
                  const modLessons = moduleLessons(mod.id)
                  return `
                    <div class="module-block">
                      <div class="module-header">
                        <div>
                          <h3 class="card-title" style="font-size:1rem;">${escapeHtml(mod.titre)}</h3>
                          <p class="muted-text" style="margin:0.25rem 0 0;">${escapeHtml(mod.description)}</p>
                        </div>
                        <span class="mono-num muted-text">${modLessons.length}</span>
                      </div>
                      <div>
                        ${
                          modLessons.length === 0
                            ? `<div style="padding:0.85rem 1.25rem;" class="muted-text">Aucune leçon dans ce module.</div>`
                            : modLessons
                                .map((lesson) => {
                                  const prog = enrollment ? enrollment.lessonProgress[lesson.id] ?? 0 : 0
                                  const active = activeLesson && activeLesson.id === lesson.id
                                  return `
                                    <button
                                      type="button"
                                      class="lesson-row ${active ? 'is-active' : ''}"
                                      data-select-lesson="${escapeHtml(lesson.id)}"
                                      data-select-module="${escapeHtml(mod.id)}"
                                    >
                                      <div>
                                        <div class="lesson-row-title">${escapeHtml(lesson.titre)}</div>
                                        <div class="muted-text mono-num">${escapeHtml(lesson.duration)}</div>
                                      </div>
                                      <span class="mono-num muted-text">${enrollment ? `${prog}%` : 'Ouvrir'}</span>
                                    </button>
                                  `
                                })
                                .join('')
                        }
                      </div>
                    </div>
                  `
                })
                .join('')
        }
      </aside>
    </section>
  `
}

function renderMyEnrollmentsView() {
  const user = currentUser()
  const myEnrollments = store.enrollments.filter((e) => e.userId === user.id)

  return `
    <section class="stack-lg">
      <div class="section-header">
        <div>
          <h1 class="section-title">Mes inscriptions et progressions</h1>
          <p class="muted-text">Endpoint associé : <span class="mono-num">GET /api/enrollments/me</span> (rôle learner)</p>
        </div>
        <a href="index.html" class="btn btn-secondary">Parcourir le catalogue</a>
      </div>

      ${
        myEnrollments.length === 0
          ? `<div class="empty-state">
              <h2 class="card-title">Vous n’êtes inscrit à aucun cours</h2>
              <p class="muted-text">Sélectionnez une formation dans le catalogue pour démarrer votre apprentissage.</p>
              <a href="index.html" class="btn btn-primary">Découvrir les cours</a>
            </div>`
          : `<div class="course-grid">
              ${myEnrollments
                .map((enrollment) => {
                  const course = store.courses.find((c) => c.id === enrollment.courseId)
                  if (!course) return ''
                  const pct = computeCourseProgress(enrollment, course.id)
                  return `
                    <article class="course-card">
                      <div class="media-frame">
                        <img src="${escapeHtml(course.image)}" alt="${escapeHtml(course.titre)}" referrerpolicy="no-referrer" />
                      </div>
                      <div class="course-card-body">
                        <div class="meta-line">
                          <span>Inscrit le ${formatDate(enrollment.enrolledAt)}</span>
                          <span aria-hidden="true">·</span>
                          <strong class="mono-num">${pct}% terminé</strong>
                        </div>
                        <h3 class="card-title">${escapeHtml(course.titre)}</h3>
                        <div class="progress-track">
                          <div class="progress-fill" style="width:${pct}%"></div>
                        </div>
                        <div class="course-card-footer">
                          <span class="muted-text mono-num">ID ${enrollment.id.slice(0, 8)}</span>
                          <a href="cours.html?id=${encodeURIComponent(course.id)}" class="btn btn-primary btn-sm">
                            Reprendre
                          </a>
                        </div>
                      </div>
                    </article>
                  `
                })
                .join('')}
            </div>`
      }
    </section>
  `
}

function renderAuthView(pageMode = 'login') {
  const activeTab = pageMode === 'forgot-or-reset' ? state.authTab : pageMode
  const navPages = [
    { id: 'login', label: 'Connexion', href: 'connexion.html' },
    { id: 'register', label: 'Inscription', href: 'inscription.html' },
    { id: 'verify', label: 'Vérifier e-mail', href: 'verification-email.html' },
    { id: 'forgot', label: 'Mot de passe oublié', href: 'mot-de-passe-oublie.html' },
  ]

  let formMarkup = ''

  if (activeTab === 'login') {
    formMarkup = `
      <form class="form-grid" id="form-login">
        <div class="field">
          <label class="field-label" for="login-email">Adresse e-mail</label>
          <input class="input" id="login-email" name="email" type="email" required placeholder="awa.ndiaye@cours-alygne.edu" />
        </div>
        <div class="field">
          <label class="field-label" for="login-password">Mot de passe</label>
          <input class="input" id="login-password" name="password" type="password" required minlength="8" placeholder="••••••••••••" />
        </div>
        <button type="submit" class="btn btn-primary">Se connecter</button>
        <div class="meta-line">
          <a href="mot-de-passe-oublie.html">Mot de passe oublié ?</a>
          <span aria-hidden="true">·</span>
          <a href="inscription.html">Créer un compte</a>
        </div>
        <p class="field-hint mono-num">POST /api/auth/login · + rotation POST /api/auth/refresh</p>
      </form>
    `
  } else if (activeTab === 'register') {
    formMarkup = `
      <form class="form-grid" id="form-register">
        <div class="field">
          <label class="field-label" for="reg-name">Nom complet</label>
          <input class="input" id="reg-name" name="name" type="text" required minlength="2" placeholder="Awa Ndiaye" />
        </div>
        <div class="field">
          <label class="field-label" for="reg-email">Adresse e-mail</label>
          <input class="input" id="reg-email" name="email" type="email" required placeholder="awa@example.com" />
        </div>
        <div class="form-grid-2">
          <div class="field">
            <label class="field-label" for="reg-password">Mot de passe</label>
            <input class="input" id="reg-password" name="password" type="password" required minlength="8" placeholder="Min. 8 caractères" />
          </div>
          <div class="field">
            <label class="field-label" for="reg-confirm">Confirmation</label>
            <input class="input" id="reg-confirm" name="password_confirmation" type="password" required minlength="8" placeholder="Répéter le mot de passe" />
          </div>
        </div>
        <button type="submit" class="btn btn-primary">Créer mon compte apprenant</button>
        <div class="meta-line">
          <span>Déjà inscrit ?</span>
          <a href="connexion.html">Se connecter</a>
        </div>
        <p class="field-hint mono-num">POST /api/auth/register · Attribue automatiquement le rôle learner</p>
      </form>
    `
  } else if (activeTab === 'verify') {
    formMarkup = `
      <form class="form-grid" id="form-verify-email">
        <div class="field">
          <label class="field-label" for="verify-token">Jeton de vérification à usage unique</label>
          <input class="input mono-num" id="verify-token" name="token" type="text" required placeholder="Collez le token reçu par e-mail" />
        </div>
        <button type="submit" class="btn btn-primary">Vérifier mon adresse e-mail</button>
        <p class="field-hint mono-num">POST /api/auth/email/verify</p>
      </form>
    `
  } else {
    formMarkup = `
      <div class="stack-md">
        <div class="segmented" role="group" aria-label="Étape de récupération">
          <button type="button" class="segmented-btn ${activeTab === 'forgot' ? 'is-active' : ''}" data-auth-tab="forgot">1. Demander un lien</button>
          <button type="button" class="segmented-btn ${activeTab === 'reset' ? 'is-active' : ''}" data-auth-tab="reset">2. Réinitialiser</button>
        </div>
        ${
          activeTab === 'forgot'
            ? `<form class="form-grid" id="form-forgot-password">
                <div class="field">
                  <label class="field-label" for="forgot-email">Adresse e-mail du compte</label>
                  <input class="input" id="forgot-email" name="email" type="email" required placeholder="awa@example.com" />
                </div>
                <button type="submit" class="btn btn-primary">Envoyer le lien de réinitialisation</button>
                <p class="field-hint mono-num">POST /api/auth/forgot-password · Réponse neutre anti-énumération (202)</p>
              </form>`
            : `<form class="form-grid" id="form-reset-password">
                <div class="field">
                  <label class="field-label" for="reset-token">Jeton de réinitialisation</label>
                  <input class="input mono-num" id="reset-token" name="token" type="text" required placeholder="Jeton unique" />
                </div>
                <div class="form-grid-2">
                  <div class="field">
                    <label class="field-label" for="reset-password">Nouveau mot de passe</label>
                    <input class="input" id="reset-password" name="password" type="password" required minlength="8" />
                  </div>
                  <div class="field">
                    <label class="field-label" for="reset-confirm">Confirmation</label>
                    <input class="input" id="reset-confirm" name="password_confirmation" type="password" required minlength="8" />
                  </div>
                </div>
                <button type="submit" class="btn btn-primary">Réinitialiser le mot de passe</button>
                <p class="field-hint mono-num">POST /api/auth/reset-password</p>
              </form>`
        }
      </div>
    `
  }

  return `
    <section class="auth-layout" aria-labelledby="auth-heading">
      <div class="auth-visual">
        <img src="assets/images/hero-studio.jpg" alt="Studio d'apprentissage Cours-Alygne" referrerpolicy="no-referrer" />
        <div class="auth-visual-overlay">
          <span class="hero-kicker" style="color:#fbbf24;">Authentification &amp; Sécurité JWT</span>
          <h1 class="section-title" id="auth-heading" style="color:#f5f4f1;">
            Accès sécurisé, sessions contrôlées et vérification d’identité.
          </h1>
          <p style="margin:0; color:#d6d3cd; max-width:44ch;">
            Chaque parcours d’inscription, connexion, vérification d’adresse et réinitialisation de mot de passe correspond directement aux routes du backend.
          </p>
        </div>
      </div>

      <div class="auth-panel">
        <nav class="tabs-bar" aria-label="Parcours d'authentification">
          ${navPages
            .map(
              (tab) => `
                <a
                  href="${tab.href}"
                  class="tab-btn ${activeTab === tab.id || (pageMode === 'forgot-or-reset' && tab.id === 'forgot') ? 'is-active' : ''}"
                >
                  ${tab.label}
                </a>
              `,
            )
            .join('')}
        </nav>

        ${formMarkup}
      </div>
    </section>
  `
}

function renderProfileView() {
  const user = currentUser()

  return `
    <section class="stack-lg">
      <div class="section-header">
        <div class="author-inline" style="gap:1rem;">
          <img src="${escapeHtml(user.avatar)}" alt="${escapeHtml(user.name)}" class="avatar-lg" referrerpolicy="no-referrer" />
          <div>
            <h1 class="section-title">${escapeHtml(user.name)}</h1>
            <div class="meta-line">
              <span>${escapeHtml(user.email)}</span>
              <span aria-hidden="true">·</span>
              <span>${roleLabel(user.role)}</span>
              <span aria-hidden="true">·</span>
              <span class="status-text ${user.email_verified ? 'is-success' : 'is-warning'}">
                ${user.email_verified ? 'E-mail vérifié' : 'E-mail non vérifié'}
              </span>
            </div>
          </div>
        </div>
        <button type="button" class="btn btn-secondary" id="btn-logout-current">Se déconnecter (session courante)</button>
      </div>

      ${
        !user.email_verified
          ? `<div class="notice-box">
              <div>
                <strong>Adresse e-mail en attente de vérification</strong>
                <div class="muted-text">Certaines routes protégées exigent une adresse vérifiée.</div>
              </div>
              <button type="button" class="btn btn-primary btn-sm" id="btn-resend-verif">Renvoyer le lien</button>
            </div>`
          : ''
      }

      <div class="two-col-panels">
        <form class="surface-panel form-grid" id="form-update-profile">
          <h2 class="card-title">Informations du profil</h2>
          <div class="field">
            <label class="field-label" for="profile-name">Nom affiché</label>
            <input class="input" id="profile-name" name="name" type="text" required value="${escapeHtml(user.name)}" />
          </div>
          <button type="submit" class="btn btn-primary">Enregistrer le nom</button>
          <span class="field-hint mono-num">GET /api/auth/me · PATCH /api/auth/profile</span>
        </form>

        <form class="surface-panel form-grid" id="form-change-email">
          <h2 class="card-title">Changer d’adresse e-mail</h2>
          <div class="field">
            <label class="field-label" for="new-email">Nouvelle adresse e-mail</label>
            <input class="input" id="new-email" name="email" type="email" required placeholder="nouvelle@adresse.edu" />
          </div>
          <div class="field">
            <label class="field-label" for="email-current-pwd">Mot de passe actuel</label>
            <input class="input" id="email-current-pwd" name="current_password" type="password" required />
          </div>
          <button type="submit" class="btn btn-secondary">Mettre à jour l’e-mail</button>
          <span class="field-hint mono-num">POST /api/auth/email/change</span>
        </form>

        <form class="surface-panel form-grid" id="form-change-password">
          <h2 class="card-title">Modifier le mot de passe</h2>
          <div class="field">
            <label class="field-label" for="pwd-current">Mot de passe actuel</label>
            <input class="input" id="pwd-current" name="current_password" type="password" required />
          </div>
          <div class="form-grid-2">
            <div class="field">
              <label class="field-label" for="pwd-next">Nouveau mot de passe</label>
              <input class="input" id="pwd-next" name="password" type="password" required minlength="8" />
            </div>
            <div class="field">
              <label class="field-label" for="pwd-confirm">Confirmation</label>
              <input class="input" id="pwd-confirm" name="password_confirmation" type="password" required minlength="8" />
            </div>
          </div>
          <button type="submit" class="btn btn-secondary">Changer le mot de passe</button>
          <span class="field-hint mono-num">PATCH /api/auth/password · Révoque toutes les sessions</span>
        </form>

        <form class="surface-panel form-grid" id="form-deactivate-account">
          <h2 class="card-title">Désactiver le compte</h2>
          <p class="muted-text" style="margin:0;">
            Action réservée aux comptes non administrateurs. Saisissez <strong>DESACTIVER</strong> pour confirmer.
          </p>
          <div class="field">
            <label class="field-label" for="deact-pwd">Mot de passe actuel</label>
            <input class="input" id="deact-pwd" name="current_password" type="password" required />
          </div>
          <div class="field">
            <label class="field-label" for="deact-confirm">Confirmation</label>
            <input class="input mono-num" id="deact-confirm" name="confirmation" type="text" required placeholder="DESACTIVER" />
          </div>
          <button type="submit" class="btn btn-danger" ${user.role === 'admin' ? 'disabled' : ''}>
            Désactiver mon compte
          </button>
          <span class="field-hint mono-num">DELETE /api/auth/account</span>
        </form>
      </div>

      <section class="stack-md">
        <div class="section-header">
          <div>
            <h2 class="section-title">Sessions actives et appareils</h2>
            <p class="muted-text">Endpoints : <span class="mono-num">GET /api/auth/sessions</span> · <span class="mono-num">POST /api/auth/logout-all</span></p>
          </div>
          <button type="button" class="btn btn-danger btn-sm" id="btn-logout-all">Déconnecter tous les appareils</button>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Appareil / Navigateur</th>
                <th>Adresse IP</th>
                <th>Dernière activité</th>
                <th>Expiration</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${
                store.sessions.length === 0
                  ? `<tr><td colspan="5" class="muted-text">Aucune session active.</td></tr>`
                  : store.sessions
                      .map(
                        (s) => `
                          <tr>
                            <td>
                              <div>${escapeHtml(s.user_agent)}</div>
                              ${s.is_current ? `<span class="status-text is-success">Session courante</span>` : ''}
                            </td>
                            <td class="mono-num">${escapeHtml(s.ip_address)}</td>
                            <td class="mono-num">${formatDate(s.last_used_at)}</td>
                            <td class="mono-num">${formatDate(s.expires_at)}</td>
                            <td>
                              <button
                                type="button"
                                class="btn btn-secondary btn-sm"
                                data-revoke-session="${escapeHtml(s.session_id)}"
                              >
                                Révoquer
                              </button>
                            </td>
                          </tr>
                        `,
                      )
                      .join('')
              }
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `
}

function renderStudioView() {
  const user = currentUser()
  const canAuthor = user.role === 'teacher' || user.role === 'admin'
  const selectedCourse =
    store.courses.find((c) => c.id === state.studioCourseId) ?? store.courses[0]
  const mods = selectedCourse ? courseModules(selectedCourse.id) : []
  const courseEnrollments = selectedCourse
    ? store.enrollments.filter((e) => e.courseId === selectedCourse.id)
    : []

  return `
    <section class="stack-lg">
      <div class="section-header">
        <div>
          <h1 class="section-title">Studio formateur — Cours, Modules &amp; Leçons</h1>
          <p class="muted-text">Création, édition, publication, structuration pédagogique et gestion des inscriptions.</p>
        </div>
      </div>

      ${
        !canAuthor
          ? `<div class="notice-box">
              <div>
                <strong>Accès restreint au rôle Formateur ou Administrateur</strong>
                <div class="muted-text">Vous consultez actuellement en mode Apprenant. Basculez sur « Formateur » dans la barre d’aperçu pour tester les écritures.</div>
              </div>
              <button type="button" class="btn btn-primary btn-sm" data-role-switch="teacher">Passer en Formateur</button>
            </div>`
          : ''
      }

      <div class="two-col-panels">
        <form class="surface-panel form-grid" id="form-create-course">
          <h2 class="card-title">Créer un nouveau cours</h2>
          <div class="field">
            <label class="field-label" for="course-title-input">Titre du cours</label>
            <input class="input" id="course-title-input" name="titre" type="text" required maxlength="120" placeholder="Ex : Tests d'intégration avec Vitest" />
          </div>
          <div class="field">
            <label class="field-label" for="course-desc-input">Description</label>
            <textarea class="textarea" id="course-desc-input" name="description" required maxlength="1000" placeholder="Objectifs pédagogiques et prérequis..."></textarea>
          </div>
          <button type="submit" class="btn btn-primary" ${canAuthor ? '' : 'disabled'}>Créer le brouillon</button>
          <span class="field-hint mono-num">POST /api/courses</span>
        </form>

        <div class="surface-panel stack-md">
          <h2 class="card-title">Piloter un cours existant</h2>
          <div class="field">
            <label class="field-label" for="studio-course-select">Cours sélectionné</label>
            <select class="select" id="studio-course-select">
              ${store.courses
                .map(
                  (c) => `<option value="${escapeHtml(c.id)}" ${selectedCourse?.id === c.id ? 'selected' : ''}>${escapeHtml(c.titre)} (${c.status})</option>`,
                )
                .join('')}
            </select>
          </div>

          ${
            selectedCourse
              ? `<form class="form-grid" id="form-edit-course">
                  <div class="field">
                    <label class="field-label" for="edit-course-title">Modifier le titre</label>
                    <input class="input" id="edit-course-title" name="titre" type="text" value="${escapeHtml(selectedCourse.titre)}" />
                  </div>
                  <div class="field">
                    <label class="field-label" for="edit-course-desc">Modifier la description</label>
                    <textarea class="textarea" id="edit-course-desc" name="description">${escapeHtml(selectedCourse.description)}</textarea>
                  </div>
                  <div class="filter-toolbar">
                    <button type="submit" class="btn btn-secondary btn-sm" ${canAuthor ? '' : 'disabled'}>Mettre à jour</button>
                    <button type="button" class="btn btn-primary btn-sm" id="btn-publish-course" ${canAuthor && selectedCourse.status !== 'published' ? '' : 'disabled'}>
                      ${selectedCourse.status === 'published' ? 'Déjà publié' : 'Publier le cours'}
                    </button>
                    <button type="button" class="btn btn-danger btn-sm" id="btn-delete-course" ${canAuthor ? '' : 'disabled'}>Supprimer</button>
                  </div>
                  <span class="field-hint mono-num">PATCH /api/courses/:id · PATCH /publish · DELETE /api/courses/:id</span>
                </form>`
              : ''
          }
        </div>
      </div>

      ${
        selectedCourse
          ? `<div class="two-col-panels">
              <form class="surface-panel form-grid" id="form-create-module">
                <h2 class="card-title">Ajouter un module</h2>
                <div class="field">
                  <label class="field-label" for="mod-title">Titre du module</label>
                  <input class="input" id="mod-title" name="titre" type="text" required maxlength="120" placeholder="Module 03 · Déploiement" />
                </div>
                <div class="field">
                  <label class="field-label" for="mod-desc">Description</label>
                  <textarea class="textarea" id="mod-desc" name="description" required maxlength="1000"></textarea>
                </div>
                <button type="submit" class="btn btn-secondary" ${canAuthor ? '' : 'disabled'}>Ajouter le module</button>
                <span class="field-hint mono-num">POST /api/courses/:id/modules</span>
              </form>

              <form class="surface-panel form-grid" id="form-create-lesson">
                <h2 class="card-title">Ajouter une leçon</h2>
                <div class="field">
                  <label class="field-label" for="lesson-mod-select">Module cible</label>
                  <select class="select" id="lesson-mod-select" name="moduleId" required>
                    ${
                      mods.length === 0
                        ? `<option value="">Créez d'abord un module</option>`
                        : mods
                            .map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.titre)}</option>`)
                            .join('')
                    }
                  </select>
                </div>
                <div class="field">
                  <label class="field-label" for="lesson-title">Titre de la leçon</label>
                  <input class="input" id="lesson-title" name="titre" type="text" required maxlength="120" />
                </div>
                <div class="field">
                  <label class="field-label" for="lesson-content">Contenu pédagogique</label>
                  <textarea class="textarea" id="lesson-content" name="contenu" required></textarea>
                </div>
                <button type="submit" class="btn btn-secondary" ${canAuthor && mods.length > 0 ? '' : 'disabled'}>Ajouter la leçon</button>
                <span class="field-hint mono-num">POST /api/courses/modules/:moduleId/lessons</span>
              </form>
            </div>

            <section class="surface-panel stack-md">
              <div class="section-header" style="margin-bottom:0;">
                <div>
                  <h2 class="card-title">Inscriptions au cours (${courseEnrollments.length})</h2>
                  <p class="muted-text mono-num">GET /api/courses/:courseId/enrollments · POST /api/courses/:courseId/enrollments</p>
                </div>
                <form class="filter-toolbar" id="form-manual-enroll">
                  <select class="select" name="userId" style="width:auto; min-width:220px;" aria-label="Choisir un apprenant">
                    ${store.users
                      .filter((u) => u.role === 'learner')
                      .map((u) => `<option value="${escapeHtml(u.id)}">${escapeHtml(u.name)} (${escapeHtml(u.email)})</option>`)
                      .join('')}
                  </select>
                  <button type="submit" class="btn btn-primary btn-sm" ${canAuthor ? '' : 'disabled'}>Inscrire l’apprenant</button>
                </form>
              </div>
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Apprenant</th>
                      <th>E-mail</th>
                      <th>Date d’inscription</th>
                      <th>Progression</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      courseEnrollments.length === 0
                        ? `<tr><td colspan="4" class="muted-text">Aucun apprenant inscrit à ce cours.</td></tr>`
                        : courseEnrollments
                            .map((enr) => {
                              const learner = store.users.find((u) => u.id === enr.userId)
                              return `
                                <tr>
                                  <td>${escapeHtml(learner?.name ?? enr.userId)}</td>
                                  <td>${escapeHtml(learner?.email ?? '—')}</td>
                                  <td class="mono-num">${formatDate(enr.enrolledAt)}</td>
                                  <td class="mono-num">${computeCourseProgress(enr, selectedCourse.id)}%</td>
                                </tr>
                              `
                            })
                            .join('')
                    }
                  </tbody>
                </table>
              </div>
            </section>`
          : ''
      }
    </section>
  `
}

function renderAdminView() {
  const user = currentUser()
  const isAdmin = user.role === 'admin'
  const uSearch = state.filters.userSearch.trim().toLowerCase()

  const filteredUsers = store.users.filter((u) => {
    const matchSearch =
      !uSearch || u.name.toLowerCase().includes(uSearch) || u.email.toLowerCase().includes(uSearch)
    const matchRole = !state.filters.userRole || u.role === state.filters.userRole
    const matchActive =
      !state.filters.userActive || String(u.is_active) === state.filters.userActive
    const matchVerified =
      !state.filters.userVerified || String(u.email_verified) === state.filters.userVerified
    return matchSearch && matchRole && matchActive && matchVerified
  })

  const inspected =
    store.users.find((u) => u.id === state.adminSelectedUserId) ?? store.users[0]
  const events = store.securityEvents.filter((ev) => ev.userId === inspected.id)

  return `
    <section class="stack-lg">
      <div class="section-header">
        <div>
          <h1 class="section-title">Administration, Audit &amp; Routes RBAC</h1>
          <p class="muted-text">Gestion des comptes (<span class="mono-num">/api/users/*</span>), sécurité et tests des middlewares (<span class="mono-num">/api/demo/*</span>).</p>
        </div>
      </div>

      ${
        !isAdmin
          ? `<div class="notice-box">
              <div>
                <strong>Console réservée aux administrateurs</strong>
                <div class="muted-text">Basculez sur le rôle « Admin » dans la barre d’aperçu pour activer les actions d’administration.</div>
              </div>
              <button type="button" class="btn btn-primary btn-sm" data-role-switch="admin">Passer en Admin</button>
            </div>`
          : ''
      }

      <div class="two-col-panels">
        <div class="surface-panel stack-md">
          <div class="section-header" style="margin-bottom:0;">
            <h2 class="card-title">Annuaire des utilisateurs (${filteredUsers.length})</h2>
          </div>

          <div class="filter-toolbar">
            <input
              type="search"
              class="input"
              id="admin-user-search"
              placeholder="Nom ou e-mail..."
              value="${escapeHtml(state.filters.userSearch)}"
              style="flex:1; min-width:160px;"
            />
            <select class="select" id="admin-role-filter" style="width:auto;">
              <option value="">Tous rôles</option>
              <option value="learner" ${state.filters.userRole === 'learner' ? 'selected' : ''}>Apprenant</option>
              <option value="teacher" ${state.filters.userRole === 'teacher' ? 'selected' : ''}>Formateur</option>
              <option value="admin" ${state.filters.userRole === 'admin' ? 'selected' : ''}>Admin</option>
            </select>
            <select class="select" id="admin-active-filter" style="width:auto;">
              <option value="">Actifs &amp; inactifs</option>
              <option value="true" ${state.filters.userActive === 'true' ? 'selected' : ''}>Actifs</option>
              <option value="false" ${state.filters.userActive === 'false' ? 'selected' : ''}>Désactivés</option>
            </select>
          </div>

          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Statut</th>
                  <th>Inspecter</th>
                </tr>
              </thead>
              <tbody>
                ${filteredUsers
                  .map(
                    (u) => `
                      <tr>
                        <td>
                          <div><strong>${escapeHtml(u.name)}</strong></div>
                          <div class="muted-text">${escapeHtml(u.email)}</div>
                        </td>
                        <td>${roleLabel(u.role)}</td>
                        <td>
                          <span class="status-text ${u.is_active ? 'is-success' : 'is-danger'}">
                            ${u.is_active ? 'Actif' : 'Désactivé'}
                          </span>
                        </td>
                        <td>
                          <button type="button" class="btn btn-secondary btn-sm" data-inspect-user="${escapeHtml(u.id)}">Détails</button>
                        </td>
                      </tr>
                    `,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="stack-md">
          <div class="surface-panel stack-md">
            <h2 class="card-title">Fiche : ${escapeHtml(inspected.name)}</h2>
            <div class="meta-line">
              <span class="mono-num">ID ${inspected.id.slice(0, 13)}…</span>
              <span aria-hidden="true">·</span>
              <span>${inspected.email_verified ? 'E-mail vérifié' : 'Non vérifié'}</span>
            </div>

            <div class="form-grid-2">
              <div class="field">
                <label class="field-label" for="admin-change-role">Rôle attribué</label>
                <select class="select" id="admin-change-role" data-user-id="${escapeHtml(inspected.id)}" ${isAdmin ? '' : 'disabled'}>
                  <option value="learner" ${inspected.role === 'learner' ? 'selected' : ''}>Apprenant (learner)</option>
                  <option value="teacher" ${inspected.role === 'teacher' ? 'selected' : ''}>Formateur (teacher)</option>
                  <option value="admin" ${inspected.role === 'admin' ? 'selected' : ''}>Administrateur (admin)</option>
                </select>
              </div>
              <div class="field">
                <label class="field-label">Actions de sécurité</label>
                <div class="filter-toolbar">
                  <button type="button" class="btn btn-secondary btn-sm" id="btn-toggle-user-active" data-user-id="${escapeHtml(inspected.id)}" ${isAdmin ? '' : 'disabled'}>
                    ${inspected.is_active ? 'Désactiver' : 'Réactiver'}
                  </button>
                  <button type="button" class="btn btn-danger btn-sm" id="btn-admin-revoke" data-user-id="${escapeHtml(inspected.id)}" ${isAdmin ? '' : 'disabled'}>
                    Révoquer sessions
                  </button>
                </div>
              </div>
            </div>

            <div>
              <h3 class="field-label" style="margin-bottom:0.5rem;">Événements d’audit (<span class="mono-num">GET /api/users/:id/security-events</span>)</h3>
              <div class="table-wrap">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Événement</th>
                      <th>Statut</th>
                      <th>IP</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      events.length === 0
                        ? `<tr><td colspan="4" class="muted-text">Aucun événement récent.</td></tr>`
                        : events
                            .map(
                              (ev) => `
                                <tr>
                                  <td class="mono-num">${escapeHtml(ev.event_type)}</td>
                                  <td><span class="status-text ${ev.status === 'success' ? 'is-success' : 'is-danger'}">${escapeHtml(ev.status)}</span></td>
                                  <td class="mono-num">${escapeHtml(ev.ip_address)}</td>
                                  <td class="mono-num">${formatDate(ev.created_at)}</td>
                                </tr>
                              `,
                            )
                            .join('')
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <form class="surface-panel form-grid" id="form-admin-create-user">
            <h2 class="card-title">Créer un utilisateur (<span class="mono-num">POST /api/users</span>)</h2>
            <div class="form-grid-2">
              <div class="field">
                <label class="field-label" for="adm-u-name">Nom</label>
                <input class="input" id="adm-u-name" name="name" type="text" required />
              </div>
              <div class="field">
                <label class="field-label" for="adm-u-email">E-mail</label>
                <input class="input" id="adm-u-email" name="email" type="email" required />
              </div>
              <div class="field">
                <label class="field-label" for="adm-u-pwd">Mot de passe</label>
                <input class="input" id="adm-u-pwd" name="password" type="password" required minlength="8" />
              </div>
              <div class="field">
                <label class="field-label" for="adm-u-role">Rôle</label>
                <select class="select" id="adm-u-role" name="role">
                  <option value="learner">Apprenant</option>
                  <option value="teacher">Formateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
            </div>
            <button type="submit" class="btn btn-primary" ${isAdmin ? '' : 'disabled'}>Créer le compte</button>
          </form>
        </div>
      </div>

      <section class="surface-panel stack-md">
        <div class="section-header" style="margin-bottom:0;">
          <div>
            <h2 class="card-title">Simulateur des routes Santé &amp; Démos RBAC</h2>
            <p class="muted-text">Testez les contrôles d’accès selon l’utilisateur actif (${escapeHtml(user.name)} · ${roleLabel(user.role)}).</p>
          </div>
          <div class="filter-toolbar">
            <button type="button" class="btn btn-secondary btn-sm" data-demo-route="/api/health">GET /health</button>
            <button type="button" class="btn btn-secondary btn-sm" data-demo-route="/api/health/database">GET /health/database</button>
            <button type="button" class="btn btn-secondary btn-sm" data-demo-route="/api/demo/authenticated">GET /demo/authenticated</button>
            <button type="button" class="btn btn-secondary btn-sm" data-demo-route="/api/demo/verified">GET /demo/verified</button>
            <button type="button" class="btn btn-secondary btn-sm" data-demo-route="/api/demo/teaching-team">GET /demo/teaching-team</button>
            <button type="button" class="btn btn-secondary btn-sm" data-demo-route="/api/demo/admin">GET /demo/admin</button>
          </div>
        </div>
        ${
          state.demoResult
            ? `<div class="notice-box">
                <div>
                  <strong class="mono-num">${escapeHtml(state.demoResult.route)} · HTTP ${state.demoResult.status}</strong>
                  <div class="muted-text">${escapeHtml(state.demoResult.message)}</div>
                </div>
                <span class="status-text ${state.demoResult.ok ? 'is-success' : 'is-danger'}">${state.demoResult.ok ? 'Autorisé' : 'Refusé'}</span>
              </div>`
            : ''
        }
      </section>

      <section class="stack-md">
        <h2 class="section-title">Inventaire complet des routes du projet (${API_ROUTES_CATALOG.length})</h2>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Module</th>
                <th>Méthode</th>
                <th>Chemin</th>
                <th>Contrôle d’accès</th>
                <th>Rôle fonctionnel</th>
              </tr>
            </thead>
            <tbody>
              ${API_ROUTES_CATALOG.map(
                (r) => `
                  <tr>
                    <td>${escapeHtml(r.group)}</td>
                    <td class="mono-num"><strong>${escapeHtml(r.method)}</strong></td>
                    <td class="mono-num">${escapeHtml(r.path)}</td>
                    <td class="mono-num">${escapeHtml(r.access)}</td>
                    <td>${escapeHtml(r.summary)}</td>
                  </tr>
                `,
              ).join('')}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `
}

/* ==========================================================================
   Rendu Principal & Attachement des Événements
   ========================================================================== */

function render() {
  persistState()
  syncWorkspaceChrome()
  const root = document.getElementById('app-root')
  if (!root) return

  if (state.route === 'catalogue') root.innerHTML = renderCatalogueView()
  else if (state.route === 'course-detail') root.innerHTML = renderCourseDetailView()
  else if (state.route === 'mes-cours') root.innerHTML = renderMyEnrollmentsView()
  else if (state.route === 'connexion') root.innerHTML = renderAuthView('login')
  else if (state.route === 'inscription') root.innerHTML = renderAuthView('register')
  else if (state.route === 'verification-email') root.innerHTML = renderAuthView('verify')
  else if (state.route === 'mot-de-passe-oublie') root.innerHTML = renderAuthView('forgot-or-reset')
  else if (state.route === 'profil') root.innerHTML = renderProfileView()
  else if (state.route === 'studio') root.innerHTML = renderStudioView()
  else if (state.route === 'admin') root.innerHTML = renderAdminView()
  else root.innerHTML = renderCatalogueView()

  bindViewHandlers(root)
}

function bindViewHandlers(root) {
  root.querySelectorAll('[data-nav]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      navigate(link.getAttribute('data-nav'))
    })
  })

  root.querySelectorAll('[data-scroll-catalog]').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault()
      document.getElementById('catalogue-grid')?.scrollIntoView({ behavior: 'smooth' })
    })
  })

  const searchEl = document.getElementById('catalog-search')
  if (searchEl) {
    searchEl.addEventListener('input', (e) => {
      state.filters.search = e.target.value
      state.filters.page = 1
      render()
      const refocused = document.getElementById('catalog-search')
      if (refocused) {
        refocused.focus()
        refocused.setSelectionRange(refocused.value.length, refocused.value.length)
      }
    })
  }

  document.querySelectorAll('[data-status-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.filters.status = btn.getAttribute('data-status-filter')
      state.filters.page = 1
      render()
    })
  })

  document.getElementById('reset-catalog-filters')?.addEventListener('click', () => {
    state.filters.search = ''
    state.filters.status = 'all'
    state.filters.page = 1
    render()
  })

  document.getElementById('page-prev')?.addEventListener('click', () => {
    if (state.filters.page > 1) {
      state.filters.page -= 1
      render()
    }
  })

  document.getElementById('page-next')?.addEventListener('click', () => {
    state.filters.page += 1
    render()
  })

  document.querySelectorAll('[data-open-course]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const courseId = btn.getAttribute('data-open-course')
      const firstLesson = courseLessons(courseId)[0]
      navigate('course-detail', {
        courseId,
        lessonId: firstLesson?.id ?? '',
      })
    })
  })

  document.querySelectorAll('[data-select-lesson]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.selectedLessonId = btn.getAttribute('data-select-lesson')
      state.selectedModuleId = btn.getAttribute('data-select-module')
      render()
    })
  })

  const handleEnroll = (courseId) => {
    const user = currentUser()
    if (enrollmentFor(user.id, courseId)) {
      showToast('Vous êtes déjà inscrit à ce cours.')
      return
    }
    store.enrollments.push({
      id: uuid(),
      courseId,
      userId: user.id,
      enrolledAt: new Date().toISOString(),
      lessonProgress: {},
    })
    showToast('Inscription enregistrée avec succès.', 'success')
    render()
  }

  document.getElementById('enroll-course-btn')?.addEventListener('click', (e) => {
    handleEnroll(e.currentTarget.getAttribute('data-course-id'))
  })
  document.getElementById('enroll-course-inline')?.addEventListener('click', (e) => {
    handleEnroll(e.currentTarget.getAttribute('data-course-id'))
  })

  const progressRange = document.getElementById('lesson-progress-range')
  if (progressRange) {
    progressRange.addEventListener('input', (e) => {
      const val = Number(e.target.value)
      const valDisplay = document.getElementById('lesson-progress-val')
      if (valDisplay) valDisplay.textContent = `${val}%`
    })
    progressRange.addEventListener('change', (e) => {
      const val = Number(e.target.value)
      const enrId = e.target.getAttribute('data-enrollment-id')
      const lesId = e.target.getAttribute('data-lesson-id')
      const enr = store.enrollments.find((item) => item.id === enrId)
      if (enr && lesId) {
        enr.lessonProgress[lesId] = val
        showToast(`Progression mise à jour à ${val}%.`, 'success')
        render()
      }
    })
  }

  document.getElementById('mark-lesson-done')?.addEventListener('click', (e) => {
    const enrId = e.currentTarget.getAttribute('data-enrollment-id')
    const lesId = e.currentTarget.getAttribute('data-lesson-id')
    const enr = store.enrollments.find((item) => item.id === enrId)
    if (enr && lesId) {
      enr.lessonProgress[lesId] = 100
      showToast('Leçon terminée à 100%.', 'success')
      render()
    }
  })

  // Auth tabs & forms
  document.querySelectorAll('[data-auth-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.authTab = btn.getAttribute('data-auth-tab')
      render()
    })
  })

  document.getElementById('form-login')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const email = String(data.get('email')).trim().toLowerCase()
    const found = store.users.find((u) => u.email.toLowerCase() === email)
    if (found) {
      state.currentUserId = found.id
      showToast(`Connecté en tant que ${found.name}.`, 'success')
      navigate('catalogue')
    } else {
      showToast('Connexion simulée prête pour POST /api/auth/login.', 'success')
      navigate('catalogue')
    }
  })

  document.getElementById('form-register')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const pwd = String(data.get('password'))
    const confirm = String(data.get('password_confirmation'))
    if (pwd !== confirm) {
      showToast('La confirmation du mot de passe ne correspond pas.', 'error')
      return
    }
    const newUser = {
      id: uuid(),
      name: String(data.get('name')).trim(),
      email: String(data.get('email')).trim().toLowerCase(),
      role: 'learner',
      is_active: true,
      email_verified: false,
      email_verified_at: null,
      last_login_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      avatar: 'assets/images/instructor-portrait.jpg',
    }
    store.users.unshift(newUser)
    state.currentUserId = newUser.id
    showToast('Compte apprenant créé. Vérifiez votre messagerie.', 'success')
    navigate('profil')
  })

  document.getElementById('form-verify-email')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const user = currentUser()
    user.email_verified = true
    user.email_verified_at = new Date().toISOString()
    showToast('Adresse e-mail vérifiée avec succès.', 'success')
    navigate('profil')
  })

  document.getElementById('form-forgot-password')?.addEventListener('submit', (e) => {
    e.preventDefault()
    showToast('Si cette adresse existe, un lien de réinitialisation a été envoyé.', 'success')
  })

  document.getElementById('form-reset-password')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (data.get('password') !== data.get('password_confirmation')) {
      showToast('Les mots de passe ne correspondent pas.', 'error')
      return
    }
    showToast('Mot de passe réinitialisé. Vous pouvez vous connecter.', 'success')
    navigate('connexion')
  })

  // Profil & Sessions
  document.getElementById('btn-logout-current')?.addEventListener('click', () => {
    showToast('Session courante révoquée (POST /api/auth/logout).')
    navigate('connexion')
  })

  document.getElementById('btn-resend-verif')?.addEventListener('click', () => {
    showToast('Lien de vérification renvoyé (202 Accepted).', 'success')
  })

  document.getElementById('form-update-profile')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    currentUser().name = String(data.get('name')).trim()
    showToast('Nom du profil mis à jour.', 'success')
    render()
  })

  document.getElementById('form-change-email')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const user = currentUser()
    user.email = String(data.get('email')).trim().toLowerCase()
    user.email_verified = false
    user.email_verified_at = null
    showToast('Adresse modifiée. Vérification requise.', 'success')
    render()
  })

  document.getElementById('form-change-password')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (data.get('password') !== data.get('password_confirmation')) {
      showToast('La confirmation du nouveau mot de passe ne correspond pas.', 'error')
      return
    }
    showToast('Mot de passe modifié et sessions révoquées.', 'success')
    e.currentTarget.reset()
  })

  document.getElementById('form-deactivate-account')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (data.get('confirmation') !== 'DESACTIVER') {
      showToast('Saisissez exactement DESACTIVER pour confirmer.', 'error')
      return
    }
    currentUser().is_active = false
    showToast('Compte désactivé.', 'success')
    render()
  })

  document.querySelectorAll('[data-revoke-session]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const sid = btn.getAttribute('data-revoke-session')
      const idx = store.sessions.findIndex((s) => s.session_id === sid)
      if (idx !== -1) store.sessions.splice(idx, 1)
      showToast('Session révoquée.', 'success')
      render()
    })
  })

  document.getElementById('btn-logout-all')?.addEventListener('click', () => {
    store.sessions.splice(0, store.sessions.length)
    showToast('Toutes les sessions ont été révoquées.', 'success')
    render()
  })

  // Studio formateur
  document.getElementById('studio-course-select')?.addEventListener('change', (e) => {
    state.studioCourseId = e.target.value
    render()
  })

  document.getElementById('form-create-course')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const user = currentUser()
    const created = {
      id: uuid(),
      titre: String(data.get('titre')).trim(),
      description: String(data.get('description')).trim(),
      status: 'draft',
      userId: user.id,
      authorName: user.name,
      image: 'assets/images/course-pedagogy.jpg',
      category: 'Nouveau programme',
      duration: '2h 00m',
      createdAt: new Date().toISOString(),
    }
    store.courses.unshift(created)
    state.studioCourseId = created.id
    showToast('Brouillon de cours créé.', 'success')
    render()
  })

  document.getElementById('form-edit-course')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const c = store.courses.find((item) => item.id === state.studioCourseId)
    if (c) {
      c.titre = String(data.get('titre')).trim()
      c.description = String(data.get('description')).trim()
      showToast('Cours mis à jour.', 'success')
      render()
    }
  })

  document.getElementById('btn-publish-course')?.addEventListener('click', () => {
    const c = store.courses.find((item) => item.id === state.studioCourseId)
    if (c) {
      c.status = 'published'
      showToast('Cours publié dans le catalogue.', 'success')
      render()
    }
  })

  document.getElementById('btn-delete-course')?.addEventListener('click', () => {
    const idx = store.courses.findIndex((item) => item.id === state.studioCourseId)
    if (idx !== -1) {
      store.courses.splice(idx, 1)
      state.studioCourseId = store.courses[0]?.id ?? ''
      showToast('Cours supprimé (soft delete).', 'success')
      render()
    }
  })

  document.getElementById('form-create-module')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    store.modules.push({
      id: uuid(),
      courseId: state.studioCourseId,
      titre: String(data.get('titre')).trim(),
      description: String(data.get('description')).trim(),
      order: courseModules(state.studioCourseId).length + 1,
    })
    showToast('Module ajouté au cours.', 'success')
    render()
  })

  document.getElementById('form-create-lesson')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    store.lessons.push({
      id: uuid(),
      moduleId: String(data.get('moduleId')),
      titre: String(data.get('titre')).trim(),
      contenu: String(data.get('contenu')).trim(),
      duration: '15 min',
    })
    showToast('Leçon ajoutée au module.', 'success')
    render()
  })

  document.getElementById('form-manual-enroll')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const userId = String(data.get('userId'))
    if (enrollmentFor(userId, state.studioCourseId)) {
      showToast('Cet apprenant est déjà inscrit à ce cours.')
      return
    }
    store.enrollments.push({
      id: uuid(),
      courseId: state.studioCourseId,
      userId,
      enrolledAt: new Date().toISOString(),
      lessonProgress: {},
    })
    showToast('Apprenant inscrit au cours.', 'success')
    render()
  })

  // Admin
  const uSearchEl = document.getElementById('admin-user-search')
  if (uSearchEl) {
    uSearchEl.addEventListener('input', (e) => {
      state.filters.userSearch = e.target.value
      render()
      const refocused = document.getElementById('admin-user-search')
      if (refocused) {
        refocused.focus()
        refocused.setSelectionRange(refocused.value.length, refocused.value.length)
      }
    })
  }

  document.getElementById('admin-role-filter')?.addEventListener('change', (e) => {
    state.filters.userRole = e.target.value
    render()
  })

  document.getElementById('admin-active-filter')?.addEventListener('change', (e) => {
    state.filters.userActive = e.target.value
    render()
  })

  document.querySelectorAll('[data-inspect-user]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.adminSelectedUserId = btn.getAttribute('data-inspect-user')
      render()
    })
  })

  document.getElementById('admin-change-role')?.addEventListener('change', (e) => {
    const uid = e.target.getAttribute('data-user-id')
    const nextRole = e.target.value
    const target = store.users.find((u) => u.id === uid)
    if (!target) return
    const activeAdmins = store.users.filter((u) => u.role === 'admin' && u.is_active)
    if (target.role === 'admin' && target.is_active && nextRole !== 'admin' && activeAdmins.length <= 1) {
      showToast('Impossible de rétrograder le dernier administrateur actif.', 'error')
      render()
      return
    }
    target.role = nextRole
    showToast(`Rôle mis à jour vers ${roleLabel(nextRole)}.`, 'success')
    render()
  })

  document.getElementById('btn-toggle-user-active')?.addEventListener('click', (e) => {
    const uid = e.currentTarget.getAttribute('data-user-id')
    const target = store.users.find((u) => u.id === uid)
    if (!target) return
    const activeAdmins = store.users.filter((u) => u.role === 'admin' && u.is_active)
    if (target.role === 'admin' && target.is_active && activeAdmins.length <= 1) {
      showToast('Le dernier administrateur actif ne peut pas être désactivé.', 'error')
      return
    }
    target.is_active = !target.is_active
    showToast(target.is_active ? 'Compte réactivé.' : 'Compte désactivé.', 'success')
    render()
  })

  document.getElementById('btn-admin-revoke')?.addEventListener('click', () => {
    showToast('Toutes les sessions de cet utilisateur ont été révoquées.', 'success')
  })

  document.getElementById('form-admin-create-user')?.addEventListener('submit', (e) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const created = {
      id: uuid(),
      name: String(data.get('name')).trim(),
      email: String(data.get('email')).trim().toLowerCase(),
      role: String(data.get('role')),
      is_active: true,
      email_verified: true,
      email_verified_at: new Date().toISOString(),
      last_login_at: null,
      created_at: new Date().toISOString(),
      avatar: 'assets/images/instructor-portrait.jpg',
    }
    store.users.unshift(created)
    state.adminSelectedUserId = created.id
    showToast('Utilisateur créé par l’administrateur.', 'success')
    render()
  })

  document.querySelectorAll('[data-demo-route]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const route = btn.getAttribute('data-demo-route')
      const user = currentUser()
      if (route === '/api/health') {
        state.demoResult = { route, status: 200, ok: true, message: 'API HTTP opérationnelle.' }
      } else if (route === '/api/health/database') {
        state.demoResult = { route, status: 200, ok: true, message: 'Maquette prête pour le contrôle MySQL.' }
      } else if (route === '/api/demo/authenticated') {
        state.demoResult = { route, status: 200, ok: true, message: `Authentifié (${user.email}).` }
      } else if (route === '/api/demo/verified') {
        state.demoResult = user.email_verified
          ? { route, status: 200, ok: true, message: 'Adresse vérifiée : accès accordé.' }
          : { route, status: 403, ok: false, message: 'EMAIL_NOT_VERIFIED — Vérification requise.' }
      } else if (route === '/api/demo/teaching-team') {
        const ok = user.role === 'admin' || user.role === 'teacher'
        state.demoResult = ok
          ? { route, status: 200, ok: true, message: 'Accès équipe pédagogique accordé.' }
          : { route, status: 403, ok: false, message: 'FORBIDDEN — Réservé aux formateurs et administrateurs.' }
      } else if (route === '/api/demo/admin') {
        const ok = user.role === 'admin'
        state.demoResult = ok
          ? { route, status: 200, ok: true, message: 'Accès administrateur accordé.' }
          : { route, status: 403, ok: false, message: 'FORBIDDEN — Rôle admin requis.' }
      }
      render()
    })
  })

  // Role switches inside notices
  root.querySelectorAll('[data-role-switch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role-switch')
      const match = store.users.find((u) => u.role === role && u.is_active) ?? store.users.find((u) => u.role === role)
      if (match) {
        state.currentUserId = match.id
        showToast(`Aperçu basculé sur ${match.name} (${roleLabel(match.role)}).`)
        render()
      }
    })
  })
}

/* ==========================================================================
   Initialisation Globale
   ========================================================================== */

function init() {
  syncThemeUi()
  document.getElementById('theme-toggle-btn')?.addEventListener('click', toggleTheme)

  document.querySelectorAll('.workspace-bar [data-role-switch]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const role = btn.getAttribute('data-role-switch')
      const match =
        store.users.find((u) => u.role === role && u.is_active) ??
        store.users.find((u) => u.role === role)
      if (match) {
        state.currentUserId = match.id
        showToast(`Aperçu basculé sur ${match.name} (${roleLabel(match.role)}).`)
        render()
      }
    })
  })

  const menuToggle = document.getElementById('mobile-menu-toggle')
  const drawer = document.getElementById('mobile-drawer')
  menuToggle?.addEventListener('click', () => {
    if (!drawer) return
    const nextHidden = !drawer.hidden
    drawer.hidden = nextHidden
    menuToggle.setAttribute('aria-expanded', String(!nextHidden))
  })

  render()
}

init()
