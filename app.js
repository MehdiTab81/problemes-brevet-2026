/* ==========================================================================
   Logique de l'application — Automatismes 3ème / Brevet
   Support QCM + réponses courtes (input)
   ========================================================================== */

const state = {
  mode: 'eval',      // 'eval' ou 'train'
  duree: 1200,       // en secondes (0 = libre)
  series: [],        // [{question object}]
  answers: [],       // [{selectedIdx, helped}]
  current: 0,
  timer: null,
  remaining: 0,
  startedAt: null
};

/* ---------- Utilitaires UI ---------- */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#' + id).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  if (typeof maybeToggleCalc === 'function') maybeToggleCalc(id);
}

function renderMath(node) {
  if (window.MathJax && MathJax.typesetPromise) {
    MathJax.typesetPromise([node]).catch(() => {});
  }
}

/* ---------- Onglets accueil ---------- */
function initTabs() {
  $$('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab-btn').forEach(b => b.classList.remove('active'));
      $$('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panel = document.getElementById(btn.dataset.target);
      panel.classList.add('active');
      if (btn.dataset.target === 'tab-revision') renderRevision();
      if (btn.dataset.target === 'tab-parcours') renderParcours();
      if (btn.dataset.target === 'tab-duel') renderDuelProfiles();
    });
  });
}

/* ---------- Peuplement dynamique des thèmes (home) ---------- */
function initThemes() {
  const list = $('#themes-list');
  if (!list) return; // onglet "S'évaluer" simplifié : pas de liste de thèmes
  list.innerHTML = Object.entries(THEME_META).map(([id, meta]) => {
    const count = (QUESTION_BANK[id] || []).length;
    return `
    <label class="theme-pill selected" data-theme="${id}" style="color: ${meta.color};">
      <input type="checkbox" name="theme" value="${id}" checked />
      <span class="pill-icon" style="background: ${meta.color};">${meta.icon}</span>
      <span class="pill-label">${meta.short}</span>
      <span class="pill-count">${count}</span>
    </label>
  `;
  }).join('');
  // Le <label> toggle l'input automatiquement ; on ne fait que synchroniser la classe visuelle
  $$('.theme-pill').forEach(pill => {
    const input = pill.querySelector('input');
    input.addEventListener('change', () => pill.classList.toggle('selected', input.checked));
  });
  $('#btn-all-themes').addEventListener('click', () => {
    $$('.theme-pill').forEach(p => {
      p.querySelector('input').checked = true;
      p.classList.add('selected');
    });
  });
  $('#btn-no-themes').addEventListener('click', () => {
    $$('.theme-pill').forEach(p => {
      p.querySelector('input').checked = false;
      p.classList.remove('selected');
    });
  });
}

/* ==========================================================================
   Accessibilité — profil PAP/PPS/dys/TDAH (localStorage)
   ========================================================================== */
const A11Y_KEY = 'autopb3.a11y';
const A11Y_DEFAULTS = {
  fontLexend: false,
  size: 'normal',      // 'normal' | 'large' | 'xlarge'
  spacing: false,
  bgCream: false,
  hideTimer: false,
  reduceMotion: false,
  speak: false
};

function loadA11y() {
  try { return Object.assign({}, A11Y_DEFAULTS, JSON.parse(localStorage.getItem(A11Y_KEY) || '{}')); }
  catch (e) { return { ...A11Y_DEFAULTS }; }
}
function saveA11y(prefs) { localStorage.setItem(A11Y_KEY, JSON.stringify(prefs)); }

function applyA11y(prefs) {
  const b = document.body;
  b.classList.toggle('a11y-font-lexend', prefs.fontLexend);
  b.classList.toggle('a11y-size-large', prefs.size === 'large');
  b.classList.toggle('a11y-size-xlarge', prefs.size === 'xlarge');
  b.classList.toggle('a11y-spacing', prefs.spacing);
  b.classList.toggle('a11y-bg-cream', prefs.bgCream);
  b.classList.toggle('a11y-hide-timer', prefs.hideTimer);
  b.classList.toggle('a11y-reduce-motion', prefs.reduceMotion);
  b.classList.toggle('a11y-speak', prefs.speak);
}

function initA11y() {
  const prefs = loadA11y();
  applyA11y(prefs);

  const modal = $('#a11y-modal');
  const btnOpen = $('#btn-a11y');
  const btnClose = $('#btn-a11y-close');
  const btnApply = $('#btn-a11y-apply');
  const btnReset = $('#btn-a11y-reset');
  if (!modal || !btnOpen) return;

  function syncFormFromPrefs() {
    const p = loadA11y();
    $('#a11y-font-lexend').checked = p.fontLexend;
    $('#a11y-size').value = p.size;
    $('#a11y-spacing').checked = p.spacing;
    $('#a11y-bg-cream').checked = p.bgCream;
    $('#a11y-hide-timer').checked = p.hideTimer;
    $('#a11y-reduce-motion').checked = p.reduceMotion;
    $('#a11y-speak').checked = p.speak;
  }

  function collectPrefs() {
    return {
      fontLexend: $('#a11y-font-lexend').checked,
      size: $('#a11y-size').value,
      spacing: $('#a11y-spacing').checked,
      bgCream: $('#a11y-bg-cream').checked,
      hideTimer: $('#a11y-hide-timer').checked,
      reduceMotion: $('#a11y-reduce-motion').checked,
      speak: $('#a11y-speak').checked
    };
  }

  btnOpen.addEventListener('click', () => { syncFormFromPrefs(); modal.hidden = false; });
  btnClose.addEventListener('click', () => { modal.hidden = true; });
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.hidden = true; });
  // A4 : touche Échap ferme la modale
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) modal.hidden = true;
  });

  btnApply.addEventListener('click', () => {
    const p = collectPrefs();
    saveA11y(p);
    applyA11y(p);
    modal.hidden = true;
    // Re-rendu de la question en cours si présent (pour faire apparaître/disparaître le bouton 🔊)
    if (state && state.series && state.series.length && document.querySelector('#screen-test.active')) {
      renderQuestion();
    }
  });

  btnReset.addEventListener('click', () => {
    saveA11y({ ...A11Y_DEFAULTS });
    applyA11y(A11Y_DEFAULTS);
    syncFormFromPrefs();
  });
}

/* Synthèse vocale : lit le texte de l'énoncé en français.
   On enlève les balises HTML et simplifie les expressions LaTeX les plus courantes. */
function a11ySpeak(text) {
  if (!('speechSynthesis' in window)) {
    alert("La lecture vocale n'est pas disponible sur cet appareil.");
    return;
  }
  // Nettoyage HTML
  const tmp = document.createElement('div');
  tmp.innerHTML = text;
  let spoken = tmp.textContent || tmp.innerText || '';
  // Simplifications LaTeX courantes
  spoken = spoken
    .replace(/\\dfrac\{([^}]+)\}\{([^}]+)\}/g, '$1 sur $2')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 sur $2')
    .replace(/\\sqrt\{([^}]+)\}/g, 'racine carrée de $1')
    .replace(/\\times/g, ' fois ')
    .replace(/\\pi/g, ' pi ')
    .replace(/\\approx/g, ' environ ')
    .replace(/\^2/g, ' au carré')
    .replace(/\^3/g, ' au cube')
    .replace(/\^\{?(-?\d+)\}?/g, ' puissance $1')
    .replace(/\\/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const utter = new SpeechSynthesisUtterance(spoken);
  utter.lang = 'fr-FR';
  utter.rate = 0.9;
  window.speechSynthesis.cancel();

  const btn = document.querySelector('.btn-speak');
  if (btn) btn.classList.add('speaking');
  utter.onend = () => { if (btn) btn.classList.remove('speaking'); };
  window.speechSynthesis.speak(utter);
}

/* ---------- Mode sombre ---------- */
function initDarkMode() {
  const stored = localStorage.getItem('theme-mode');
  const prefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const mode = stored || (prefers ? 'dark' : 'light');
  document.body.dataset.theme = mode;
  updateThemeBtn();
  $('#btn-theme').addEventListener('click', () => {
    const cur = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = cur;
    localStorage.setItem('theme-mode', cur);
    updateThemeBtn();
  });
}
function updateThemeBtn() {
  $('#btn-theme').textContent = document.body.dataset.theme === 'dark' ? '☀️' : '🌙';
}

/* Correspondance générateur → clé d'exercice de rédaction */
const REDACTION_FOR_GEN = {
  t5_pythagore_hypotenuse: 'pythagore_direct',
  t5_pythagore_cote: 'pythagore_direct',
  t5_pythagore_reciproque: 'pythagore_reciproque_vrai', // default to vrai
  t5_thales: 'thales_direct',
  t5_thales_papillon: 'thales_direct',
  t5_thales_reciproque: 'thales_reciproque_vrai',
  t5_triangles_semblables: 'triangles_semblables',
  t6_cos_formule: 'trigo_cote',
  t6_choix_formule_cote: 'trigo_cote',
  t6_ecrire_rapport: 'trigo_cote'
};

/* Fiches consultées — stockées localement */
const REV_VIEWED_KEY = 'autopb3.rev.viewed';
function getViewedSet() {
  try { return new Set(JSON.parse(localStorage.getItem(REV_VIEWED_KEY) || '[]')); } catch(e) { return new Set(); }
}
function markAsViewed(genName) {
  const s = getViewedSet();
  s.add(genName);
  localStorage.setItem(REV_VIEWED_KEY, JSON.stringify([...s]));
  // Mettre à jour l'UI en direct
  const card = document.querySelector(`.flashcard[data-gen="${genName}"]`);
  if (card) card.classList.add('viewed');
  updateThemeCounts();
}
function updateThemeCounts() {
  const viewed = getViewedSet();
  document.querySelectorAll('.revision-theme').forEach(t => {
    const theme = t.dataset.theme;
    const gens = QUESTION_BANK[theme] || [];
    const seen = gens.filter(g => viewed.has(g.name)).length;
    const total = gens.length;
    const countEl = t.querySelector('.revision-theme-count');
    if (!countEl) return;
    countEl.textContent = `${seen}/${total}`;
    countEl.classList.remove('partial', 'complete');
    if (seen === total && total > 0) countEl.classList.add('complete');
    else if (seen > 0) countEl.classList.add('partial');
  });
}

/* ---------- Fiche de révision (accordéon + flashcards 3D) ---------- */
function renderRevision() {
  const container = $('#revision-content');
  if (container.dataset.built === '1') { updateThemeCounts(); return; }

  const intro = `<div class="revision-intro">💡 <strong>Comment utiliser ces fiches ?</strong> Clique sur un thème pour ouvrir ses cartes. Chaque carte se retourne au clic. Un ✓ apparaît sur les cartes déjà consultées. Les compteurs en haut à droite indiquent ta progression.</div>
  <div class="revision-search">
    <input type="text" id="revision-search-input" placeholder="🔎 Rechercher une compétence (ex. Thalès, volume, pourcentage...)" autocomplete="off" />
    <button type="button" class="ghost small search-clear" id="revision-search-clear">Effacer</button>
  </div>
  <div class="revision-toolbar">
    <button type="button" class="ghost small" id="btn-expand-all">📖 Tout ouvrir</button>
    <button type="button" class="ghost small" id="btn-collapse-all">📕 Tout fermer</button>
  </div>
  <div id="revision-empty" class="revision-empty" style="display:none;">Aucune compétence ne correspond à cette recherche.</div>`;

  const html = intro + Object.entries(QUESTION_BANK).map(([themeId, gens]) => {
    const meta = THEME_META[themeId];
    const cards = gens.map((gen, i) => {
      let q;
      try { q = gen(); } catch(e) { return ''; }
      const cardId = `fc-${themeId}-${i}`;
      return `
        <div class="flashcard" id="${cardId}" data-theme="${themeId}" data-gen="${gen.name}">
          <div class="flashcard-inner">
            <div class="flashcard-face flashcard-front">
              <div>
                <div class="flashcard-icon" style="background:${meta.color};">${meta.icon}</div>
                <div class="fc-theme">${meta.short}</div>
                <div class="fc-title">${q.title}</div>
              </div>
              <div class="fc-hint">Clique pour voir la fiche →</div>
            </div>
            <div class="flashcard-face flashcard-back">
              <div class="fc-back-title">
                <span class="flashcard-icon" style="background:${meta.color};">${meta.icon}</span>
                <span>${q.title}</span>
              </div>

              <div class="fc-block fc-block-cours">
                <div class="fc-block-head">📘 L'essentiel</div>
                <div class="fc-block-body">${q.help.cours}</div>
              </div>

              <div class="fc-block fc-block-example">
                <div class="fc-block-head">💡 Exemple résolu</div>
                <div class="fc-block-body">
                  <div class="fc-example-q">${q.body}</div>
                  <div class="fc-example-arrow">↓</div>
                  <div class="fc-example-a">${q.solution}</div>
                </div>
              </div>

              <div class="fc-block fc-block-trap">
                <div class="fc-block-head">⚠️ Piège à éviter</div>
                <div class="fc-block-body">${q.help.erreurs[0] || ''}</div>
              </div>

              <div class="fc-back-actions">
                <button class="fc-practice-btn" data-gen="${gen.name}">⚡ S'entraîner</button>
                ${REDACTION_FOR_GEN[gen.name] ? `<button class="fc-practice-btn fc-redaction-btn" data-redaction="${REDACTION_FOR_GEN[gen.name]}">✍️ Rédiger</button>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
    return `
      <div class="revision-theme" data-theme="${themeId}">
        <div class="revision-theme-header">
          <span class="rev-icon" style="background: ${meta.color};">${meta.icon}</span>
          <span class="revision-theme-title">${meta.label}</span>
          <span class="revision-theme-count">${gens.length} fiche${gens.length>1?'s':''}</span>
          <span class="revision-theme-chevron">⌄</span>
        </div>
        <div class="revision-theme-body">
          <div class="flashcards-grid">${cards}</div>
        </div>
      </div>`;
  }).join('');
  container.innerHTML = html;

  // Accordéon : clic sur header (plusieurs thèmes peuvent être ouverts simultanément)
  container.querySelectorAll('.revision-theme-header').forEach(h => {
    h.addEventListener('click', () => {
      const theme = h.closest('.revision-theme');
      const wasOpen = theme.classList.contains('open');
      theme.classList.toggle('open');
      if (!wasOpen) {
        // Trigger MathJax render on the now-visible cards
        setTimeout(() => renderMath(theme.querySelector('.revision-theme-body')), 50);
      }
    });
  });

  // A1 : boutons "Tout ouvrir" / "Tout fermer"
  $('#btn-expand-all')?.addEventListener('click', () => {
    container.querySelectorAll('.revision-theme').forEach(t => {
      t.classList.add('open');
      setTimeout(() => renderMath(t.querySelector('.revision-theme-body')), 50);
    });
  });
  $('#btn-collapse-all')?.addEventListener('click', () => {
    container.querySelectorAll('.revision-theme.open').forEach(t => t.classList.remove('open'));
  });

  // Clic sur flashcard → flip (sauf si clic sur bouton)
  // Appliquer la classe "viewed" aux cartes déjà consultées
  const viewed = getViewedSet();
  container.querySelectorAll('.flashcard').forEach(card => {
    if (viewed.has(card.dataset.gen)) card.classList.add('viewed');
    card.addEventListener('click', e => {
      if (e.target.closest('.fc-practice-btn')) return;
      card.classList.toggle('flipped');
      // Marquer comme consultée dès le 1er flip
      if (card.classList.contains('flipped')) markAsViewed(card.dataset.gen);
    });
  });
  updateThemeCounts();

  // Barre de recherche
  const searchInp = $('#revision-search-input');
  const searchClear = $('#revision-search-clear');
  const emptyEl = $('#revision-empty');
  const applySearch = () => {
    const q = searchInp.value.trim().toLowerCase();
    let visibleCount = 0;
    container.querySelectorAll('.revision-theme').forEach(theme => {
      let cardMatches = 0;
      theme.querySelectorAll('.flashcard').forEach(card => {
        const title = card.querySelector('.fc-title')?.textContent?.toLowerCase() || '';
        const match = !q || title.includes(q);
        card.style.display = match ? '' : 'none';
        if (match) cardMatches++;
      });
      theme.style.display = (cardMatches === 0 && q) ? 'none' : '';
      if (cardMatches > 0 || !q) visibleCount++;
      // Si recherche active : ouvrir automatiquement les thèmes avec résultats, fermer les autres
      if (q) theme.classList.toggle('open', cardMatches > 0);
    });
    emptyEl.style.display = (q && visibleCount === 0) ? 'block' : 'none';
  };
  searchInp.addEventListener('input', applySearch);
  searchClear.addEventListener('click', () => { searchInp.value = ''; applySearch(); searchInp.focus(); });

  // Bouton "S'entraîner" (question) / "Rédiger" (exercice glisser-déposer)
  container.querySelectorAll('.fc-practice-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (btn.dataset.redaction) {
        openRedaction(btn.dataset.redaction);
        return;
      }
      const genName = btn.dataset.gen;
      const gen = Object.values(QUESTION_BANK).flat().find(g => g.name === genName);
      if (!gen) return;
      startQuickPractice(gen);
    });
  });

  container.dataset.built = '1';
}

/* Mini-entraînement sur une seule compétence (lancé depuis une flashcard) */
function startQuickPractice(gen) {
  const q = gen();
  state.series = [q];
  state.answers = [{ selectedIdx: null, inputAnswer: '', helped: false }];
  state.current = 0;
  state.mode = 'train';   // active le bouton d'aide
  state.duree = 0;
  state.remaining = 0;
  state.parcours = null;
  state._quickPractice = true; // flag pour savoir qu'on revient à la révision après
  startTimer();
  showScreen('screen-test');
  renderQuestion();
}

/* ==========================================================================
   Système élève : identité + historique (localStorage)
   ========================================================================== */
const STORE_KEYS = { STUDENT: 'autopb3.student', SESSIONS: 'autopb3.sessions', REPORTS: 'autopb3.reports' };

function getStudent() {
  try { return JSON.parse(localStorage.getItem(STORE_KEYS.STUDENT) || 'null'); } catch(e) { return null; }
}
function setStudent(obj) { localStorage.setItem(STORE_KEYS.STUDENT, JSON.stringify(obj)); }
function clearStudent() {
  localStorage.removeItem(STORE_KEYS.STUDENT);
  localStorage.removeItem(STORE_KEYS.SESSIONS);
}
function getSessions() {
  try { return JSON.parse(localStorage.getItem(STORE_KEYS.SESSIONS) || '[]'); } catch(e) { return []; }
}
function saveSession(s) {
  const arr = getSessions();
  arr.unshift(s);
  localStorage.setItem(STORE_KEYS.SESSIONS, JSON.stringify(arr.slice(0, 100)));
  refreshStudentBadge();
}
function getReports() {
  try { return JSON.parse(localStorage.getItem(STORE_KEYS.REPORTS) || '[]'); } catch(e) { return []; }
}
function saveReport(r) {
  const arr = getReports();
  arr.unshift(r);
  localStorage.setItem(STORE_KEYS.REPORTS, JSON.stringify(arr.slice(0, 200)));
}

/* Signaler un problème sur une question */
function reportProblem(qIndex) {
  const q = state.series[qIndex];
  const a = state.answers[qIndex];
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <h3>Signaler un problème</h3>
      <p class="note">Décris brièvement ce qui ne va pas (énoncé ambigu, calcul faux, choix bizarre, figure…). Ton enseignant recevra la question exacte + ton message.</p>
      <label>Message<br>
        <textarea id="report-msg" style="min-height:100px;" placeholder="Ex. Je pense que la bonne réponse devrait être C. Le calcul donne…"></textarea>
      </label>
      <div class="modal-actions">
        <button class="ghost" id="btn-cancel-report">Annuler</button>
        <button class="primary" id="btn-send-report">Signaler</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  setTimeout(() => $('#report-msg').focus(), 50);
  $('#btn-cancel-report').addEventListener('click', () => modal.remove());
  $('#btn-send-report').addEventListener('click', () => {
    const msg = $('#report-msg').value.trim();
    if (!msg) { alert('Écris ton message.'); return; }
    const st = getStudent();
    saveReport({
      date: new Date().toISOString(),
      student: st ? `${st.prenom} · ${st.classe}` : '(anonyme)',
      theme: q.theme,
      title: q.title,
      body: q.body,
      choices: q.choices,
      correctIdx: q.correctIdx,
      selectedIdx: a.selectedIdx,
      message: msg
    });
    // marquer visuellement
    const btn = document.querySelector(`[data-report-idx="${qIndex}"]`);
    if (btn) { btn.textContent = '✓ Signalé'; btn.classList.add('done'); btn.disabled = true; }
    modal.remove();
  });
}

/* Header badge élève */
function refreshStudentBadge() {
  const st = getStudent();
  const wrap = $('#student-badge');
  if (!wrap) return;
  if (st) {
    wrap.innerHTML = `<span class="student-chip" id="btn-profile-menu" role="button" title="Mon profil">${st.prenom} · ${st.classe}</span>
                      <button class="icon-btn" id="btn-history" title="Historique" aria-label="Historique">📊</button>`;
    $('#btn-history').addEventListener('click', () => showHistory());
    $('#btn-profile-menu').addEventListener('click', () => showProfileMenu());
  } else {
    wrap.innerHTML = `<button class="icon-btn" id="btn-login" title="Se connecter">👤</button>`;
    $('#btn-login').addEventListener('click', () => showLogin());
  }
}

/* ==========================================================================
   EXPORT / IMPORT de la progression (JSON)
   Permet à l'élève de transférer sa progression d'un appareil à l'autre
   sans backend. 100 % local, 100 % RGPD.
   ========================================================================== */
const EXPORT_VERSION = 1;
const EXPORT_APP = 'problemes-brevet2026';
const EXPORT_REMINDER_KEY = 'autopb3.export.lastReminder';
const EXPORT_LAST_EXPORT_KEY = 'autopb3.export.lastExportAt';
const EXPORT_KEYS = [
  'autopb3.student',
  'autopb3.history',
  'autopb3.parcours',
  'autopb3.duel.players',
  'autopb3.rev.viewed',
  'autopb3.a11y'
];

function buildExportPayload() {
  const data = {};
  EXPORT_KEYS.forEach(k => {
    const v = localStorage.getItem(k);
    if (v !== null) {
      try { data[k] = JSON.parse(v); } catch(e) { data[k] = v; }
    }
  });
  const st = getStudent() || {};
  return {
    version: EXPORT_VERSION,
    app: EXPORT_APP,
    exportedAt: new Date().toISOString(),
    student: st,
    data
  };
}

function exportProgression() {
  const payload = buildExportPayload();
  const st = payload.student;
  const safe = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  const datePart = new Date().toISOString().slice(0, 10);
  const fileName = `autopb3-${safe(st.prenom) || 'anonyme'}-${safe(st.classe) || 'classe'}-${datePart}.json`;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  localStorage.setItem(EXPORT_LAST_EXPORT_KEY, Date.now().toString());
  return fileName;
}

function importProgression(file, onDone) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      if (payload.app !== EXPORT_APP) {
        alert('Ce fichier ne vient pas de ce site (champ "app" invalide).');
        return;
      }
      if (!payload.data || typeof payload.data !== 'object') {
        alert('Fichier invalide : aucune donnée trouvée.');
        return;
      }
      const before = {};
      EXPORT_KEYS.forEach(k => { before[k] = localStorage.getItem(k); });
      // Restauration
      let restoredKeys = 0, sessionsCount = 0;
      Object.entries(payload.data).forEach(([k, v]) => {
        if (!EXPORT_KEYS.includes(k)) return; // ignore keys inconnues
        localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
        restoredKeys++;
        if (k === 'autopb3.history' && Array.isArray(v)) sessionsCount = v.length;
      });
      const exportedAt = payload.exportedAt ? new Date(payload.exportedAt).toLocaleString('fr-FR') : '—';
      alert(`✅ Progression restaurée\n\n• ${restoredKeys} jeux de données importés\n• ${sessionsCount} séance(s) dans l'historique\n• Export initial : ${exportedAt}\n\nLa page va se recharger.`);
      location.reload();
    } catch (e) {
      alert("Erreur à la lecture du fichier : " + e.message);
    }
    if (onDone) onDone();
  };
  reader.readAsText(file);
}

/* Menu profil — accessible en cliquant sur le nom dans le header */
function showProfileMenu() {
  const st = getStudent();
  if (!st) return;
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  const lastExport = localStorage.getItem(EXPORT_LAST_EXPORT_KEY);
  const lastExportStr = lastExport
    ? new Date(parseInt(lastExport)).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'jamais';
  modal.innerHTML = `
    <div class="modal profile-modal">
      <h3>${st.prenom} · ${st.classe}</h3>
      <p class="note" style="margin-top:-4px;">Ton profil reste sur cet appareil. Pour le transférer sur un autre appareil (ordinateur, tablette, téléphone), utilise les boutons ci-dessous.</p>

      <div class="profile-section">
        <h4>📥 Sauvegarde & transfert</h4>
        <p class="note" style="margin:4px 0 8px 0;font-size:0.85rem;">Dernière sauvegarde : <strong>${lastExportStr}</strong></p>
        <button class="primary" id="btn-export-prog" style="width:100%;">💾 Exporter ma progression</button>
        <p class="note" style="margin:6px 0;font-size:0.8rem;">Télécharge un fichier <code>.json</code>. Envoie-le-toi par mail, ou mets-le sur clé USB.</p>
        <button class="ghost" id="btn-import-prog" style="width:100%;margin-top:8px;">📂 Importer une progression</button>
        <input type="file" id="fld-import-file" accept=".json,application/json" style="display:none;" />
        <p class="note" style="margin:6px 0;font-size:0.8rem;">Restaure une progression exportée depuis un autre appareil.</p>
      </div>

      <div class="profile-section">
        <h4>⚙ Profil</h4>
        <button class="ghost" id="btn-edit-profile" style="width:100%;">✏️ Modifier prénom / classe</button>
      </div>

      <div class="profile-section">
        <h4>📱 Astuces</h4>
        <div class="pwa-info">
          <div class="pwa-info-row"><strong>✓ Fonctionne sans Wi-Fi</strong><br><span class="note">Une fois ouvert une première fois, le site marche même sans connexion. Parfait pour réviser en voiture, dans le métro, ou quand la box est en panne.</span></div>
          ${!isStandaloneMode() ? `<div class="pwa-info-row" style="margin-top:8px;"><button class="ghost small" id="btn-show-install-guide" style="width:100%;">📱 Comment installer l'app sur mon téléphone ?</button></div>` : `<div class="pwa-info-row" style="margin-top:8px;color:var(--ok);"><strong>🎉 App installée</strong></div>`}
        </div>
      </div>

      <div class="modal-actions">
        <button class="ghost" id="btn-profile-close">Fermer</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  $('#btn-profile-close').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });

  $('#btn-export-prog').addEventListener('click', () => {
    const fileName = exportProgression();
    alert(`✅ Fichier "${fileName}" téléchargé !\n\nConseil : envoie-toi ce fichier par mail ou messagerie pour pouvoir le récupérer sur un autre appareil.`);
    close();
  });

  const fldFile = $('#fld-import-file');
  $('#btn-import-prog').addEventListener('click', () => fldFile.click());
  fldFile.addEventListener('change', () => {
    const file = fldFile.files[0];
    if (!file) return;
    if (!confirm(`⚠️ Importer "${file.name}" va remplacer ta progression actuelle.\n\nContinuer ?`)) {
      fldFile.value = '';
      return;
    }
    importProgression(file, () => { fldFile.value = ''; });
  });

  $('#btn-edit-profile').addEventListener('click', () => {
    close();
    showLogin(st);
  });

  // Guide d'installation accessible depuis la modale profil
  $('#btn-show-install-guide')?.addEventListener('click', () => {
    close();
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
    } else if (isIOS()) {
      showIOSInstallGuide();
    } else {
      showGenericInstallGuide();
    }
  });
}

/* Guide générique (Android/desktop quand prompt pas dispo) */
function showGenericInstallGuide() {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <h3>📱 Installer l'app</h3>
      <p style="font-size:0.95rem;line-height:1.6;">Selon ton navigateur :</p>
      <ul style="padding-left:22px;line-height:1.8;">
        <li><strong>Chrome / Edge (Android, PC)</strong> : menu <strong>⋮</strong> → <strong>« Installer l'application »</strong> ou <strong>« Ajouter à l'écran d'accueil »</strong></li>
        <li><strong>Safari (iPhone, iPad)</strong> : bouton Partager <strong>&#x2B06;</strong> → <strong>« Sur l'écran d'accueil »</strong></li>
        <li><strong>Firefox</strong> : menu ⋮ → <strong>« Installer »</strong></li>
      </ul>
      <p class="note" style="font-size:0.85rem;">Une fois installée, l'app fonctionne <strong>sans Wi-Fi</strong> et s'ouvre comme une vraie application.</p>
      <div class="modal-actions">
        <button class="primary" id="btn-install-ok">OK</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  $('#btn-install-ok').addEventListener('click', () => modal.remove());
}

/* Rappel automatique : si l'élève a fait 5+ séances sans export, on lui suggère
   de sauvegarder (non bloquant). Affiché au plus une fois par semaine. */
function maybeRemindExport() {
  const st = getStudent();
  if (!st) return;
  const sessions = getSessions();
  if (!sessions || sessions.length < 5) return;
  const lastExport = parseInt(localStorage.getItem(EXPORT_LAST_EXPORT_KEY) || '0');
  const sessionsSince = sessions.filter(s => new Date(s.date).getTime() > lastExport).length;
  if (sessionsSince < 5) return;
  const lastReminder = parseInt(localStorage.getItem(EXPORT_REMINDER_KEY) || '0');
  const oneWeek = 7 * 24 * 3600 * 1000;
  if (Date.now() - lastReminder < oneWeek) return;
  localStorage.setItem(EXPORT_REMINDER_KEY, Date.now().toString());
  // Bandeau non bloquant
  const bar = document.createElement('div');
  bar.className = 'export-reminder';
  bar.innerHTML = `
    <span>💾 <strong>Pense à sauvegarder ta progression !</strong> Tu as fait ${sessionsSince} séances depuis la dernière sauvegarde.</span>
    <button class="primary small" id="btn-reminder-export">Sauvegarder</button>
    <button class="ghost small" id="btn-reminder-close">Plus tard</button>`;
  document.body.appendChild(bar);
  const close = () => bar.remove();
  $('#btn-reminder-close').addEventListener('click', close);
  $('#btn-reminder-export').addEventListener('click', () => {
    const fileName = exportProgression();
    alert(`✅ Fichier "${fileName}" téléchargé !`);
    close();
  });
}

/* Fenêtre login simple */
function showLogin(existing = null) {
  const st = existing || getStudent() || { prenom: '', classe: '' };
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <h3>${existing ? 'Modifier mon profil' : 'Se connecter'}</h3>
      <p class="note" style="margin-top:0;">Ton prénom et ta classe restent <strong>sur ton appareil</strong> (aucun envoi). Utile pour retrouver tes progrès.</p>
      <label>Prénom<br><input id="fld-prenom" value="${st.prenom}" autocomplete="given-name" /></label>
      <label style="margin-top:10px;display:block;">Classe (ex. 1G3)<br><input id="fld-classe" value="${st.classe}" /></label>
      <div class="modal-actions">
        <button class="ghost" id="btn-cancel-login">Annuler</button>
        ${existing ? '<button class="ghost" id="btn-logout-modal" style="color:var(--ko);border-color:var(--ko);">Me déconnecter</button>' : ''}
        <button class="primary" id="btn-save-login">Enregistrer</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  $('#btn-cancel-login').addEventListener('click', () => modal.remove());
  $('#btn-save-login').addEventListener('click', () => {
    const prenom = $('#fld-prenom').value.trim();
    const classe = $('#fld-classe').value.trim();
    if (!prenom || !classe) { alert('Remplis les deux champs.'); return; }
    setStudent({ prenom, classe });
    refreshStudentBadge();
    modal.remove();
  });
  if (existing) {
    $('#btn-logout-modal').addEventListener('click', () => {
      if (confirm('Supprimer ton profil ET tout l\'historique de cet appareil ?')) {
        clearStudent();
        refreshStudentBadge();
        modal.remove();
      }
    });
  }
  setTimeout(() => $('#fld-prenom').focus(), 50);
}

/* Historique */
function showHistory() {
  const st = getStudent();
  const sessions = getSessions();
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';

  const byThemeTotals = {};
  sessions.forEach(s => {
    if (!s.byTheme) return;
    Object.entries(s.byTheme).forEach(([t, v]) => {
      if (!byThemeTotals[t]) byThemeTotals[t] = { ok: 0, total: 0 };
      byThemeTotals[t].ok += v.ok;
      byThemeTotals[t].total += v.total;
    });
  });
  const themeBars = Object.entries(byThemeTotals).map(([t, v]) => {
    const meta = THEME_META[t] || {};
    const pct = v.total ? Math.round(100 * v.ok / v.total) : 0;
    return `
      <div class="theme-row">
        <span class="chip-icon" style="background:${meta.color};width:24px;height:24px;border-radius:6px;display:inline-grid;place-items:center;color:white;font-weight:700;font-size:0.75rem;">${meta.icon}</span>
        <span style="flex:1;font-weight:500;">${meta.short || t}</span>
        <span style="color:var(--muted);font-size:0.85rem;">${v.ok}/${v.total}</span>
        <div class="bar"><div class="bar-fill" style="width:${pct}%;background:${meta.color};"></div></div>
        <span style="min-width:38px;text-align:right;font-weight:600;">${pct}%</span>
      </div>`;
  }).join('');

  const sessionList = sessions.slice(0, 20).map(s => {
    const d = new Date(s.date);
    const dateStr = d.toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric' }) +
                    ' ' + d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
    return `<div class="session-row">
      <span style="font-weight:500;">${dateStr}</span>
      <span class="tag ${s.pct>=70?'ok':(s.pct>=40?'':'ko')}">${s.score}/${s.total} · ${s.pct}%</span>
    </div>`;
  }).join('') || '<p class="note">Pas encore de séance terminée.</p>';

  modal.innerHTML = `
    <div class="modal modal-large">
      <h3 style="margin-bottom:6px;">Mon historique</h3>
      <p class="note" style="margin:0 0 14px;">${st ? st.prenom + ' · ' + st.classe : ''} — ${sessions.length} séance(s)</p>

      <h4 style="margin:14px 0 8px;">Progression par compétence</h4>
      <div class="theme-bars">${themeBars || '<p class="note">Pas encore de données.</p>'}</div>

      <h4 style="margin:20px 0 8px;">Séances récentes</h4>
      <div class="sessions-list">${sessionList}</div>

      <div class="modal-actions" style="margin-top:20px;">
        <button class="ghost" id="btn-edit-profile">Modifier mon profil</button>
        <button class="ghost" id="btn-export">Exporter pour le prof</button>
        <button class="primary" id="btn-close-history">Fermer</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  $('#btn-close-history').addEventListener('click', () => modal.remove());
  $('#btn-edit-profile').addEventListener('click', () => { modal.remove(); showLogin(getStudent()); });
  $('#btn-export').addEventListener('click', () => exportForTeacher());
}

/* Export texte copiable pour le prof */
function exportForTeacher() {
  const st = getStudent() || { prenom: '(inconnu)', classe: '' };
  const sessions = getSessions();
  const byThemeTotals = {};
  sessions.forEach(s => {
    if (!s.byTheme) return;
    Object.entries(s.byTheme).forEach(([t, v]) => {
      if (!byThemeTotals[t]) byThemeTotals[t] = { ok: 0, total: 0 };
      byThemeTotals[t].ok += v.ok;
      byThemeTotals[t].total += v.total;
    });
  });
  const lines = [];
  lines.push(`=== RAPPORT AUTOMATISMES ===`);
  lines.push(`Élève : ${st.prenom} · ${st.classe}`);
  lines.push(`Date d'export : ${new Date().toLocaleString('fr-FR')}`);
  lines.push(`Séances terminées : ${sessions.length}`);
  lines.push('');
  lines.push(`--- Progression par compétence ---`);
  Object.entries(byThemeTotals).forEach(([t, v]) => {
    const meta = THEME_META[t] || { short: t };
    const pct = v.total ? Math.round(100*v.ok/v.total) : 0;
    lines.push(`  ${meta.short.padEnd(18)} ${String(v.ok).padStart(3)}/${String(v.total).padStart(3)}  ${String(pct).padStart(3)} %`);
  });
  lines.push('');
  lines.push(`--- 10 dernières séances ---`);
  sessions.slice(0, 10).forEach(s => {
    const d = new Date(s.date);
    lines.push(`  ${d.toLocaleDateString('fr-FR')} ${d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})} — ${s.score}/${s.total} (${s.pct} %) mode=${s.mode}${s.withHelp ? ` aides=${s.withHelp}`:''}`);
  });

  // Signalements
  const reports = getReports();
  if (reports.length) {
    lines.push('');
    lines.push(`--- Problèmes signalés (${reports.length}) ---`);
    reports.forEach((r, idx) => {
      const d = new Date(r.date);
      const letters = 'ABCD';
      const stripTags = s => (s || '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\\d?frac\{([^{}]+)\}\{([^{}]+)\}/g, '$1/$2')
        .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
        .replace(/\\cdot|\\times/g, '×')
        .replace(/\\dots|\\ldots/g, '…')
        .replace(/\\left|\\right/g, '')
        .replace(/\\[a-zA-Z]+/g, ' ')
        .replace(/\\\(|\\\)|\\,|\\;/g,' ')
        .replace(/[{}]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      lines.push('');
      lines.push(`[${idx+1}] ${d.toLocaleString('fr-FR')} — thème: ${(THEME_META[r.theme]||{}).short || r.theme} — ${r.title}`);
      lines.push(`Question : ${stripTags(r.body).slice(0, 500)}`);
      r.choices.forEach((c, i) => {
        const mark = (i === r.correctIdx ? '(juste)' : '') + (i === r.selectedIdx ? ' [choix élève]' : '');
        lines.push(`  ${letters[i]}. ${stripTags(c)} ${mark}`);
      });
      lines.push(`Message élève : ${r.message}`);
    });
  }

  const txt = lines.join('\n');

  // Modale copier/télécharger
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  // Pourcentage global (moyenne des scores par séance)
  const pctGlobal = sessions.length
    ? Math.round(sessions.reduce((s,x) => s+x.pct, 0) / sessions.length)
    : 0;

  modal.innerHTML = `
    <div class="modal">
      <h3>Exporter pour le prof</h3>
      <p class="note">Trois façons d'envoyer ton rapport à ton enseignant.</p>
      <textarea id="export-text" readonly>${txt.replace(/</g,'&lt;')}</textarea>
      <div class="modal-actions">
        <button class="ghost" id="btn-close-export">Fermer</button>
        <button class="ghost" id="btn-download">Télécharger (.txt)</button>
        <button class="ghost" id="btn-copy">Copier le texte</button>
        <button class="primary" id="btn-send-direct">📤 Envoyer au prof</button>
      </div>
      <p class="note" style="margin-top:10px;">
        <strong>Envoi direct</strong> : ton rapport arrive chez ton enseignant sans passer par ProNote ou mail.
        Seuls ton prénom et ta classe sont transmis, avec tes scores.
      </p>
    </div>`;
  document.body.appendChild(modal);
  $('#btn-close-export').addEventListener('click', () => modal.remove());
  $('#btn-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(txt);
      $('#btn-copy').textContent = '✓ Copié !';
    } catch(e) {
      $('#export-text').select();
      document.execCommand('copy');
      $('#btn-copy').textContent = '✓ Copié !';
    }
  });
  $('#btn-download').addEventListener('click', () => {
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `rapport-${st.prenom}-${st.classe}-${new Date().toISOString().slice(0,10)}.txt`;
    a.click();
  });
  $('#btn-send-direct').addEventListener('click', async () => {
    const btn = $('#btn-send-direct');
    btn.disabled = true;
    btn.textContent = 'Envoi…';
    try {
      // FormSubmit.co : envoi direct par mail, sans backend.
      // Endpoint ajax → réponse JSON (pas de redirection).
      const TEACHER_ENDPOINT = 'https://formsubmit.co/ajax/mahditabka6@gmail.com';
      const payload = {
        _subject: `[Automatismes 3ème Brevet] Rapport de ${st.prenom} (${st.classe}) — ${pctGlobal}%`,
        _template: 'table',
        _captcha: 'false',
        Élève: `${st.prenom} · ${st.classe}`,
        'Nombre de séances': String(sessions.length),
        'Pourcentage global': `${pctGlobal}%`,
        Rapport: txt
      };
      const res = await fetch(TEACHER_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== 'false') {
        btn.textContent = '✓ Envoyé au prof !';
        btn.style.background = 'var(--ok)';
        btn.style.borderColor = 'var(--ok)';
      } else {
        throw new Error(data.message || ('HTTP ' + res.status));
      }
    } catch(e) {
      btn.disabled = false;
      btn.textContent = 'Échec — réessayer';
      alert("Envoi impossible (pas de connexion Internet ?). Tu peux copier ou télécharger le rapport à la place.");
    }
  });
}

/* ---------- Démarrer l'évaluation ---------- */
// Note : sur problemes-brevet2026, l'onglet "S'évaluer" n'existe pas (pas de #btn-start).
// Ce bloc ne s'attache que si l'élément est présent, sinon on saute silencieusement
// pour ne pas planter le reste du script (qui définirait plus bas SKILLS, renderSkillsTab…).
const __btnStartEval = $('#btn-start');
if (__btnStartEval) {
  __btnStartEval.addEventListener('click', () => {
    // Mode évaluation officiel : timer obligatoire et visible (même si l'option "masquer timer"
    // est cochée dans l'accessibilité), tous thèmes mélangés, pas d'aide.
    const duree = parseInt(document.querySelector('input[name=duree]:checked').value, 10) || 1200;
    state.mode = 'eval';
    state.duree = duree;
    state.series = buildSeries([]); // [] = tous les thèmes mélangés
    state.answers = state.series.map(() => ({ selectedIdx: null, inputAnswer: '', helped: false }));
    state.current = 0;
    state.startedAt = Date.now();
    state.remaining = duree;
    document.body.classList.add('evaluating'); // force l'affichage du chrono
    startTimer();
    showScreen('screen-test');
    renderQuestion();
  });
}

/* ---------- Démarrer un entraînement libre ---------- */
const btnStartTrain = $('#btn-start-train');
if (btnStartTrain) {
  btnStartTrain.addEventListener('click', () => {
    // Récupère thèmes cochés
    const themes = $$('#themes-list input[name="theme"]:checked').map(i => i.value);
    if (!themes.length) {
      alert('Coche au moins un thème pour t\'entraîner.');
      return;
    }
    const nbq = parseInt(document.querySelector('input[name="train-nbq"]:checked')?.value, 10) || 7;
    const duree = parseInt(document.querySelector('input[name="train-duree"]:checked')?.value, 10) || 0;

    // Construit une série avec le nombre demandé. buildSeries force 9 par défaut — on tronque/complète.
    const series = buildSeries(themes);
    // buildSeries renvoie 9 max ; si on veut 12, on complète en tirant à nouveau sans contrainte "unique"
    let finalSeries = series.slice(0, Math.min(nbq, series.length));
    if (nbq > finalSeries.length) {
      // Compléter en piochant parmi les générateurs des thèmes choisis (doublons autorisés)
      const allGens = themes.flatMap(t => QUESTION_BANK[t] || []);
      while (finalSeries.length < nbq && allGens.length > 0) {
        const g = allGens[Math.floor(Math.random() * allGens.length)];
        finalSeries.push(g());
      }
    }

    state.mode = 'train';  // aide + cours disponibles
    state.duree = duree;
    state.series = finalSeries;
    state.answers = state.series.map(() => ({ selectedIdx: null, inputAnswer: '', helped: false }));
    state.current = 0;
    state.startedAt = Date.now();
    state.remaining = duree;
    state.parcours = null;
    startTimer();
    showScreen('screen-test');
    renderQuestion();
  });
}

/* ---------- Timer ---------- */
function startTimer() {
  clearInterval(state.timer);
  if (state.duree === 0) {
    $('#timer').textContent = '∞';
    return;
  }
  updateTimerDisplay();
  state.timer = setInterval(() => {
    state.remaining--;
    updateTimerDisplay();
    if (state.remaining <= 0) {
      clearInterval(state.timer);
      finishTest();
    }
  }, 1000);
}

function updTimerLow() {
  if (state.remaining <= 60) $('#timer').classList.add('low');
  else $('#timer').classList.remove('low');
}

function updateTimerDisplay() {
  const m = Math.floor(state.remaining / 60);
  const s = state.remaining % 60;
  $('#timer').textContent = `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  updTimerLow();
}

/* ---------- Rendu d'une question ---------- */
function renderQuestion() {
  const q = state.series[state.current];
  const ans = state.answers[state.current];

  $('#progress').textContent = `Question ${state.current + 1} / ${state.series.length}`;

  const meta = THEME_META[q.theme] || {};
  const c = $('#question-container');
  const isInput = q.type === 'input';
  const isOrder = q.type === 'order';

  let answerBlock;
  if (isInput) {
    answerBlock = `
      <div class="input-answer">
        <label style="font-weight:600;color:var(--muted);font-size:0.9rem;">Ta réponse :</label>
        <div class="input-row">
          <input type="text" id="qinput" value="${ans.inputAnswer ?? ''}" placeholder="tape ta réponse ici" autocomplete="off" inputmode="${q.inputSuffix && /^\d/.test(ans.inputAnswer||'') ? 'decimal' : 'text'}" />
          ${q.inputSuffix ? `<span class="input-suffix">${q.inputSuffix}</span>` : ''}
        </div>
        <p class="note" style="font-size:0.82rem;margin-top:8px;">Tu peux écrire les virgules avec « , » ou « . ». Pas besoin de préciser l'unité.</p>
      </div>`;
  } else if (isOrder) {
    // Drag-drop : l'ordre actuel est stocké dans ans.orderArr
    // Au 1er affichage, on construit depuis q.body (qui a déjà des data-orig mélangés)
    answerBlock = ''; // Le HTML drag-drop est inclus dans q.body
  } else {
    answerBlock = `
      <div class="choices">
        ${q.choices.map((ch, i) => `
          <label class="choice ${ans.selectedIdx === i ? 'selected' : ''}" data-idx="${i}">
            <input type="radio" name="qchoice" ${ans.selectedIdx === i ? 'checked' : ''} />
            <span class="letter">${String.fromCharCode(65 + i)}</span>
            <span class="content">${ch}</span>
          </label>
        `).join('')}
      </div>`;
  }

  const a11yPrefs = loadA11y();
  const speakBtn = a11yPrefs.speak
    ? `<button class="btn-speak" id="btn-speak" type="button" aria-label="Lire la question à voix haute">🔊 Lire la question</button>`
    : '';

  c.innerHTML = `
    <div class="q-chip" style="color: ${meta.color || 'var(--muted)'};">
      <span class="chip-icon" style="background: ${meta.color || 'var(--muted)'};">${meta.icon || '?'}</span>
      ${themeLabel(q.theme)}
      <span class="chip-sep"></span>
      <span style="color: var(--muted);">${q.title}</span>
    </div>
    ${speakBtn}
    <div class="q-body">${q.body}</div>
    ${answerBlock}
    ${state.mode === 'train' ? `
      <button class="help-btn" id="btn-help">Aide — rappel de cours</button>
      <div id="help-panel" style="display:none;"></div>
    ` : ''}
  `;

  if (a11yPrefs.speak) {
    $('#btn-speak')?.addEventListener('click', () => {
      const textToRead = q.body + (isInput ? '' : ' ' + q.choices.map((c, i) => `Réponse ${String.fromCharCode(65+i)} : ${c}`).join('. '));
      a11ySpeak(textToRead);
    });
  }

  if (isInput) {
    const inp = $('#qinput');
    inp.addEventListener('input', () => {
      state.answers[state.current].inputAnswer = inp.value;
      renderDots();
    });
    // focus auto
    setTimeout(() => inp.focus(), 30);
  } else {
    // Listeners de choix QCM
    $$('#question-container .choice').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx, 10);
        state.answers[state.current].selectedIdx = idx;
        renderQuestion();
        renderDots();
      });
    });
  }

  // Drag-drop pour les questions de type "order"
  if (isOrder) {
    const list = c.querySelector('.order-list');
    if (list) {
      // Ajoute des boutons ↑↓ à chaque item (plus fiable que drag sur mobile)
      list.querySelectorAll('.order-item').forEach(item => {
        const text = item.querySelector('.order-text');
        const controls = document.createElement('span');
        controls.className = 'order-controls';
        controls.innerHTML = '<button class="order-up" type="button">↑</button><button class="order-down" type="button">↓</button>';
        item.appendChild(controls);
      });

      const updateAnswer = () => {
        const currentOrder = Array.from(list.querySelectorAll('.order-item'))
          .map(li => parseInt(li.dataset.orig, 10));
        state.answers[state.current].orderArr = currentOrder;
        renderDots();
      };

      list.addEventListener('click', e => {
        const up = e.target.closest('.order-up');
        const down = e.target.closest('.order-down');
        if (up) {
          const li = up.closest('.order-item');
          const prev = li.previousElementSibling;
          if (prev) { list.insertBefore(li, prev); updateAnswer(); li.animate([{ background: 'rgba(139, 92, 246, 0.3)' }, { background: 'transparent' }], { duration: 500 }); }
        } else if (down) {
          const li = down.closest('.order-item');
          const next = li.nextElementSibling;
          if (next) { list.insertBefore(next, li); updateAnswer(); li.animate([{ background: 'rgba(139, 92, 246, 0.3)' }, { background: 'transparent' }], { duration: 500 }); }
        }
      });

      // HTML5 drag-drop (pour PC)
      let dragged = null;
      list.querySelectorAll('.order-item').forEach(item => {
        item.addEventListener('dragstart', e => {
          dragged = item;
          item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => {
          if (dragged) dragged.classList.remove('dragging');
          dragged = null;
          updateAnswer();
        });
        item.addEventListener('dragover', e => e.preventDefault());
        item.addEventListener('drop', e => {
          e.preventDefault();
          if (dragged && dragged !== item) {
            const rect = item.getBoundingClientRect();
            const afterEl = (e.clientY - rect.top) > rect.height / 2;
            list.insertBefore(dragged, afterEl ? item.nextElementSibling : item);
          }
        });
      });

      // Init : stocker l'ordre initial mélangé
      if (!state.answers[state.current].orderArr) {
        state.answers[state.current].orderArr = Array.from(list.querySelectorAll('.order-item'))
          .map(li => parseInt(li.dataset.orig, 10));
      }
    }
  }

  if (state.mode === 'train') {
    $('#btn-help').addEventListener('click', () => {
      state.answers[state.current].helped = true;
      const panel = $('#help-panel');
      panel.innerHTML = renderHelp(q.help);
      panel.className = 'help-panel';
      panel.style.display = 'block';
      renderMath(panel);
      renderDots();
    });
  }

  $('#btn-prev').disabled = state.current === 0;
  $('#btn-next').disabled = state.current === state.series.length - 1;

  renderDots();
  renderMath(c);
}

function themeLabel(t) {
  return (THEME_META[t] && THEME_META[t].short) || t;
}

function renderHelp(help) {
  return `
    <h4>Cours</h4><div>${help.cours}</div>
    <h4>Savoir-faire</h4><div>${help.savoirFaire}</div>
    <h4>Erreurs à éviter</h4>
    <ul>${help.erreurs.map(e => `<li>${e}</li>`).join('')}</ul>
  `;
}

/* ---------- Points de navigation ---------- */
function renderDots() {
  const dots = state.series.map((_, i) => {
    const a = state.answers[i];
    let cls = 'qdot';
    const q = state.series[i];
    const isAns = q.type === 'input' ? (a.inputAnswer && a.inputAnswer.trim())
                : q.type === 'order' ? !!a.orderArr
                : (a.selectedIdx !== null);
    if (isAns) cls += ' answered';
    if (a.helped) cls += ' helped';
    if (i === state.current) cls += ' current';
    return `<span class="${cls}" data-idx="${i}">${i+1}</span>`;
  }).join('');
  $('#qdots').innerHTML = dots;
  $$('#qdots .qdot').forEach(el => {
    el.addEventListener('click', () => {
      state.current = parseInt(el.dataset.idx, 10);
      renderQuestion();
    });
  });
}

/* ---------- Navigation ---------- */
$('#btn-prev').addEventListener('click', () => {
  if (state.current > 0) { state.current--; renderQuestion(); }
});
$('#btn-next').addEventListener('click', () => {
  if (state.current < state.series.length - 1) { state.current++; renderQuestion(); }
});
$('#btn-finish').addEventListener('click', () => {
  const unanswered = state.answers.filter((a, i) => {
    const q = state.series[i];
    return q.type === 'input' ? !(a.inputAnswer && a.inputAnswer.trim())
         : q.type === 'order' ? !a.orderArr
         : a.selectedIdx === null;
  }).length;
  if (unanswered > 0) {
    if (!confirm(`Il reste ${unanswered} question(s) sans réponse. Valider quand même ?`)) return;
  }
  finishTest();
});

/* ---------- Vérification d'une réponse (QCM, input ou order) ---------- */
function isAnswerCorrect(q, a) {
  if (q.type === 'order') {
    if (!a.orderArr) return false;
    // q.expected = [0, 1, 2, ..., n-1] (ordre correct)
    // a.orderArr = ordre actuel des data-orig
    return a.orderArr.every((v, i) => v === q.expected[i]);
  }
  if (q.type === 'input') {
    if (!a.inputAnswer) return false;
    const got = normalizeAnswer(a.inputAnswer);
    const expected = q.expected;
    if (Array.isArray(expected)) {
      return expected.some(e => normalizeAnswer(e) === got);
    }
    if (expected instanceof RegExp) {
      return expected.test(got);
    }
    return normalizeAnswer(String(expected)) === got;
  }
  return a.selectedIdx === q.correctIdx;
}

/* ---------- Fin du test → résultats ---------- */
function finishTest() {
  // Enregistrement de la progression Compétences (avant reset)
  let skillResult = null; // mémorise le contexte pour afficher un message de progression
  if (state._skillContext) {
    const { skillId, formatId, level } = state._skillContext;
    const before = getSkillStats(skillId, formatId, level).correct;
    let corrects = 0;
    state.series.forEach((q, i) => {
      const ans = state.answers[i];
      const isCorrect = isAnswerCorrect(q, ans);
      if (isCorrect) corrects++;
      recordSkillAttempt(skillId, formatId, level, isCorrect);
    });
    const after = getSkillStats(skillId, formatId, level).correct;
    const nextLevel = Math.min(5, level + 1);
    const nextUnlockedBefore = before >= 3;
    const nextUnlockedAfter = after >= 3;
    skillResult = {
      skillId, formatId, level, corrects, total: state.series.length,
      justUnlockedNext: !nextUnlockedBefore && nextUnlockedAfter,
      nextLevel,
      attemptsBefore: before
    };
    state._skillContext = null;
  }
  clearInterval(state.timer);
  document.body.classList.remove('evaluating');
  // Rappel export progression (si élève connecté et 5+ séances depuis dernier export)
  setTimeout(() => { try { maybeRemindExport(); } catch(e){} }, 800);
  const score = state.answers.reduce((s, a, i) =>
    s + (isAnswerCorrect(state.series[i], a) ? 1 : 0), 0);
  const withHelp = state.answers.filter(a => a.helped).length;

  const pct = Math.round(score / state.series.length * 100);
  // Note sur 6 (barème Brevet partie 1 automatismes), arrondi au demi-point
  const note6 = Math.round((score / state.series.length) * 6 * 2) / 2;
  const student = getStudent();
  // En mode éval officielle : on affiche la note /6 en grand
  const showNote6 = state.mode === 'eval' && !state.parcours;
  // Bannière de célébration si on vient de finir un exercice Compétence
  let skillBanner = '';
  if (skillResult) {
    const { corrects, total, justUnlockedNext, nextLevel, level } = skillResult;
    const r = corrects / total;
    let head = '', msg = '', emoji = '🎉';
    if (r === 1)       { head = 'Parfait !';         emoji = '🏆'; msg = 'Sans faute, bravo !'; }
    else if (r >= 0.8) { head = 'Excellent !';       emoji = '⭐'; msg = 'Tu maîtrises bien ce niveau.'; }
    else if (r >= 0.6) { head = 'Très bien !';       emoji = '👏'; msg = 'Continue comme ça.'; }
    else if (r >= 0.4) { head = 'Bon début !';       emoji = '💪'; msg = 'Essaye encore pour progresser.'; }
    else               { head = 'Courage !';         emoji = '🌱'; msg = 'Relis la correction et retente.'; }
    const unlockMsg = justUnlockedNext && level < 5
      ? `<div class="skill-unlock">🔓 Bravo ! Tu viens de débloquer le niveau <strong>${nextLevel}</strong> !</div>`
      : '';
    skillBanner = `
      <div class="skill-celebration ${r >= 0.6 ? 'ok' : 'meh'}">
        <div class="celeb-emoji">${emoji}</div>
        <div class="celeb-text">
          <div class="celeb-head">${head}</div>
          <div class="celeb-sub">${msg} (${corrects} / ${total} justes)</div>
          ${unlockMsg}
        </div>
      </div>`;
  }
  $('#score-box').innerHTML = `
    ${skillBanner}
    <div class="big">${score} / ${state.series.length}</div>
    <div class="sub">${pct} % de réussite
    ${withHelp > 0 ? `· ${withHelp} question(s) avec aide` : ''}
    ${student ? `<br><span style="opacity:0.9;font-size:0.9rem;">${student.prenom} · ${student.classe}</span>` : ''}
    </div>
    ${showNote6 ? `<div style="margin-top:14px;padding:14px 18px;background:rgba(255,255,255,0.18);border-radius:12px;">
      <div style="font-size:0.82rem;letter-spacing:0.06em;text-transform:uppercase;opacity:0.9;">Note (barème Brevet)</div>
      <div style="font-size:2.4rem;font-weight:800;margin-top:4px;">${String(note6).replace('.', ',')} / 6</div>
    </div>` : ''}
  `;

  $('#results-list').innerHTML = state.series.map((q, i) => {
    const a = state.answers[i];
    const ok = isAnswerCorrect(q, a);
    const meta = THEME_META[q.theme] || {};
    let userAns, goodAns;
    if (q.type === 'input') {
      userAns = a.inputAnswer ? `<code>${a.inputAnswer}</code>` : '<em>non répondue</em>';
      const expectedShown = Array.isArray(q.expected) ? q.expected[0] : String(q.expected);
      goodAns = `<code>${expectedShown}${q.inputSuffix ? ' ' + q.inputSuffix : ''}</code>`;
    } else if (q.type === 'order') {
      // Question d'ordonnancement : on ne réaffiche pas 5 étapes dans le récap, juste juste/faux
      userAns = a.orderArr ? `<em>ordre proposé par l'élève</em>` : '<em>non répondue</em>';
      goodAns = `<em>ordre attendu : voir la correction</em>`;
    } else {
      userAns = a.selectedIdx !== null
        ? `<strong>${String.fromCharCode(65 + a.selectedIdx)}.</strong> ${q.choices[a.selectedIdx]}`
        : '<em>non répondue</em>';
      goodAns = `<strong>${String.fromCharCode(65 + q.correctIdx)}.</strong> ${q.choices[q.correctIdx]}`;
    }
    return `
      <div class="result-item ${ok ? 'ok' : 'ko'}">
        <div class="q-head">
          <strong>Q${i+1}.</strong>
          <span class="chip-icon" style="background:${meta.color || '#888'};width:22px;height:22px;border-radius:6px;display:inline-grid;place-items:center;color:white;font-weight:700;font-size:0.75rem;">${meta.icon || '?'}</span>
          <span style="color:var(--muted);font-size:0.9rem;">${meta.short}</span>
          <span>· ${q.title}</span>
          <span class="tag ${ok ? 'ok' : 'ko'}">${ok ? '✓ juste' : '✗ faux'}</span>
          ${a.helped ? '<span class="tag helped">aide utilisée</span>' : ''}
        </div>
        <div class="q-body">${q.body}</div>
        <div><em>Ta réponse :</em> ${userAns}</div>
        ${ok ? '' : `<div style="margin-top:4px;"><em>Bonne réponse :</em> ${goodAns}</div>`}
        <details>
          <summary>Voir la correction détaillée</summary>
          <div style="margin:10px 0;">${q.solution}</div>
          ${renderHelp(q.help)}
        </details>
        <button class="report-btn" data-report-idx="${i}">⚠ Signaler un problème</button>
      </div>
    `;
  }).join('');
  // listeners report
  $$('[data-report-idx]').forEach(btn => {
    btn.addEventListener('click', () => reportProblem(parseInt(btn.dataset.reportIdx, 10)));
  });

  // Sauvegarder la séance dans l'historique
  saveSession({
    date: new Date().toISOString(),
    score, total: state.series.length, pct,
    withHelp,
    mode: state.mode,
    duree: state.duree,
    byTheme: computeByTheme(),
    themes: [...new Set(state.series.map(q => q.theme))],
    parcours: !!state.parcours
  });

  // Si c'était une séance parcours : mettre à jour les compétences
  if (state.parcours) {
    const p = getParcours();
    if (p) updateParcoursAfterSession(p, state.parcours.day);
    state.parcours = null;
  }

  showScreen('screen-results');
  renderMath($('#screen-results'));
}

/* Score par thème — pour le bilan par compétence */
function computeByTheme() {
  const out = {};
  state.series.forEach((q, i) => {
    const t = q.theme;
    if (!out[t]) out[t] = { ok: 0, total: 0 };
    out[t].total++;
    if (isAnswerCorrect(q, state.answers[i])) out[t].ok++;
  });
  return out;
}

/* ---------- Actions post-test ---------- */
$('#btn-retry-wrong').addEventListener('click', () => {
  const wrongIdx = state.answers
    .map((a, i) => isAnswerCorrect(state.series[i], a) ? -1 : i)
    .filter(i => i >= 0);
  if (wrongIdx.length === 0) { alert('Bravo, aucune erreur !'); return; }
  // Régénérer des variantes des questions manquées (mêmes thèmes, nouvelles valeurs)
  const themesWrong = wrongIdx.map(i => state.series[i].theme);
  const series = themesWrong.map(t => {
    const pool = QUESTION_BANK[t];
    return pool[Math.floor(Math.random() * pool.length)]();
  });
  state.series = series;
  state.answers = series.map(() => ({ selectedIdx: null, inputAnswer: '', helped: false }));
  state.current = 0;
  state.mode = 'train';  // mode entraînement automatique
  state.duree = 0;       // sans timer
  state.remaining = 0;
  startTimer();
  showScreen('screen-test');
  renderQuestion();
});

$('#btn-new-test').addEventListener('click', () => {
  // Même série (mêmes thèmes) mais nouvelles valeurs
  const themes = [...new Set(state.series.map(q => q.theme))];
  state.series = buildSeries(themes);
  state.answers = state.series.map(() => ({ selectedIdx: null, inputAnswer: '', helped: false }));
  state.current = 0;
  state.remaining = state.duree;
  startTimer();
  showScreen('screen-test');
  renderQuestion();
});

$('#btn-home').addEventListener('click', () => {
  clearInterval(state.timer);
  showScreen('screen-home');
});

/* ---------- Raccourcis clavier ---------- */
function initKeyboard() {
  document.addEventListener('keydown', e => {
    // Uniquement sur l'écran de test
    if (!$('#screen-test').classList.contains('active')) return;
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    // A, B, C, D → sélectionner une réponse
    const key = e.key.toLowerCase();
    if (['a','b','c','d'].includes(key)) {
      const idx = key.charCodeAt(0) - 97;
      const choice = $$('.choice')[idx];
      if (choice) { choice.click(); e.preventDefault(); }
    } else if (['1','2','3','4'].includes(e.key)) {
      const idx = parseInt(e.key) - 1;
      const choice = $$('.choice')[idx];
      if (choice) { choice.click(); e.preventDefault(); }
    } else if (e.key === 'ArrowRight') {
      if (state.current < state.series.length - 1) { state.current++; renderQuestion(); }
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      if (state.current > 0) { state.current--; renderQuestion(); }
      e.preventDefault();
    }
  });
}

/* ==========================================================================
   PARCOURS 10 JOURS — Répétition espacée (Leitner)
   ==========================================================================
   Chaque compétence = un générateur (nom de fonction, ex. "t1_inverse_double").
   Niveau 0..5, interval = BOX_INTERVALS[level] jours.
   Juste → level++ ; Faux → level = 0 (retour au début).
   ========================================================================== */
const PARCOURS_KEY = 'autopb3.parcours';
const BOX_INTERVALS = [0, 1, 2, 4, 7, 14]; // jours d'attente après une réussite par niveau
const MAX_SESSIONS_PER_DAY = 3;

function daysBetween(isoA, isoB) {
  const a = new Date(isoA); a.setHours(0,0,0,0);
  const b = new Date(isoB); b.setHours(0,0,0,0);
  return Math.round((b - a) / (1000 * 3600 * 24));
}
function todayIso() {
  const d = new Date(); d.setHours(0,0,0,0);
  return d.toISOString();
}

function getParcours() {
  let p;
  try { p = JSON.parse(localStorage.getItem(PARCOURS_KEY) || 'null'); } catch(e) { return null; }
  if (!p) return null;
  // Migration : si de nouveaux générateurs ont été ajoutés depuis la création du parcours,
  // on les insère avec un niveau 0 pour qu'ils tombent en séance.
  let added = 0;
  Object.values(QUESTION_BANK).flat().forEach(gen => {
    if (!(gen.name in p.skills)) {
      p.skills[gen.name] = { level: 0, dueDay: 1, lastSeenDay: null, history: [] };
      added++;
    }
  });
  if (added > 0) setParcours(p);
  return p;
}
function setParcours(p) { localStorage.setItem(PARCOURS_KEY, JSON.stringify(p)); }

function initParcours() {
  const skills = {};
  Object.values(QUESTION_BANK).flat().forEach(gen => {
    skills[gen.name] = { level: 0, dueDay: 1, lastSeenDay: null, history: [] };
  });
  const p = {
    startDate: todayIso(),
    skills,
    sessions: [] // { day, date, score, total, byTheme }
  };
  setParcours(p);
  return p;
}
function resetParcours() {
  localStorage.removeItem(PARCOURS_KEY);
}

function parcoursCurrentDay(p) {
  // Jour depuis le début (1 = premier jour), sans plafond
  return daysBetween(p.startDate, todayIso()) + 1;
}
function sessionsDoneToday(p) {
  const today = todayIso();
  return p.sessions.filter(s => daysBetween(s.date, today) === 0).length;
}
function canDoSessionToday(p) {
  return sessionsDoneToday(p) < MAX_SESSIONS_PER_DAY;
}

/* Sélection de 12 compétences pour la séance du jour :
   - priorité aux compétences "dues" (dueDay <= currentDay) triées par niveau croissant (les plus faibles d'abord)
   - compléter avec des compétences nouvelles (jamais vues) si besoin
   - diversifier les thèmes si possible */
function buildParcoursSeries(p, day, n = 9) {
  const allGens = Object.values(QUESTION_BANK).flat();
  const byName = Object.fromEntries(allGens.map(g => [g.name, g]));
  const due = allGens.filter(g => {
    const s = p.skills[g.name];
    return s && s.dueDay <= day;
  }).map(g => ({ g, s: p.skills[g.name] }));

  // Priorité : niveau croissant (0 d'abord), puis ancienneté (lastSeenDay le plus ancien)
  due.sort((A, B) => {
    if (A.s.level !== B.s.level) return A.s.level - B.s.level;
    const aLast = A.s.lastSeenDay ?? -1;
    const bLast = B.s.lastSeenDay ?? -1;
    return aLast - bLast;
  });

  // Sélection avec diversification de thèmes : round-robin sur les thèmes parmi les dues
  const selected = [];
  const usedNames = new Set();
  const dueByTheme = {};
  due.forEach(({g}) => {
    const t = (g().theme); // appel léger pour trouver theme — en réalité on peut regarder QUESTION_BANK
  });

  // Plus simple : parcourir `due` triée, skipper un thème s'il a déjà 2 items déjà sélectionnés
  const themeCounts = {};
  for (const { g } of due) {
    if (selected.length >= n) break;
    // Trouver le thème du générateur via QUESTION_BANK
    let theme = null;
    for (const [t, gens] of Object.entries(QUESTION_BANK)) {
      if (gens.includes(g)) { theme = t; break; }
    }
    if ((themeCounts[theme] || 0) >= 2 && selected.length < n - 2) continue; // limiter la concentration
    selected.push(g);
    usedNames.add(g.name);
    themeCounts[theme] = (themeCounts[theme] || 0) + 1;
  }

  // Si pas assez, compléter avec autres "dues" sans limite
  for (const { g } of due) {
    if (selected.length >= n) break;
    if (!usedNames.has(g.name)) { selected.push(g); usedNames.add(g.name); }
  }

  return shuffle(selected).map(g => {
    const q = g();
    q._genName = g.name; // traçage pour update après séance
    return q;
  });
}

/* Mise à jour des compétences après une séance parcours */
function updateParcoursAfterSession(p, day) {
  const byTheme = {};
  state.series.forEach((q, i) => {
    const correct = isAnswerCorrect(q, state.answers[i]);
    const gName = q._genName;
    if (!gName || !p.skills[gName]) return;
    const s = p.skills[gName];
    s.lastSeenDay = day;
    s.history.push({ day, correct });
    if (correct) {
      s.level = Math.min(5, s.level + 1);
    } else {
      s.level = 0;
    }
    s.dueDay = day + BOX_INTERVALS[s.level];
    // stats par thème
    const t = q.theme;
    if (!byTheme[t]) byTheme[t] = { ok: 0, total: 0 };
    byTheme[t].total++;
    if (correct) byTheme[t].ok++;
  });
  const score = state.answers.reduce((s, a, i) => s + (isAnswerCorrect(state.series[i], a) ? 1 : 0), 0);
  p.sessions.push({
    day, date: new Date().toISOString(),
    score, total: state.series.length,
    pct: Math.round(100 * score / state.series.length),
    byTheme
  });
  setParcours(p);
  return { score, total: state.series.length, byTheme };
}

/* ---------- UI Parcours ---------- */
function renderParcours() {
  const container = $('#parcours-content');
  const p = getParcours();
  if (!p) {
    container.innerHTML = `
      <div class="card" style="text-align:center;padding:32px 24px;">
        <h3 style="margin-bottom:8px;">Prêt à commencer ?</h3>
        <p style="color:var(--muted);">Tu feras une séance de 9 questions par jour pendant 10 jours. Les compétences maîtrisées s'espaceront dans le temps, celles à retravailler reviendront souvent.</p>
        <button class="primary" id="btn-start-parcours">Commencer mon parcours</button>
      </div>`;
    $('#btn-start-parcours').addEventListener('click', () => { initParcours(); renderParcours(); });
    return;
  }

  const day = parcoursCurrentDay(p);
  const todayCount = sessionsDoneToday(p);
  const canContinue = canDoSessionToday(p);
  const levels = Object.values(p.skills).map(s => s.level);
  const mastered = levels.filter(l => l >= 4).length;
  const total = levels.length;
  const masteredPct = Math.round((mastered / total) * 100);
  const allMastered = mastered === total;

  container.innerHTML = `
    <div class="card parcours-main">
      <div class="parcours-head">
        <div>
          <div class="parcours-day">${masteredPct}% maîtrisées</div>
          <div style="color:var(--muted);font-size:0.9rem;">Début le ${new Date(p.startDate).toLocaleDateString('fr-FR')} · Jour ${day}</div>
        </div>
        <div class="parcours-mastery-count">
          <span class="big-num">${mastered}</span>
          <span style="font-size:0.85rem;color:var(--muted);">/ ${total} compétences</span>
        </div>
      </div>
      <div class="parcours-progress">
        <div class="parcours-progress-fill" style="width:${masteredPct}%;"></div>
      </div>
      ${allMastered ? `
        <p style="margin-top:16px;text-align:center;"><strong>🏆 Félicitations !</strong> Tu as maîtrisé toutes les compétences. Continue à t'entraîner pour maintenir tes acquis.</p>
      ` : canContinue ? `
        <button class="primary" id="btn-session-day" style="margin-top:16px;width:100%;">▶ Faire une séance (9 questions · sans timer) — ${todayCount}/${MAX_SESSIONS_PER_DAY} aujourd'hui</button>
        <p style="text-align:center;color:var(--muted);font-size:0.85rem;margin-top:8px;">Max 3 séances par jour pour laisser le cerveau assimiler (répétition espacée).</p>
      ` : `
        <p style="margin-top:16px;text-align:center;color:var(--ok);"><strong>✓ ${todayCount} séances faites aujourd'hui.</strong> Reviens demain — le sommeil consolide ce que tu as appris.</p>
      `}
    </div>

    <h3 style="margin-top:24px;">Progression des compétences</h3>
    <p style="color:var(--muted);font-size:0.9rem;margin-top:-4px;">Chaque carré = une compétence. Couleur = niveau de maîtrise (gris = nouveau, vert = maîtrisé).</p>
    <div class="mastery-legend">
      <span><span class="lvl-dot" style="background:#cbd5e1;"></span>Niveau 0 (à découvrir)</span>
      <span><span class="lvl-dot" style="background:#fbbf24;"></span>1-2 (en cours)</span>
      <span><span class="lvl-dot" style="background:#f97316;"></span>3 (confirmé)</span>
      <span><span class="lvl-dot" style="background:#22c55e;"></span>4-5 (maîtrisé)</span>
    </div>
    <div class="mastery-themes">
      ${Object.entries(QUESTION_BANK).map(([theme, gens]) => {
        const meta = THEME_META[theme];
        return `
          <div class="mastery-theme">
            <div class="mastery-theme-head">
              <span class="chip-icon" style="background:${meta.color};width:24px;height:24px;border-radius:6px;display:inline-grid;place-items:center;color:white;font-weight:700;font-size:0.75rem;">${meta.icon}</span>
              <span style="font-weight:600;">${meta.short}</span>
            </div>
            <div class="mastery-squares">
              ${gens.map(g => {
                const skill = p.skills[g.name] || { level: 0, dueDay: 1 };
                const lvl = skill.level;
                const colors = ['#cbd5e1','#fbbf24','#fbbf24','#f97316','#22c55e','#16a34a'];
                const q = gens.find(x => x.name === g.name);
                const title = q ? q().title : g.name;
                // Prochaine révision : jour dû par rapport au jour actuel
                const daysUntil = skill.dueDay - day;
                let nextReview = '';
                if (lvl === 5) nextReview = ' · maîtrisé';
                else if (daysUntil <= 0) nextReview = ' · à revoir aujourd\'hui';
                else if (daysUntil === 1) nextReview = ' · à revoir demain';
                else nextReview = ` · prochaine révision dans ${daysUntil} j`;
                return `<div class="mastery-sq" title="${title.replace(/"/g, '&quot;')} — niveau ${lvl}/5${nextReview}" style="background:${colors[lvl]};"></div>`;
              }).join('')}
            </div>
          </div>`;
      }).join('')}
    </div>

    ${p.sessions.length ? `
      <h3 style="margin-top:24px;">Séances réalisées</h3>
      <div class="parcours-sessions">
        ${p.sessions.slice().reverse().map(s => {
          const dateStr = new Date(s.date).toLocaleDateString('fr-FR') + ' ' +
                          new Date(s.date).toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'});
          return `<div class="session-row">
            <span>Jour ${s.day} · ${dateStr}</span>
            <span class="tag ${s.pct>=70?'ok':(s.pct>=40?'':'ko')}">${s.score}/${s.total} · ${s.pct}%</span>
          </div>`;
        }).join('')}
      </div>
    ` : ''}

    <div style="margin-top:20px;text-align:right;">
      <button class="ghost small" id="btn-reset-parcours" style="color:var(--muted);">Réinitialiser le parcours</button>
    </div>
  `;

  // Attacher le listener si le bouton est présent (c.-à-d. si le joueur peut faire une séance)
  const sessionBtn = $('#btn-session-day');
  if (sessionBtn) {
    sessionBtn.addEventListener('click', () => startParcoursSession(p, day));
  }
  $('#btn-reset-parcours')?.addEventListener('click', () => {
    if (confirm('Réinitialiser le parcours ? Toute la progression actuelle sera perdue.')) {
      resetParcours();
      renderParcours();
    }
  });
}

function startParcoursSession(p, day) {
  const series = buildParcoursSeries(p, day, 9);
  state.series = series;
  state.answers = series.map(() => ({ selectedIdx: null, inputAnswer: '', helped: false }));
  state.current = 0;
  state.mode = 'train';  // aide dispo
  state.duree = 0;       // pas de timer pour le parcours
  state.remaining = 0;
  state.parcours = { day }; // flag pour identifier une séance parcours
  startTimer();
  showScreen('screen-test');
  renderQuestion();
}

/* ==========================================================================
   MODE DUEL — tour par tour sur un même appareil
   ========================================================================== */

const DUEL_KEYS = {
  PLAYERS: 'autopb3.duel.players',
  MATCHES: 'autopb3.duel.matches'
};

const BADGES = {
  first_win:  { icon: '🏆', title: 'Première victoire',     desc: 'Gagner ton premier duel' },
  no_miss:    { icon: '💯', title: 'Sans faute',            desc: 'Gagner sans te tromper' },
  comeback:   { icon: '🔥', title: 'Retour de flamme',      desc: 'Gagner après avoir été mené' },
  speed:      { icon: '⚡', title: 'Éclair',                desc: 'Gagner un duel en mode rapide' },
  serial3:    { icon: '🎯', title: 'Triplé',                desc: '3 victoires consécutives' },
  serial5:    { icon: '🚀', title: 'Invincible',            desc: '5 victoires consécutives' },
  duel10:     { icon: '🎖️', title: 'Vétéran',              desc: '10 duels joués' },
  perfect:    { icon: '👑', title: 'Souverain',             desc: 'Écraser l\'adversaire (écart max)' },
  polymath:   { icon: '🧠', title: 'Polymathe',             desc: 'Gagner sur 5 thèmes différents' }
};

const LEVELS = [
  { name: 'Apprenti',  xp: 0 },
  { name: 'Stratège',  xp: 100 },
  { name: 'Expert',    xp: 250 },
  { name: 'Champion',  xp: 500 },
  { name: 'Maître',    xp: 1000 },
  { name: 'Légende',   xp: 2000 }
];

function computeLevel(xp) {
  let lvl = LEVELS[0], next = LEVELS[1];
  for (let i = 0; i < LEVELS.length; i++) {
    if (xp >= LEVELS[i].xp) { lvl = LEVELS[i]; next = LEVELS[i+1] || null; }
  }
  return { lvl, next, idx: LEVELS.indexOf(lvl) };
}

/* State du duel en cours */
const duelState = {
  players: [null, null], // [{name, avatar, color}, ...]
  currentIdx: 0,
  questions: [],         // une question par tour par joueur ? Non : une pool de N*2 questions (chacun répond à sa question)
  scores: [0, 0],
  turn: 0,               // index du tour (0..nbRounds-1)
  nbQuestions: 7,
  theme: 'all',
  mode: 'normal',
  timer: null,
  remaining: 0,
  wrongs: [0, 0],
  scoreHistory: [[0], [0]],
  startedAt: null
};

/* ---------- Persistance des joueurs ---------- */
function loadPlayers() {
  try { return JSON.parse(localStorage.getItem(DUEL_KEYS.PLAYERS) || '{}'); } catch(e) { return {}; }
}
function savePlayers(obj) { localStorage.setItem(DUEL_KEYS.PLAYERS, JSON.stringify(obj)); }
function loadMatches() {
  try { return JSON.parse(localStorage.getItem(DUEL_KEYS.MATCHES) || '[]'); } catch(e) { return []; }
}
function saveMatches(arr) { localStorage.setItem(DUEL_KEYS.MATCHES, JSON.stringify(arr.slice(0, 100))); }

function getOrCreateProfile(name) {
  const players = loadPlayers();
  const key = name.trim().toLowerCase();
  if (!players[key]) {
    players[key] = {
      name: name.trim(),
      xp: 0,
      duels: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      streak: 0,         // série actuelle de victoires
      bestStreak: 0,
      badges: [],
      themesWon: [],     // thèmes sur lesquels on a déjà gagné au moins 1 fois
      lastMatch: null
    };
    savePlayers(players);
  }
  return players[key];
}

function updateProfile(name, fn) {
  const players = loadPlayers();
  const key = name.trim().toLowerCase();
  if (!players[key]) getOrCreateProfile(name);
  fn(players[key]);
  savePlayers(players);
  return players[key];
}

/* ---------- Avatars (couleur déterministe depuis prénom) ---------- */
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h*31 + s.charCodeAt(i)) | 0; }
  return Math.abs(h);
}
function avatarColor(name) {
  if (!name) return '#9ca3af';
  const palette = ['#3b82f6','#ef4444','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316','#14b8a6','#6366f1'];
  return palette[hashStr(name) % palette.length];
}
function avatarInitial(name) { return (name || '?').trim().charAt(0).toUpperCase() || '?'; }

// Sélection stratégique des thèmes
const stratSelection = { 1: [], 2: [] };

function renderStratThemesList(playerIdx) {
  const container = $(`#strat-themes-${playerIdx}`);
  container.innerHTML = Object.entries(THEME_META).map(([id, m]) => {
    const sel = stratSelection[playerIdx].includes(id);
    return `<div class="strat-theme-pill ${sel ? 'selected' : ''}" data-id="${id}">
      <span class="chip-icon" style="background:${m.color};color:white;display:grid;place-items:center;font-weight:700;">${m.icon}</span>
      <span>${m.short}</span>
    </div>`;
  }).join('');
  container.querySelectorAll('.strat-theme-pill').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const list = stratSelection[playerIdx];
      const i = list.indexOf(id);
      if (i >= 0) list.splice(i, 1);
      else if (list.length < 2) list.push(id);
      else return; // max 2 atteint
      renderStratThemesList(playerIdx);
      updateStratCount(playerIdx);
    });
  });
  updateStratCount(playerIdx);
}
function updateStratCount(p) {
  const el = $(`#strat-count-${p}`);
  if (!el) return;
  const n = stratSelection[p].length;
  el.textContent = `${n} / 2 thèmes choisis`;
  el.classList.toggle('full', n === 2);
}

/* ---------- Init (appelé au chargement) ---------- */
function initDuel() {
  const themeSel = $('#duel-theme');
  if (themeSel) {
    themeSel.innerHTML = '<option value="all">🎲 Tous les thèmes (mixé)</option>' +
      Object.entries(THEME_META).map(([id, m]) => `<option value="${id}">${m.icon} ${m.label}</option>`).join('');
  }
  // Avatars qui se mettent à jour en temps réel
  ['1','2'].forEach(n => {
    const inp = $(`#duel-p${n}`);
    const av = $(`#duel-avatar-${n}`);
    if (!inp || !av) return;
    const refresh = () => {
      const val = inp.value.trim();
      av.textContent = avatarInitial(val);
      av.style.background = val ? `linear-gradient(135deg, ${avatarColor(val)} 0%, ${avatarColor(val + '_')} 100%)` : '';
      // Mettre à jour les labels du mode stratégique
      const lab = $(`#strat-label-${n}`);
      if (lab) lab.textContent = val || `Joueur ${n}`;
    };
    inp.addEventListener('input', refresh);
    refresh();
  });
  // Mode des thèmes : afficher/masquer les options
  const modeSel = $('#duel-theme-mode');
  if (modeSel) {
    const refreshMode = () => {
      const val = modeSel.value;
      const needsSelection = val === 'strategic' || val === 'homeaway';
      $('#duel-theme-row').style.display = needsSelection ? 'none' : '';
      const box = $('#duel-strategic-themes');
      if (box) {
        box.style.display = needsSelection ? '' : 'none';
        // Mise à jour du texte selon le mode
        if (val === 'strategic') {
          $('#strat-title').textContent = '🎯 Choix stratégique des thèmes';
          $('#strat-desc').innerHTML = 'Chaque joueur choisit <strong>exactement 2 thèmes</strong> sur lesquels il sera interrogé. Joue safe sur tes forts, ou ose sur ce que tu sais faible chez toi.';
        } else if (val === 'homeaway') {
          $('#strat-title').textContent = '🏟 Match aller-retour — choix à domicile';
          $('#strat-desc').innerHTML = 'Chaque joueur choisit <strong>1 ou 2 thèmes</strong> pour son match à domicile. Match aller sur les thèmes de <strong>Joueur 1</strong>, match retour sur ceux de <strong>Joueur 2</strong>. En cas d\'égalité, une <strong>belle</strong> sera jouée sur tous les thèmes mélangés.';
        }
        if (needsSelection) {
          renderStratThemesList(1);
          renderStratThemesList(2);
        }
      }
    };
    modeSel.addEventListener('change', refreshMode);
    refreshMode();
  }
  // Lancer le duel
  const btn = $('#btn-start-duel');
  if (btn) btn.addEventListener('click', startDuel);
  // Quitter le duel
  const btnQuit = $('#btn-quit-duel');
  if (btnQuit) btnQuit.addEventListener('click', () => {
    if (confirm('Abandonner le duel en cours ?')) {
      clearInterval(duelState.timer);
      showScreen('screen-home');
    }
  });
}

/* Filtre : une question est-elle « mobile-friendly » ? (QCM court, sans grosse figure) */
function isMobileFriendly(q) {
  if (q.type !== 'qcm') return false;
  const bodyLen = (q.body || '').length;
  if (bodyLen > 700) return false; // exclut les énoncés avec grosses figures SVG
  const maxChoice = Math.max(...(q.choices || ['']).map(c => (c || '').length));
  if (maxChoice > 80) return false; // chaque choix doit rester lisible
  return true;
}

/* ---------- Démarrer un duel ---------- */
function startDuel() {
  const n1 = $('#duel-p1').value.trim();
  const n2 = $('#duel-p2').value.trim();
  if (!n1 || !n2) { alert('Saisis les deux prénoms.'); return; }
  if (n1.toLowerCase() === n2.toLowerCase()) { alert('Les deux prénoms doivent être différents.'); return; }

  const themeMode = $('#duel-theme-mode').value;
  const theme = $('#duel-theme').value;
  const nbQ = parseInt($('#duel-nbq').value, 10);
  const mode = $('#duel-mode').value;
  const mobileOnly = $('#duel-mobile').checked;
  const miniGame = $('#duel-minigame').value;

  // Mode stratégique : exactement 2 thèmes / joueur
  if (themeMode === 'strategic') {
    if (stratSelection[1].length !== 2 || stratSelection[2].length !== 2) {
      alert('Chaque joueur doit choisir exactement 2 thèmes.');
      return;
    }
  }
  // Mode aller-retour : 1 ou 2 thèmes / joueur
  if (themeMode === 'homeaway') {
    if (stratSelection[1].length < 1 || stratSelection[2].length < 1) {
      alert('Chaque joueur doit choisir au moins 1 thème à domicile.');
      return;
    }
  }

  // Créer les profils si besoin
  getOrCreateProfile(n1);
  getOrCreateProfile(n2);

  // Pools de générateurs par joueur (avec filtre mobile éventuel)
  function buildPoolFromThemes(themes, n) {
    const gens = themes.flatMap(t => (QUESTION_BANK[t] || []).slice());
    const shuffled = shuffle(gens);
    const picked = [];
    let tries = 0;
    let idx = 0;
    const maxTries = Math.max(n * 20, 100);
    while (picked.length < n && tries < maxTries) {
      if (idx >= shuffled.length) idx = 0;
      const gen = shuffled[idx++];
      tries++;
      const q = gen();
      if (mobileOnly && !isMobileFriendly(q)) continue; // on « zappe » si pas compatible
      q._genName = gen.name;
      picked.push(q);
    }
    // Fallback : si pas assez après filtrage, on complète sans filtre
    while (picked.length < n) {
      const gen = shuffled[picked.length % shuffled.length];
      const q = gen();
      q._genName = gen.name;
      picked.push(q);
    }
    return picked;
  }

  let themesP1, themesP2;
  if (themeMode === 'strategic') {
    themesP1 = stratSelection[1].slice();
    themesP2 = stratSelection[2].slice();
  } else if (themeMode === 'homeaway') {
    // En aller-retour, themesP1 = thèmes à domicile de J1 (utilisés au match aller)
    //                 themesP2 = thèmes à domicile de J2 (utilisés au match retour)
    themesP1 = stratSelection[1].slice();
    themesP2 = stratSelection[2].slice();
  } else {
    const all = theme === 'all' ? Object.keys(QUESTION_BANK) : [theme];
    themesP1 = all;
    themesP2 = all;
  }

  // Génération des questions de la MANCHE COURANTE (init = manche aller)
  let roundThemes;
  if (themeMode === 'homeaway') {
    // Manche aller : thèmes de J1 communs aux deux (chacun interrogé sur les thèmes « à domicile » de J1)
    roundThemes = themesP1;
  } else {
    roundThemes = null; // pas homeaway → pools distincts par joueur
  }

  function buildQuestionsForRound(poolThemes, commonPool) {
    const questions = [];
    if (commonPool) {
      // pool commun (aller-retour) : chacun tire dans le même pool
      const pool = buildPoolFromThemes(commonPool, nbQ * 2);
      for (let t = 0; t < nbQ * 2; t++) questions.push(pool[t]);
    } else {
      // pools distincts par joueur (mode random / stratégique)
      const p1 = buildPoolFromThemes(themesP1, nbQ);
      const p2 = buildPoolFromThemes(themesP2, nbQ);
      for (let t = 0; t < nbQ * 2; t++) {
        questions.push(t % 2 === 0 ? p1[Math.floor(t/2)] : p2[Math.floor(t/2)]);
      }
    }
    return questions;
  }

  const questions = buildQuestionsForRound(null, roundThemes);

  duelState.players = [
    { name: n1, color: avatarColor(n1), initial: avatarInitial(n1) },
    { name: n2, color: avatarColor(n2), initial: avatarInitial(n2) }
  ];
  duelState.questions = questions;
  duelState.scores = [0, 0];
  duelState.wrongs = [0, 0];
  duelState.scoreHistory = [[0], [0]];
  duelState.turn = 0;
  duelState.currentIdx = 0;
  duelState.nbQuestions = nbQ;
  duelState.theme = theme;
  duelState.themeMode = themeMode;
  duelState.themesP1 = themesP1;
  duelState.themesP2 = themesP2;
  duelState.mode = mode;
  duelState.mobileOnly = mobileOnly;
  duelState.miniGame = miniGame;
  duelState.miniGameState = null;
  duelState.miniGameWinner = null;
  initMiniGame();
  duelState.startedAt = Date.now();
  // Aller-retour : état des manches
  duelState.round = themeMode === 'homeaway' ? 'aller' : 'unique';
  duelState.roundScores = []; // [[s1,s2], ...] par manche

  // Remplir le scoreboard
  renderDuelScoreboard();
  showScreen('screen-duel');
  renderDuelTurn();
}

function renderDuelScoreboard() {
  // En mode Puissance 4, on force les couleurs P4 : bleu pour J1, orange pour J2
  // En Course de pions aussi. En mode classique, on utilise l'avatar couleur prénom.
  const useFixedColors = duelState.miniGame === 'connect4' || duelState.miniGame === 'race';
  const fixedColors = [
    { main: '#3b82f6', dark: '#1e40af' },  // bleu P4
    { main: '#f59e0b', dark: '#b45309' }   // orange P4
  ];
  duelState.players.forEach((p, i) => {
    const c = useFixedColors ? fixedColors[i] : { main: p.color, dark: avatarColor(p.name+'_') };
    const miniBg = `radial-gradient(circle at 35% 35%, ${c.main} 0%, ${c.dark} 100%)`;
    const el = $(`#duel-mini-${i+1}`);
    if (el) { el.style.background = miniBg; el.textContent = p.initial; }
    $(`#duel-pc-name-${i+1}`).textContent = p.name;
    $(`#duel-pc-score-${i+1}`).textContent = duelState.scores[i];
  });
  const pbarPct = (duelState.turn / (duelState.nbQuestions * 2)) * 100;
  $('#duel-pbar-fill').style.width = pbarPct + '%';
  const qNum = Math.floor(duelState.turn / 2) + 1;
  $('#duel-qnum').textContent = `Tour ${Math.min(qNum, duelState.nbQuestions)} / ${duelState.nbQuestions}`;
  // active player
  $('#duel-p1-card').classList.toggle('active', duelState.currentIdx === 0);
  $('#duel-p2-card').classList.toggle('active', duelState.currentIdx === 1);
}

function renderDuelTurn() {
  if (duelState.turn >= duelState.nbQuestions * 2) {
    // Fin de manche
    if (duelState.themeMode === 'homeaway') {
      onHomeAwayRoundEnd();
      return;
    }
    finishDuel();
    return;
  }
  const p = duelState.players[duelState.currentIdx];
  const q = duelState.questions[duelState.turn];

  // Bandeau tour
  const banner = $('#duel-turn-banner');
  banner.className = 'duel-turn-banner ' + (duelState.currentIdx === 0 ? 'p1' : 'p2');
  banner.textContent = `${p.name}, à toi !`;

  renderDuelScoreboard();

  // Question
  const meta = THEME_META[q.theme] || {};
  const container = $('#duel-question-container');
  const isInput = q.type === 'input';
  const answerBlock = isInput ? `
    <div class="input-answer">
      <label style="font-weight:600;color:var(--muted);font-size:0.9rem;">Ta réponse :</label>
      <div class="input-row">
        <input type="text" id="duel-qinput" placeholder="tape ta réponse ici" autocomplete="off" />
        ${q.inputSuffix ? `<span class="input-suffix">${q.inputSuffix}</span>` : ''}
      </div>
    </div>
    <button class="primary duel-next-btn" id="duel-btn-validate">Valider ma réponse</button>
  ` : `
    <div class="choices" id="duel-choices">
      ${q.choices.map((ch, i) => `
        <label class="choice" data-idx="${i}">
          <span class="letter">${String.fromCharCode(65 + i)}</span>
          <span class="content">${ch}</span>
        </label>
      `).join('')}
    </div>
  `;
  // Mini-jeu (affiché en haut, si actif) — vue lecture seule pendant la question
  const mgBlock = (duelState.miniGame && duelState.miniGame !== 'none' && duelState.miniGameState) ? `
    <div class="minigame-box">
      <h4>${duelState.miniGame === 'connect4' ? '🔴 Puissance 4' : '🏇 Course de pions'} — <span style="color:var(--duel-accent);">réponds juste pour jouer un coup</span></h4>
      ${duelState.miniGame === 'connect4' ? renderConnect4(duelState.miniGameState, null) : renderRace(duelState.miniGameState, duelState.players)}
    </div>` : '';

  container.innerHTML = `
    ${mgBlock}
    <div class="q-chip" style="color:${meta.color || 'var(--muted)'};">
      <span class="chip-icon" style="background:${meta.color || 'var(--muted)'};">${meta.icon || '?'}</span>
      ${themeLabel(q.theme)} · ${q.title}
    </div>
    <div class="q-body">${q.body}</div>
    ${answerBlock}
    <div id="duel-feedback"></div>
  `;
  renderMath(container);

  // Listeners
  if (isInput) {
    const inp = $('#duel-qinput');
    setTimeout(() => inp && inp.focus(), 80);
    $('#duel-btn-validate').addEventListener('click', () => handleDuelAnswer(q, { inputAnswer: inp.value }));
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); handleDuelAnswer(q, { inputAnswer: inp.value }); }
    });
  } else {
    $$('#duel-choices .choice').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.idx, 10);
        handleDuelAnswer(q, { selectedIdx: idx });
      });
    });
  }

  // Timer
  if (duelState.mode === 'fast') {
    $('#duel-timer').style.display = 'block';
    duelState.remaining = 15;
    $('#duel-timer').textContent = '15';
    $('#duel-timer').classList.remove('low');
    clearInterval(duelState.timer);
    duelState.timer = setInterval(() => {
      duelState.remaining--;
      $('#duel-timer').textContent = duelState.remaining;
      if (duelState.remaining <= 5) $('#duel-timer').classList.add('low');
      if (duelState.remaining <= 0) {
        clearInterval(duelState.timer);
        // Échec automatique
        handleDuelAnswer(q, { selectedIdx: null, inputAnswer: '', timeout: true });
      }
    }, 1000);
  } else {
    $('#duel-timer').style.display = 'none';
  }
}

function handleDuelAnswer(q, answer) {
  clearInterval(duelState.timer);
  const a = { selectedIdx: answer.selectedIdx ?? null, inputAnswer: answer.inputAnswer ?? '' };
  const correct = isAnswerCorrect(q, a);
  if (correct) duelState.scores[duelState.currentIdx]++;
  else duelState.wrongs[duelState.currentIdx]++;
  duelState.scoreHistory[duelState.currentIdx].push(duelState.scores[duelState.currentIdx]);

  // Bloquer les inputs
  const container = $('#duel-question-container');
  const choices = container.querySelectorAll('.choice');
  choices.forEach(c => {
    c.style.pointerEvents = 'none';
    const idx = parseInt(c.dataset.idx, 10);
    if (idx === q.correctIdx) c.classList.add('correct');
    else if (idx === a.selectedIdx) c.classList.add('wrong');
  });
  const inp = $('#duel-qinput');
  if (inp) inp.disabled = true;
  const validateBtn = $('#duel-btn-validate');
  if (validateBtn) validateBtn.style.display = 'none';

  // Feedback + bouton suivant
  const expectedShown = q.type === 'input' ? (Array.isArray(q.expected) ? q.expected[0] : q.expected) : '';
  const goodStr = q.type === 'input'
    ? `<code>${expectedShown}${q.inputSuffix ? ' ' + q.inputSuffix : ''}</code>`
    : `<strong>${String.fromCharCode(65 + q.correctIdx)}.</strong> ${q.choices[q.correctIdx]}`;
  const fb = $('#duel-feedback');
  if (correct) {
    fb.innerHTML = `<div class="duel-feedback ok">✓ Juste ! +1 point pour ${duelState.players[duelState.currentIdx].name}</div>`;
  } else {
    fb.innerHTML = `<div class="duel-feedback ko">✗ Faux. Bonne réponse : ${goodStr}</div>`;
  }
  renderMath(fb);

  // Passer au tour suivant (joueur suivant + question suivante)
  const btnNext = document.createElement('button');
  btnNext.className = 'primary duel-next-btn';
  btnNext.textContent = duelState.turn < duelState.nbQuestions * 2 - 1 ? 'Tour suivant →' : 'Voir les résultats';

  const nextTurn = () => {
    duelState.turn++;
    duelState.currentIdx = 1 - duelState.currentIdx;
    renderDuelTurn();
  };

  btnNext.addEventListener('click', () => {
    // Si mini-jeu actif ET bonne réponse : déclencher le coup avant passage au suivant
    if (correct && duelState.miniGame && duelState.miniGame !== 'none') {
      miniGamePlayMove(() => {
        // Vérifier victoire du mini-jeu
        miniGameCheckWinAndMaybeEnd(() => {
          nextTurn();
        });
      });
      return;
    }
    nextTurn();
  });
  container.appendChild(btnNext);
  renderDuelScoreboard();
}

/* ---------- Mode aller-retour : fin de manche ---------- */
function onHomeAwayRoundEnd() {
  // Sauvegarder les scores de la manche
  const round = duelState.round;
  const before = duelState.roundScores.reduce((acc, r) => [acc[0]+r[0], acc[1]+r[1]], [0,0]);
  const thisRound = [duelState.scores[0] - before[0], duelState.scores[1] - before[1]];
  duelState.roundScores.push(thisRound);

  const s1 = duelState.scores[0], s2 = duelState.scores[1];
  const nextRound = round === 'aller' ? 'retour' : (round === 'retour' && s1 === s2 ? 'belle' : null);

  if (!nextRound) {
    finishDuel();
    return;
  }

  // Transition : afficher un récap et bouton pour lancer la manche suivante
  showHomeAwayTransition(round, nextRound);
}

function showHomeAwayTransition(endedRound, nextRound) {
  const container = $('#duel-question-container');
  const [p1, p2] = duelState.players;
  const [s1, s2] = duelState.scores;
  const thisScores = duelState.roundScores[duelState.roundScores.length - 1];
  const nextLabel = nextRound === 'retour' ? 'Match retour' : 'Belle (thèmes mélangés)';
  const nextChooser = nextRound === 'retour' ? p2.name : 'aucun joueur';
  const nextThemes = nextRound === 'retour' ? duelState.themesP2 :
    (nextRound === 'belle' ? Object.keys(QUESTION_BANK) : duelState.themesP1);

  container.innerHTML = `
    <div style="text-align:center;padding:20px 10px;">
      <div style="font-size:0.9rem;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">
        Fin du match ${endedRound}
      </div>
      <div style="font-size:1.8rem;font-weight:800;margin:10px 0;">
        ${s1} <span style="opacity:0.6;">vs</span> ${s2}
      </div>
      <div style="color:var(--muted);font-size:0.9rem;">
        (Manche : ${thisScores[0]}–${thisScores[1]})
      </div>
      <div style="margin:20px 0;padding:14px;background:var(--bg-elev-2);border-radius:10px;">
        <div style="font-weight:700;margin-bottom:6px;">🏟 Place au <strong>${nextLabel}</strong></div>
        <div style="font-size:0.9rem;color:var(--muted);">
          ${nextRound === 'retour'
            ? `Thèmes à domicile de <strong>${p2.name}</strong> : ${duelState.themesP2.map(t => (THEME_META[t]||{}).short||t).join(', ')}`
            : `Égalité ${s1}–${s2} ! Manche décisive avec <strong>tous les thèmes mélangés</strong>.`}
        </div>
      </div>
      <button class="primary big-btn" id="btn-next-round">Lancer ${nextRound === 'retour' ? 'le match retour' : 'la belle'} →</button>
    </div>
  `;

  $('#btn-next-round').addEventListener('click', () => {
    duelState.round = nextRound;
    duelState.turn = 0;
    // Swap qui commence (le joueur à domicile commence la manche ? ou l'inverse ?)
    // Par souci de fair-play : joueur visiteur commence (répond en premier chez l'autre)
    duelState.currentIdx = nextRound === 'retour' ? 0 : (Math.random() < 0.5 ? 0 : 1);
    // Pour la belle, réduire un peu : nbQ de la belle = max(3, nbQ - 2)
    // Mais pour rester simple, on garde le même nbQ
    // Regénérer les questions selon la manche, avec filtre mobile si actif
    function buildPoolFromThemes(themes, n) {
      const gens = themes.flatMap(t => (QUESTION_BANK[t] || []).slice());
      const sh = shuffle(gens);
      const res = []; let i = 0, tries = 0;
      const maxTries = Math.max(n * 20, 100);
      while (res.length < n && tries < maxTries) {
        if (i >= sh.length) i = 0;
        const g = sh[i++]; tries++;
        const q = g();
        if (duelState.mobileOnly && !isMobileFriendly(q)) continue;
        q._genName = g.name;
        res.push(q);
      }
      while (res.length < n) { const g = sh[res.length % sh.length]; const q = g(); q._genName = g.name; res.push(q); }
      return res;
    }
    let roundThemes;
    if (nextRound === 'retour') roundThemes = duelState.themesP2;
    else roundThemes = Object.keys(QUESTION_BANK);
    // Belle plus courte : nbQBelle = 3 (ou nbQ si nbQ < 3)
    const nbBelleQ = nextRound === 'belle' ? Math.min(3, duelState.nbQuestions) : duelState.nbQuestions;
    duelState.nbQuestionsRound = nbBelleQ;
    // Temporairement : recalculer par rapport à cette manche
    const needed = nbBelleQ * 2;
    const pool = buildPoolFromThemes(roundThemes, needed);
    duelState.questions = pool;
    // Ajuster aussi nbQuestions pour le renderDuelTurn (qui utilise nbQuestions pour fin de manche)
    if (nextRound === 'belle') duelState.nbQuestions = nbBelleQ;
    renderDuelScoreboard();
    renderDuelTurn();
  });
  // Mettre à jour scoreboard (hors question)
  renderDuelScoreboard();
  // Masquer timer
  $('#duel-timer').style.display = 'none';
}

/* ---------- Fin de duel → calcul XP, badges, sauvegarde ---------- */
function finishDuel() {
  clearInterval(duelState.timer);
  const [s1, s2] = duelState.scores;
  const [p1, p2] = duelState.players;
  const winnerIdx = s1 === s2 ? -1 : (s1 > s2 ? 0 : 1);
  const winner = winnerIdx >= 0 ? duelState.players[winnerIdx] : null;
  const loser  = winnerIdx >= 0 ? duelState.players[1 - winnerIdx] : null;

  // Calcul XP
  const gains = [0, 0];
  const details = [[], []];
  for (let i = 0; i < 2; i++) {
    const isWinner = winnerIdx === i;
    const isDraw = winnerIdx === -1;
    if (isDraw) { gains[i] = 25; details[i].push('+25 XP égalité'); }
    else if (isWinner) { gains[i] = 50; details[i].push('+50 XP victoire'); }
    else { gains[i] = 10; details[i].push('+10 XP participation'); }

    if (isWinner && duelState.wrongs[i] === 0) { gains[i] += 30; details[i].push('+30 XP sans faute'); }
    if (isWinner && duelState.mode === 'fast') { gains[i] += 20; details[i].push('+20 XP mode rapide'); }
    const ecart = Math.abs(s1 - s2);
    if (isWinner && ecart >= Math.ceil(duelState.nbQuestions * 0.6)) { gains[i] += 15; details[i].push('+15 XP écart important'); }
  }

  // Update profils + détection badges débloqués
  const unlocked = [[], []];
  for (let i = 0; i < 2; i++) {
    const p = duelState.players[i];
    updateProfile(p.name, profile => {
      profile.xp += gains[i];
      profile.duels++;
      if (winnerIdx === -1) profile.draws++;
      else if (winnerIdx === i) { profile.wins++; profile.streak++; profile.bestStreak = Math.max(profile.bestStreak, profile.streak); }
      else { profile.losses++; profile.streak = 0; }
      if (winnerIdx === i && !profile.themesWon.includes(duelState.theme) && duelState.theme !== 'all') {
        profile.themesWon.push(duelState.theme);
      }
      profile.lastMatch = new Date().toISOString();

      // Badges
      const checkAndUnlock = (key, cond) => {
        if (cond && !profile.badges.includes(key)) { profile.badges.push(key); unlocked[i].push(key); }
      };
      checkAndUnlock('first_win', profile.wins >= 1 && winnerIdx === i);
      checkAndUnlock('no_miss', winnerIdx === i && duelState.wrongs[i] === 0);
      // Comeback : détection dans scoreHistory (a été mené à un moment puis a gagné)
      if (winnerIdx === i) {
        const hist = duelState.scoreHistory;
        const wasBehind = hist[i].some((v, k) => hist[1-i][k] !== undefined && v < hist[1-i][k]);
        checkAndUnlock('comeback', wasBehind);
      }
      checkAndUnlock('speed', winnerIdx === i && duelState.mode === 'fast');
      checkAndUnlock('serial3', profile.bestStreak >= 3);
      checkAndUnlock('serial5', profile.bestStreak >= 5);
      checkAndUnlock('duel10', profile.duels >= 10);
      checkAndUnlock('perfect', winnerIdx === i && duelState.wrongs[1-i] === duelState.nbQuestions);
      checkAndUnlock('polymath', profile.themesWon.length >= 5);
    });
  }

  // Sauvegarder le match
  const matches = loadMatches();
  matches.unshift({
    date: new Date().toISOString(),
    players: [p1.name, p2.name],
    scores: [s1, s2],
    winner: winner ? winner.name : null,
    theme: duelState.theme,
    nbQuestions: duelState.nbQuestions,
    mode: duelState.mode,
    gains, unlocked
  });
  saveMatches(matches);

  renderDuelResults({ gains, unlocked, winnerIdx });
}

function renderDuelResults({ gains, unlocked, winnerIdx }) {
  const [p1, p2] = duelState.players;
  const [s1, s2] = duelState.scores;
  const winner = winnerIdx >= 0 ? duelState.players[winnerIdx] : null;

  const box = $('#duel-results-content');
  const prof1 = getOrCreateProfile(p1.name);
  const prof2 = getOrCreateProfile(p2.name);
  const lvl1 = computeLevel(prof1.xp);
  const lvl2 = computeLevel(prof2.xp);

  const gainCard = (pi) => {
    const p = duelState.players[pi];
    const prof = pi === 0 ? prof1 : prof2;
    const lvl = pi === 0 ? lvl1 : lvl2;
    const newBadges = unlocked[pi];
    const gain = gains[pi];
    const color = p.color;
    const xpPct = lvl.next ? Math.round(100 * (prof.xp - lvl.lvl.xp) / (lvl.next.xp - lvl.lvl.xp)) : 100;
    return `
      <div class="duel-gain-card" style="border-left-color:${color};">
        <div class="name">
          <div class="duel-avatar-mini" style="background:linear-gradient(135deg,${color} 0%,${avatarColor(p.name+'_')} 100%);">${p.initial}</div>
          ${p.name}
          <span class="level-name" style="margin-left:auto;">${lvl.lvl.name}</span>
        </div>
        <div class="duel-gain-list">
          ${details_for(pi, gains).map(d => '• ' + d).join('<br>')}
        </div>
        <div style="margin-top:10px;">
          <div class="level-info"><span>Niv ${lvl.idx+1} — ${prof.xp} XP</span><span>${lvl.next ? lvl.next.name + ' : ' + lvl.next.xp + ' XP' : 'MAX'}</span></div>
          <div class="level-bar"><div class="level-fill" style="width:${xpPct}%;"></div></div>
        </div>
        ${newBadges.length ? `
          <div class="duel-new-badges">
            ${newBadges.map(b => `<div class="badge-card"><span class="emoji">${BADGES[b].icon}</span>${BADGES[b].title}</div>`).join('')}
          </div>` : ''}
      </div>
    `;
  };

  // Couleur du pion/avatar du vainqueur (fixe si mini-jeu, sinon avatar)
  const useFixed = duelState.miniGame === 'connect4' || duelState.miniGame === 'race';
  const fixedColors = [
    { main: '#3b82f6', dark: '#1e40af' },
    { main: '#f59e0b', dark: '#b45309' }
  ];
  const wColor = winner ? (useFixed ? fixedColors[winnerIdx] : { main: winner.color, dark: avatarColor(winner.name+'_') }) : null;
  const pionSvg = wColor
    ? `<span style="display:inline-block;width:48px;height:48px;border-radius:50%;background:radial-gradient(circle at 35% 35%,${wColor.main} 0%,${wColor.dark} 100%);box-shadow:0 4px 12px rgba(0,0,0,0.35),inset -3px -4px 6px rgba(0,0,0,0.15);vertical-align:middle;margin-right:14px;"></span>`
    : '';
  box.innerHTML = `
    <div class="duel-podium">
      <div class="duel-podium-title">${winner ? 'Vainqueur' : 'Match nul'}</div>
      <div class="duel-podium-winner">${pionSvg}${winner ? winner.name : 'Égalité'}</div>
      <div class="duel-podium-score">${s1} <span style="opacity:0.7;">vs</span> ${s2}</div>
    </div>

    <h3 style="margin-top:20px;">Gains de la partie</h3>
    ${gainCard(0)}
    ${gainCard(1)}

    <div class="actions">
      <button class="primary" id="btn-duel-rematch">🔁 Revanche</button>
      <button class="ghost" id="btn-duel-new">⚔ Nouveau duel</button>
      <button class="ghost" id="btn-duel-home">Accueil</button>
    </div>
  `;

  $('#btn-duel-rematch').addEventListener('click', () => {
    // Même joueurs + mêmes thèmes → nouvelle partie
    duelState.currentIdx = 1 - duelState.currentIdx;
    function rebuild(themes, n) {
      const gens = themes.flatMap(t => (QUESTION_BANK[t] || []).slice());
      const sh = shuffle(gens);
      const res = []; let i = 0, tries = 0;
      const maxTries = Math.max(n * 20, 100);
      while (res.length < n && tries < maxTries) {
        if (i >= sh.length) i = 0;
        const g = sh[i++]; tries++;
        const q = g();
        if (duelState.mobileOnly && !isMobileFriendly(q)) continue;
        q._genName = g.name;
        res.push(q);
      }
      while (res.length < n) { const g = sh[res.length % sh.length]; const q = g(); q._genName = g.name; res.push(q); }
      return res;
    }
    const poolP1 = rebuild(duelState.themesP1, duelState.nbQuestions);
    const poolP2 = rebuild(duelState.themesP2, duelState.nbQuestions);
    const qs = [];
    for (let t = 0; t < duelState.nbQuestions * 2; t++) {
      qs.push(t % 2 === 0 ? poolP1[Math.floor(t/2)] : poolP2[Math.floor(t/2)]);
    }
    duelState.questions = qs;
    duelState.scores = [0, 0];
    duelState.wrongs = [0, 0];
    duelState.scoreHistory = [[0], [0]];
    duelState.turn = 0;
    renderDuelScoreboard();
    showScreen('screen-duel');
    renderDuelTurn();
  });
  $('#btn-duel-new').addEventListener('click', () => { showScreen('screen-home'); document.querySelector('[data-target=tab-duel]').click(); });
  $('#btn-duel-home').addEventListener('click', () => showScreen('screen-home'));

  showScreen('screen-duel-results');
}

function details_for(pi, gains) {
  // Re-construire la liste de détails (déjà faite dans finishDuel, mais pas exposée)
  // Simplifié : on affiche juste +X XP gagnés
  const [s1, s2] = duelState.scores;
  const winnerIdx = s1 === s2 ? -1 : (s1 > s2 ? 0 : 1);
  const lines = [];
  if (winnerIdx === -1) lines.push(`+25 XP (égalité)`);
  else if (winnerIdx === pi) lines.push(`+50 XP (victoire)`);
  else lines.push(`+10 XP (participation)`);
  if (winnerIdx === pi && duelState.wrongs[pi] === 0) lines.push(`+30 XP (sans faute)`);
  if (winnerIdx === pi && duelState.mode === 'fast') lines.push(`+20 XP (mode rapide)`);
  const ecart = Math.abs(s1 - s2);
  if (winnerIdx === pi && ecart >= Math.ceil(duelState.nbQuestions * 0.6)) lines.push(`+15 XP (écart important)`);
  lines.push(`<strong>Total : +${gains[pi]} XP</strong>`);
  return lines;
}

/* ---------- Profils & classement ---------- */
function renderDuelProfiles() {
  const players = loadPlayers();
  const matches = loadMatches();

  // Classement (par wins desc, puis XP desc)
  const ranked = Object.values(players).sort((a, b) => b.wins - a.wins || b.xp - a.xp);
  const rankingBox = $('#duel-ranking');
  if (!ranked.length) {
    rankingBox.innerHTML = '<p class="note">Aucun duel joué pour l\'instant. Lance-toi !</p>';
  } else {
    rankingBox.innerHTML = ranked.slice(0, 10).map((p, i) => {
      const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const rankIcon = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (i+1) + '.';
      return `<div class="ranking-row">
        <span class="rank ${rankClass}">${rankIcon}</span>
        <span class="name">${p.name}</span>
        <span class="stats">${p.wins}V / ${p.losses}D · ${p.xp} XP</span>
      </div>`;
    }).join('');
  }

  // Profils détaillés
  const profBox = $('#duel-profiles');
  if (!ranked.length) {
    profBox.innerHTML = '';
    return;
  }
  profBox.innerHTML = ranked.map(p => {
    const lvl = computeLevel(p.xp);
    const xpPct = lvl.next ? Math.round(100 * (p.xp - lvl.lvl.xp) / (lvl.next.xp - lvl.lvl.xp)) : 100;
    const badgesHtml = Object.keys(BADGES).map(key => {
      const has = p.badges.includes(key);
      return `<div class="badge-mini ${has ? '' : 'locked'}" title="${BADGES[key].title} — ${BADGES[key].desc}">${BADGES[key].icon}</div>`;
    }).join('');
    const color = avatarColor(p.name);
    return `<div class="duel-profile-card">
      <div class="duel-profile-head">
        <div class="duel-avatar-mini" style="background:linear-gradient(135deg,${color} 0%,${avatarColor(p.name+'_')} 100%);">${avatarInitial(p.name)}</div>
        <div class="name">${p.name}</div>
        <span class="level-name">${lvl.lvl.name}</span>
      </div>
      <div class="level-info"><span>Niv ${lvl.idx+1} — ${p.xp} XP</span><span>${lvl.next ? lvl.next.xp + ' XP' : 'MAX'}</span></div>
      <div class="level-bar"><div class="level-fill" style="width:${xpPct}%;"></div></div>
      <div class="duel-profile-stats">
        <div class="duel-stat-box"><div class="val">${p.duels}</div><div class="lab">duels</div></div>
        <div class="duel-stat-box"><div class="val">${p.wins}</div><div class="lab">victoires</div></div>
        <div class="duel-stat-box"><div class="val">${p.bestStreak}</div><div class="lab">meilleure série</div></div>
      </div>
      <div class="duel-profile-badges">${badgesHtml}</div>
    </div>`;
  }).join('');
}

/* ==========================================================================
   EXERCICES DE RÉDACTION (glisser-déposer / tap-to-place)
   ==========================================================================
   Chaque exercice : template HTML avec {n} = emplacement numéroté.
   Pool = liste de tags à placer (correct + distracteurs).
   Validation : comparer chaque blank à sa valeur "correct".
   ========================================================================== */

const REDACTIONS = {
  pythagore_direct: {
    title: "Pythagore — calculer la longueur d'un côté",
    context: "Le triangle ABC est rectangle en A avec AB = 3 cm et AC = 4 cm. On veut calculer la longueur BC.",
    template: `Dans le triangle ABC rectangle en {1}, d'après le théorème de {2} :<br>
{3}² = {4}² + {5}² = 3² + 4² = 9 + 16 = 25<br>
Donc BC = √25 = <strong>{6} cm</strong>.`,
    blanks: [
      { id: 1, correct: 'A' },
      { id: 2, correct: 'Pythagore' },
      { id: 3, correct: 'BC' },
      { id: 4, correct: 'AB' },
      { id: 5, correct: 'AC' },
      { id: 6, correct: '5' }
    ],
    pool: ['A', 'B', 'C', 'Pythagore', 'Thalès', 'BC', 'AB', 'AC', '5', '25', '7']
  },

  pythagore_reciproque_vrai: {
    title: "Réciproque de Pythagore — triangle rectangle (vrai)",
    context: "Un triangle ABC a pour côtés AB = 3 cm, AC = 4 cm et BC = 5 cm. Est-il rectangle ?",
    template: `D'une part : {1}² = 5² = <strong>25</strong>.<br>
D'autre part : {2}² + {3}² = 3² + 4² = 9 + 16 = <strong>25</strong>.<br>
On constate que <strong>BC² {4} AB² + AC²</strong>.<br>
Donc d'après la {5} du théorème de Pythagore,<br>
le triangle ABC est <strong>rectangle en {6}</strong>.`,
    blanks: [
      { id: 1, correct: 'BC' },
      { id: 2, correct: 'AB' },
      { id: 3, correct: 'AC' },
      { id: 4, correct: '=' },
      { id: 5, correct: 'réciproque' },
      { id: 6, correct: 'A' }
    ],
    pool: ['BC', 'AB', 'AC', 'A', 'B', 'C', '=', '≠', 'réciproque', 'contraposée', 'énoncé']
  },

  pythagore_reciproque_faux: {
    title: "Réciproque de Pythagore — triangle non rectangle (faux)",
    context: "Un triangle ABC a pour côtés AB = 4 cm, AC = 5 cm et BC = 7 cm. Est-il rectangle ?",
    template: `D'une part : {1}² = 7² = <strong>49</strong>.<br>
D'autre part : AB² + AC² = 4² + 5² = 16 + 25 = <strong>41</strong>.<br>
On constate que <strong>BC² {2} AB² + AC²</strong>.<br>
Donc d'après la {3} du théorème de Pythagore,<br>
le triangle ABC <strong>{4} rectangle</strong>.`,
    blanks: [
      { id: 1, correct: 'BC' },
      { id: 2, correct: '≠' },
      { id: 3, correct: 'contraposée' },
      { id: 4, correct: "n'est pas" }
    ],
    pool: ['BC', 'AB', 'AC', '=', '≠', 'réciproque', 'contraposée', 'est', "n'est pas"]
  },

  thales_direct: {
    title: "Thalès — calculer une longueur",
    context: "Sur la figure, (MN)//(BC) avec AM = 2, AB = 6, AN = 3. On cherche AC.",
    template: `Les points A, M, B sont alignés et A, N, C sont alignés.<br>
Les droites (MN) et {1} sont parallèles.<br>
D'après le théorème de {2} :<br>
<span style="font-size:1.1em;">AM / {3} = AN / {4} = MN / BC</span><br>
Donc : 2 / 6 = 3 / {5}<br>
D'où AC = <strong>{6}</strong> (par produit en croix).`,
    blanks: [
      { id: 1, correct: '(BC)' },
      { id: 2, correct: 'Thalès' },
      { id: 3, correct: 'AB' },
      { id: 4, correct: 'AC' },
      { id: 5, correct: 'AC' },
      { id: 6, correct: '9' }
    ],
    pool: ['(BC)', '(MN)', 'Thalès', 'Pythagore', 'AB', 'AC', 'BC', '9', '6', '4']
  },

  thales_reciproque_vrai: {
    title: "Réciproque de Thalès — droites parallèles (vrai)",
    context: "A, M, B alignés dans cet ordre. A, N, C alignés. AM = 2, AB = 6, AN = 3, AC = 9. (MN) et (BC) sont-elles parallèles ?",
    template: `D'une part : AM / AB = {1} / {2} = <strong>1/3</strong>.<br>
D'autre part : AN / AC = {3} / {4} = <strong>1/3</strong>.<br>
On constate que <strong>AM/AB {5} AN/AC</strong>, et les points sont dans le même ordre.<br>
Donc d'après la {6} du théorème de Thalès,<br>
les droites (MN) et (BC) sont <strong>{7}</strong>.`,
    blanks: [
      { id: 1, correct: '2' },
      { id: 2, correct: '6' },
      { id: 3, correct: '3' },
      { id: 4, correct: '9' },
      { id: 5, correct: '=' },
      { id: 6, correct: 'réciproque' },
      { id: 7, correct: 'parallèles' }
    ],
    pool: ['2', '3', '6', '9', '=', '≠', 'réciproque', 'théorème', 'parallèles', 'sécantes', 'confondues']
  },

  thales_reciproque_faux: {
    title: "Réciproque de Thalès — droites non parallèles (faux)",
    context: "A, M, B alignés. A, N, C alignés. AM = 2, AB = 5, AN = 3, AC = 8. (MN) et (BC) sont-elles parallèles ?",
    template: `D'une part : AM / AB = 2 / 5 = <strong>0,4</strong>.<br>
D'autre part : AN / AC = 3 / 8 = <strong>0,375</strong>.<br>
On constate que <strong>AM/AB {1} AN/AC</strong>.<br>
Donc d'après la {2} du théorème de Thalès,<br>
les droites (MN) et (BC) <strong>{3} parallèles</strong>.`,
    blanks: [
      { id: 1, correct: '≠' },
      { id: 2, correct: 'contraposée' },
      { id: 3, correct: "ne sont pas" }
    ],
    pool: ['=', '≠', 'réciproque', 'contraposée', 'sont', "ne sont pas"]
  },

  trigo_cote: {
    title: "Trigonométrie — calculer un côté",
    context: "Dans un triangle ABC rectangle en A, on connaît l'angle ABC = 35° et BC = 10 cm. On cherche AB.",
    template: `Dans le triangle ABC rectangle en {1}, pour l'angle en B :<br>
• côté adjacent à B : <strong>{2}</strong><br>
• hypoténuse : <strong>{3}</strong><br>
On connaît l'hypoténuse, on cherche l'adjacent → on utilise {4}.<br>
{4}(B̂) = adjacent / hypoténuse = {5} / {6}<br>
Donc AB = BC × {4}(35°) ≈ 10 × 0,82 ≈ <em>8,2 cm</em>.`,
    blanks: [
      { id: 1, correct: 'A' },
      { id: 2, correct: 'AB' },
      { id: 3, correct: 'BC' },
      { id: 4, correct: 'cos' },
      { id: 5, correct: 'AB' },
      { id: 6, correct: 'BC' }
    ],
    pool: ['A', 'B', 'C', 'AB', 'AC', 'BC', 'cos', 'sin', 'tan']
  },

  triangles_semblables: {
    title: "Triangles semblables — rédaction",
    context: "Les triangles ABC et A'B'C' ont AB = 3, BC = 4 et A'B' = 6, B'C' = 8.",
    template: `On compare les rapports :<br>
A'B' / AB = {1} / {2} = <strong>2</strong><br>
B'C' / BC = {3} / {4} = <strong>2</strong><br>
On constate que les côtés correspondants sont <strong>{5}</strong>.<br>
Donc les triangles ABC et A'B'C' sont <strong>{6}</strong>,<br>
avec un rapport de similitude égal à <strong>{7}</strong>.`,
    blanks: [
      { id: 1, correct: '6' },
      { id: 2, correct: '3' },
      { id: 3, correct: '8' },
      { id: 4, correct: '4' },
      { id: 5, correct: 'proportionnels' },
      { id: 6, correct: 'semblables' },
      { id: 7, correct: '2' }
    ],
    pool: ['3', '4', '6', '8', '2', 'proportionnels', 'égaux', 'semblables', 'isocèles', 'rectangles']
  }
};

/* État de l'exercice en cours */
let redactionState = null;

function openRedaction(key) {
  const ex = REDACTIONS[key];
  if (!ex) return;

  // Initialiser l'état : chaque blank commence vide
  redactionState = {
    key,
    ex,
    filled: Object.fromEntries(ex.blanks.map(b => [b.id, null])), // { 1: 'A', 2: null, ... }
    selectedTag: null,         // tag cliqué en attente de placement
    selectedBlank: null,       // blank cliqué en attente
    validated: false
  };

  const modal = document.createElement('div');
  modal.className = 'modal-backdrop redaction-modal';
  modal.innerHTML = `
    <div class="modal">
      <h3>✍️ ${ex.title}</h3>
      <div class="redaction-context">${ex.context}</div>
      <div class="redaction-phrase" id="redaction-phrase"></div>
      <div class="redaction-pool" id="redaction-pool">
        <div class="redaction-pool-title">Étiquettes à placer — clique sur une étiquette puis sur un emplacement</div>
      </div>
      <div id="redaction-score-zone"></div>
      <div class="redaction-actions">
        <button class="ghost" id="btn-redaction-reset">🔄 Effacer</button>
        <button class="ghost" id="btn-redaction-close">Fermer</button>
        <button class="primary" id="btn-redaction-validate">✓ Valider</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  renderRedactionPhrase();
  renderRedactionPool();

  $('#btn-redaction-close').addEventListener('click', () => modal.remove());
  $('#btn-redaction-reset').addEventListener('click', () => {
    ex.blanks.forEach(b => redactionState.filled[b.id] = null);
    redactionState.selectedTag = null;
    redactionState.validated = false;
    $('#redaction-score-zone').innerHTML = '';
    renderRedactionPhrase();
    renderRedactionPool();
  });
  $('#btn-redaction-validate').addEventListener('click', validateRedaction);
}

function renderRedactionPhrase() {
  const { ex, filled, validated } = redactionState;
  let html = ex.template;
  ex.blanks.forEach(b => {
    const val = filled[b.id];
    let cls = 'blank';
    if (val) cls += ' filled';
    if (validated) cls += ' ' + (isBlankCorrect(b) ? 'correct' : 'wrong');
    // split/join pour remplacer TOUTES les occurrences du placeholder {id}
    // (utile quand un même emplacement apparaît plusieurs fois dans la rédaction)
    html = html.split(`{${b.id}}`).join(
      `<span class="${cls}" data-blank-id="${b.id}">${val || '?'}</span>`);
  });
  $('#redaction-phrase').innerHTML = html;
  $('#redaction-phrase').querySelectorAll('.blank').forEach(b => {
    b.addEventListener('click', () => {
      const id = parseInt(b.dataset.blankId, 10);
      if (redactionState.validated) return;
      if (redactionState.selectedTag) {
        // Placer le tag sélectionné
        redactionState.filled[id] = redactionState.selectedTag;
        redactionState.selectedTag = null;
        renderRedactionPhrase();
        renderRedactionPool();
      } else if (redactionState.filled[id]) {
        // Vider un blank déjà rempli
        redactionState.filled[id] = null;
        renderRedactionPhrase();
        renderRedactionPool();
      }
    });
  });
}

function isBlankCorrect(b) {
  const val = redactionState.filled[b.id];
  if (!val) return false;
  const correct = b.correct;
  if (Array.isArray(correct)) return correct.includes(val);
  return val === correct;
}

function renderRedactionPool() {
  const { ex, selectedTag } = redactionState;
  const poolEl = $('#redaction-pool');
  poolEl.innerHTML = '<div class="redaction-pool-title">Étiquettes à placer — clique sur une étiquette puis sur un emplacement</div>' +
    ex.pool.map(tag => {
      const isSelected = selectedTag === tag;
      return `<button class="redaction-tag ${isSelected ? 'selected' : ''}" data-tag="${tag}">${tag}</button>`;
    }).join('');
  poolEl.querySelectorAll('.redaction-tag').forEach(t => {
    t.addEventListener('click', () => {
      if (redactionState.validated) return;
      const tag = t.dataset.tag;
      redactionState.selectedTag = redactionState.selectedTag === tag ? null : tag;
      renderRedactionPool();
    });
  });
}

function validateRedaction() {
  redactionState.validated = true;
  const { ex, filled } = redactionState;
  const nbTotal = ex.blanks.length;
  const nbCorrect = ex.blanks.filter(b => isBlankCorrect(b)).length;
  const cls = nbCorrect === nbTotal ? 'perfect' : (nbCorrect >= nbTotal * 0.6 ? 'ok' : 'ko');
  const msg = nbCorrect === nbTotal
    ? `🎉 Parfait ! ${nbCorrect}/${nbTotal} — rédaction sans faute.`
    : `${nbCorrect}/${nbTotal} étiquettes correctes. Les verts sont justes, les rouges à revoir.`;
  $('#redaction-score-zone').innerHTML = `<div class="redaction-score ${cls}">${msg}</div>`;
  renderRedactionPhrase();
}

/* ==========================================================================
   MINI-JEUX : Puissance 4 + Course de pions
   ========================================================================== */

/* ---------- PUISSANCE 4 ---------- */
function c4_init() {
  // 6 lignes x 7 colonnes, null = vide, 0 = J1, 1 = J2
  return {
    grid: Array.from({length: 6}, () => Array(7).fill(null)),
    winner: null,
    winningLine: null
  };
}

function c4_drop(state, col, playerIdx) {
  for (let r = 5; r >= 0; r--) {
    if (state.grid[r][col] === null) {
      state.grid[r][col] = playerIdx;
      const win = c4_checkWin(state.grid, r, col, playerIdx);
      if (win) {
        state.winner = playerIdx;
        state.winningLine = win;
      }
      return { row: r };
    }
  }
  return null; // colonne pleine
}

function c4_checkWin(grid, r, c, p) {
  const dirs = [[0,1],[1,0],[1,1],[1,-1]];
  for (const [dr, dc] of dirs) {
    const line = [[r,c]];
    // Dans un sens
    let rr = r + dr, cc = c + dc;
    while (rr>=0 && rr<6 && cc>=0 && cc<7 && grid[rr][cc] === p) {
      line.push([rr,cc]);
      rr += dr; cc += dc;
    }
    // Sens opposé
    rr = r - dr; cc = c - dc;
    while (rr>=0 && rr<6 && cc>=0 && cc<7 && grid[rr][cc] === p) {
      line.unshift([rr,cc]);
      rr -= dr; cc -= dc;
    }
    if (line.length >= 4) return line.slice(0, 4);
  }
  return null;
}

function c4_isFull(state) {
  return state.grid[0].every(v => v !== null);
}

function c4_canPlay(state, col) {
  return state.grid[0][col] === null;
}

function renderConnect4(state, interactiveForPlayerIdx) {
  const winSet = new Set((state.winningLine || []).map(p => p.join(',')));
  let arrows = '<div class="c4-arrows">';
  for (let c = 0; c < 7; c++) {
    const playable = c4_canPlay(state, c);
    const active = interactiveForPlayerIdx != null && playable && state.winner === null;
    arrows += `<div class="c4-arrow ${active ? 'active' : ''} ${!playable ? 'disabled' : ''}" data-col="${c}">↓</div>`;
  }
  arrows += '</div>';
  let grid = '<div class="c4-grid">';
  for (let c = 0; c < 7; c++) {
    const playable = c4_canPlay(state, c) && interactiveForPlayerIdx != null && state.winner === null;
    grid += `<div class="c4-col ${playable ? 'playable' : ''} ${!c4_canPlay(state, c) ? 'full' : ''}" data-col="${c}">`;
    for (let r = 0; r < 6; r++) {
      const val = state.grid[r][c];
      const cls = val === 0 ? 'p1' : val === 1 ? 'p2' : '';
      const winning = winSet.has(`${r},${c}`);
      grid += `<div class="c4-cell ${cls} ${winning ? 'winning' : ''}"></div>`;
    }
    grid += '</div>';
  }
  grid += '</div>';
  return arrows + grid;
}

/* ---------- COURSE DE PIONS ---------- */
function race_init() {
  // 12 cases + ligne arrivée (case 12)
  // Générer des bonus (+1) et malus (-1) aléatoires entre case 2 et 10
  const specials = {};
  const positions = shuffle([2,3,4,5,6,7,8,9,10]);
  specials[positions[0]] = 'bonus';
  specials[positions[1]] = 'bonus';
  specials[positions[2]] = 'malus';
  specials[positions[3]] = 'malus';
  return {
    positions: [0, 0], // position de chaque joueur
    specials,          // {case: 'bonus'|'malus'}
    winner: null,
    finishLine: 12
  };
}

function race_advance(state, playerIdx, steps) {
  state.positions[playerIdx] = Math.min(state.finishLine, state.positions[playerIdx] + steps);
  // Déclencher case spéciale
  const cell = state.positions[playerIdx];
  let bonus = 0;
  if (state.specials[cell] === 'bonus') {
    bonus = 1;
    state.positions[playerIdx] = Math.min(state.finishLine, state.positions[playerIdx] + 1);
  } else if (state.specials[cell] === 'malus') {
    bonus = -1;
    state.positions[playerIdx] = Math.max(0, state.positions[playerIdx] - 1);
  }
  if (state.positions[playerIdx] >= state.finishLine) {
    state.winner = playerIdx;
  }
  return { bonus };
}

function renderRace(state, players) {
  let html = '<div class="race-track"><div class="race-lanes">';
  for (let p = 0; p < 2; p++) {
    html += `<div class="race-lane"><span class="race-label p${p+1}">${players[p].name}</span>`;
    for (let i = 1; i <= 12; i++) {
      const special = state.specials[i] || '';
      const isFinish = i === 12 ? 'finish' : '';
      const hasPawn = state.positions[p] === i;
      html += `<div class="race-cell ${special} ${isFinish}">${hasPawn ? `<div class="race-pawn p${p+1}"></div>` : ''}</div>`;
    }
    html += `<span class="race-label p${p+1}">🏁</span></div>`;
  }
  html += '</div></div>';
  return html;
}

/* ---------- Intégration mini-jeu dans le flow duel ---------- */
function initMiniGame() {
  if (duelState.miniGame === 'connect4') duelState.miniGameState = c4_init();
  else if (duelState.miniGame === 'race') duelState.miniGameState = race_init();
  else duelState.miniGameState = null;
}

/* Appelé APRÈS une bonne réponse du joueur currentIdx.
   Pour Puissance 4 : demande au joueur de choisir une colonne.
   Pour Course : avance automatiquement.
   Appelle onDone() quand le coup est joué (ou immédiatement pour race). */
function miniGamePlayMove(onDone) {
  const pIdx = duelState.currentIdx;
  const state = duelState.miniGameState;
  if (duelState.miniGame === 'connect4') {
    // Afficher grille interactive + message très visible
    const container = $('#duel-question-container');
    const pionColor = pIdx === 0 ? '#3b82f6' : '#f59e0b';
    const pionColorDark = pIdx === 0 ? '#1e40af' : '#b45309';
    const pionSvg = `<span style="display:inline-block;width:28px;height:28px;border-radius:50%;background:radial-gradient(circle at 35% 35%,${pionColor} 0%,${pionColorDark} 100%);box-shadow:0 2px 4px rgba(0,0,0,0.25);vertical-align:middle;margin-right:8px;"></span>`;
    container.innerHTML = `
      <div style="background:linear-gradient(90deg, ${pionColor} 0%, ${pionColorDark} 100%);color:white;padding:14px 18px;border-radius:12px;margin-bottom:14px;text-align:center;font-weight:700;font-size:1.05rem;box-shadow:0 4px 12px ${pionColor}55;">
        ${pionSvg}✓ Bonne réponse ! ${duelState.players[pIdx].name}, place ton pion dans la colonne de ton choix ↓
      </div>
      <div class="minigame-box">
        ${renderConnect4(state, pIdx)}
      </div>
    `;
    container.querySelectorAll('.c4-col.playable, .c4-arrow.active').forEach(el => {
      el.addEventListener('click', () => {
        const col = parseInt(el.dataset.col, 10);
        if (!c4_canPlay(state, col)) return;
        c4_drop(state, col, pIdx);
        // Re-render (non interactif, pour voir le pion posé)
        container.innerHTML = `
          <div class="minigame-box">
            <h4>🔴 Puissance 4</h4>
            ${renderConnect4(state, null)}
          </div>
        `;
        setTimeout(onDone, 500);
      });
    });
  } else if (duelState.miniGame === 'race') {
    const result = race_advance(state, pIdx, 1);
    const bonusMsg = result.bonus === 1 ? ` <strong>+1 bonus !</strong>`
      : result.bonus === -1 ? ` <strong>−1 malus !</strong>` : '';
    const pionColor = pIdx === 0 ? '#3b82f6' : '#f59e0b';
    const pionColorDark = pIdx === 0 ? '#1e40af' : '#b45309';
    const pionSvg = `<span style="display:inline-block;width:26px;height:26px;border-radius:50%;background:radial-gradient(circle at 35% 35%,${pionColor} 0%,${pionColorDark} 100%);vertical-align:middle;margin-right:8px;"></span>`;
    const container = $('#duel-question-container');
    container.innerHTML = `
      <div style="background:linear-gradient(90deg, ${pionColor} 0%, ${pionColorDark} 100%);color:white;padding:14px 18px;border-radius:12px;margin-bottom:14px;text-align:center;font-weight:700;font-size:1.05rem;box-shadow:0 4px 12px ${pionColor}55;">
        ${pionSvg}✓ Bonne réponse ! ${duelState.players[pIdx].name} avance d'une case${bonusMsg}
      </div>
      <div class="minigame-box">
        ${renderRace(state, duelState.players)}
      </div>
    `;
    setTimeout(onDone, 1600);
  } else {
    onDone();
  }
}

function miniGameCheckWinAndMaybeEnd(onContinue) {
  const s = duelState.miniGameState;
  if (!s) { onContinue(); return; }
  if (s.winner !== null) {
    // Mini-jeu terminé, on clôture le duel avec ce vainqueur
    duelState.miniGameWinner = s.winner;
    // Ajuster scores pour que le winner du mini-jeu soit celui qui finit en tête
    // Solution simple : +1 point fictif au vainqueur si égalité
    if (duelState.scores[0] === duelState.scores[1]) {
      duelState.scores[s.winner]++;
    } else if ((duelState.scores[0] > duelState.scores[1]) !== (s.winner === 0)) {
      // Le vainqueur du mini-jeu n'est pas en tête aux questions → ajuster
      duelState.scores[s.winner] = duelState.scores[1 - s.winner] + 1;
    }
    finishDuel();
    return;
  }
  onContinue();
}


/* ==========================================================================
   ONGLET COMPÉTENCES — moteur + 5 niveaux + calculatrice
   ========================================================================== */

const SKILL_PROGRESS_KEY = 'autopb3.skills.progress';
const SKILL_LEVELS = [
  { n: 1, label: 'Découverte',    badge: '🔴', desc: 'Un pas, beaucoup d\'aide' },
  { n: 2, label: 'Apprentissage', badge: '🟡', desc: 'Niveau classe standard' },
  { n: 3, label: 'Confirmé',      badge: '🟢', desc: 'Niveau Brevet classique' },
  { n: 4, label: 'Maîtrise',      badge: '💚', desc: 'Brevet élevé' },
  { n: 5, label: 'Expert',        badge: '⚫', desc: 'Défi Brevet +' }
];

const SKILLS = {
  raisonner: {
    title: 'Raisonner',
    icon: '🧠',
    color: '#8b5cf6',
    desc: 'Choisir un théorème, ordonner une démonstration, trouver une erreur.',
    formats: [
      { id: 'theoreme', name: 'Choisir le bon théorème', desc: 'QCM guidé pour reconnaître quand utiliser direct / réciproque / contraposée.' },
      { id: 'ordre',    name: 'Ordonner les étapes', desc: 'Drag-drop ou QCM : remettre les lignes d\'une démonstration dans le bon ordre.' },
      { id: 'erreur',   name: 'Trouver l\'erreur', desc: 'Une démonstration est fausse — repère la ligne erronée.' },
      { id: 'vf',       name: 'Vrai / Faux justifié', desc: 'Juge une affirmation et choisis la bonne raison.' }
    ]
  },
  representer: {
    title: 'Représenter',
    icon: '📊',
    color: '#ec4899',
    desc: 'Lire, construire, passer d\'un registre à un autre.',
    formats: [
      { id: 'lecture', name: 'Lecture graphique', desc: 'Lire une image, un antécédent, une équation…' }
    ]
  },
  modeliser: {
    title: 'Modéliser',
    icon: '🧩',
    color: '#0ea5e9',
    desc: 'Traduire une situation réelle en langage mathématique.',
    formats: [
      { id: 'mise_eq', name: 'Mise en équation', desc: 'Choisir l\'équation qui modélise le problème.' }
    ]
  },
  communiquer: {
    title: 'Communiquer',
    icon: '💬',
    color: '#f97316',
    desc: 'Utiliser les bons connecteurs, notations, phrases de conclusion.',
    formats: [
      { id: 'conclure', name: 'Conclure correctement', desc: 'Choisir la bonne phrase de conclusion.' }
    ]
  },
  redaction: {
    title: 'Rédaction',
    icon: '✍️',
    color: '#14b8a6',
    desc: 'Rédiger une démonstration étape par étape.',
    formats: [
      { id: 'complete', name: 'Texte à compléter', desc: 'Glisser-déposer existant : Pythagore, Thalès, trigo…' }
    ]
  }
};

function loadSkillProgress() {
  try { return JSON.parse(localStorage.getItem(SKILL_PROGRESS_KEY) || '{}'); } catch(e) { return {}; }
}
function saveSkillProgress(p) { localStorage.setItem(SKILL_PROGRESS_KEY, JSON.stringify(p)); }
function getSkillStats(skillId, formatId, level) {
  const p = loadSkillProgress();
  const key = `${skillId}.${formatId}.${level}`;
  return p[key] || { attempts: 0, correct: 0 };
}
function recordSkillAttempt(skillId, formatId, level, isCorrect) {
  const p = loadSkillProgress();
  const key = `${skillId}.${formatId}.${level}`;
  if (!p[key]) p[key] = { attempts: 0, correct: 0 };
  p[key].attempts++;
  if (isCorrect) p[key].correct++;
  saveSkillProgress(p);
}
function isLevelUnlocked(skillId, formatId, level) {
  if (level <= 2) return true;  // Rouge et Jaune toujours déverrouillés
  // Niveau N+1 débloqué si au moins 3 bonnes réponses au niveau N
  const prev = getSkillStats(skillId, formatId, level - 1);
  return prev.correct >= 3;
}

function renderSkillsTab() {
  const container = document.getElementById('skills-cards');
  if (!container) return;
  const detail = document.getElementById('skill-detail');
  detail.style.display = 'none';
  container.style.display = '';
  container.innerHTML = Object.entries(SKILLS).map(([id, s]) => {
    // Compteur d'exercices réalisés pour cette compétence
    const totalAttempts = s.formats.reduce((sum, f) => {
      return sum + SKILL_LEVELS.reduce((s2, lvl) => s2 + getSkillStats(id, f.id, lvl.n).correct, 0);
    }, 0);
    return `<div class="skill-card" data-skill="${id}">
      <div class="skill-card-head">
        <div class="skill-card-icon" style="background:${s.color};">${s.icon}</div>
        <h3 class="skill-card-title">${s.title}</h3>
      </div>
      <p class="skill-card-desc">${s.desc}</p>
      <div class="skill-card-stats">
        <span style="font-size:0.82rem;color:var(--muted);">✓ ${totalAttempts} réussis · ${s.formats.length} format${s.formats.length>1?'s':''}</span>
      </div>
    </div>`;
  }).join('');
  container.querySelectorAll('.skill-card').forEach(card => {
    card.addEventListener('click', () => renderSkillDetail(card.dataset.skill));
  });
}

function renderSkillDetail(skillId) {
  const s = SKILLS[skillId];
  if (!s) return;
  const cards = document.getElementById('skills-cards');
  const detail = document.getElementById('skill-detail');
  cards.style.display = 'none';
  detail.style.display = '';
  detail.innerHTML = `
    <button class="skill-back-btn" id="btn-skill-back">← Retour aux compétences</button>
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:8px;">
      <div class="skill-card-icon" style="background:${s.color};width:52px;height:52px;border-radius:12px;font-size:1.5rem;">${s.icon}</div>
      <h2 style="margin:0;">${s.title}</h2>
    </div>
    <p class="note">${s.desc}</p>
    ${s.formats.map(f => renderFormatBlock(skillId, f)).join('')}
  `;
  document.getElementById('btn-skill-back').addEventListener('click', renderSkillsTab);
}

function renderFormatBlock(skillId, format) {
  return `<div class="skill-format-block" data-format="${format.id}">
    <h4>${format.name}</h4>
    <p>${format.desc}</p>
    <div class="skill-levels-grid">
      ${SKILL_LEVELS.map(lvl => {
        const stats = getSkillStats(skillId, format.id, lvl.n);
        const unlocked = isLevelUnlocked(skillId, format.id, lvl.n);
        const pct = stats.attempts ? Math.round(100 * stats.correct / stats.attempts) : 0;
        return `<div class="skill-level-card n${lvl.n} ${unlocked ? '' : 'locked'}" data-skill="${skillId}" data-format="${format.id}" data-level="${lvl.n}">
          <div class="lvl-title">${lvl.badge} ${lvl.label}</div>
          <div class="lvl-sub">${lvl.desc}</div>
          ${stats.attempts > 0 ? `
            <div class="lvl-progress"><div class="lvl-progress-fill" style="width:${pct}%;"></div></div>
            <div class="lvl-sub" style="margin-top:4px;">${stats.correct} / ${stats.attempts} réussies (${pct}%)</div>
          ` : (unlocked ? '<div class="lvl-sub" style="margin-top:8px;">⏸ Pas encore essayé</div>' : '<div class="lvl-sub" style="margin-top:8px;">Réussis 3 exos du niveau précédent</div>')}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

/* ==========================================================================
   AIDE CONTEXTUELLE PAR THÉORÈME (utilisée dans les exercices Raisonner)
   Chaque entrée : énoncé formel + rédaction-type + exemple complet + erreurs.
   La fonction makeHelp(key, level) renvoie une aide {cours, savoirFaire, erreurs}
   plus ou moins détaillée selon le niveau (🔴=complète, ⚫=sommaire).
   ========================================================================== */
const THEOREMES = {
  pythagore_direct: {
    nom: 'Théorème de Pythagore (direct)',
    quand: "On sait qu'un triangle est <b>rectangle</b> et on veut calculer un côté.",
    enonce: "Si ABC est rectangle en A, alors <b>BC² = AB² + AC²</b> (BC est l'hypoténuse, face à l'angle droit).",
    redaction: [
      "1) <em>Dans le triangle ABC rectangle en A,</em>",
      "2) <em>d'après le théorème de Pythagore :</em> <b>BC² = AB² + AC²</b>",
      "3) <em>donc BC² = ...² + ...² = ...</em>",
      "4) <em>donc BC = √... = ... cm.</em>"
    ],
    exemple: "Si AB = 3 cm et AC = 4 cm dans un triangle rectangle en A : BC² = 3² + 4² = 9 + 16 = 25, donc BC = √25 = <b>5 cm</b>.",
    erreurs: [
      "Oublier la racine carrée à la fin (donner BC² comme longueur).",
      "Additionner les longueurs au lieu des carrés (3+4=7 au lieu de 9+16=25).",
      "Confondre hypoténuse et autre côté (l'hypoténuse est toujours face à l'angle droit)."
    ]
  },
  pythagore_reciproque: {
    nom: 'Réciproque du théorème de Pythagore',
    quand: "On connaît les <b>3 longueurs</b> et on veut <b>prouver</b> qu'un triangle est rectangle.",
    enonce: "Si BC² = AB² + AC², alors ABC est <b>rectangle en A</b> (A = sommet opposé au plus grand côté BC).",
    redaction: [
      "1) <em>Le plus grand côté est BC. On calcule BC² et AB² + AC².</em>",
      "2) <em>On trouve BC² = ... et AB² + AC² = ...</em>",
      "3) <em>BC² = AB² + AC², donc d'après la <b>réciproque</b> du théorème de Pythagore,</em>",
      "4) <em>le triangle ABC est rectangle en A.</em>"
    ],
    exemple: "Si AB = 5, AC = 12, BC = 13 : BC² = 169 et AB² + AC² = 25 + 144 = 169. Égalité vérifiée ⇒ ABC est <b>rectangle en A</b>.",
    erreurs: [
      "Dire « d'après Pythagore » au lieu de « d'après la réciproque de Pythagore ».",
      "Oublier de désigner le sommet de l'angle droit (en face du plus grand côté).",
      "Conclure rectangle si AB²+BC² = AC² au lieu de vérifier l'égalité avec le PLUS GRAND côté au carré."
    ]
  },
  pythagore_contraposee: {
    nom: 'Contraposée du théorème de Pythagore',
    quand: "On connaît les <b>3 longueurs</b> et on veut <b>prouver qu'un triangle n'est PAS rectangle</b>.",
    enonce: "Si BC² ≠ AB² + AC² (où BC est le plus grand côté), alors ABC n'est <b>pas rectangle en A</b>.",
    redaction: [
      "1) <em>On calcule BC² (plus grand côté au carré) et AB² + AC².</em>",
      "2) <em>On trouve BC² = ... et AB² + AC² = ... : les deux sont différents.</em>",
      "3) <em>D'après la <b>contraposée</b> du théorème de Pythagore, ABC n'est pas rectangle en A.</em>"
    ],
    exemple: "Si AB = 6, AC = 7, BC = 9 : BC² = 81, AB² + AC² = 36 + 49 = 85. Différents ⇒ ABC <b>n'est pas rectangle</b>.",
    erreurs: [
      "Dire « d'après Pythagore » au lieu de « d'après la contraposée ».",
      "Conclure « rectangle quelque part » : non, ce raisonnement exclut seulement l'angle droit au sommet opposé au plus grand côté."
    ]
  },
  thales_direct: {
    nom: 'Théorème de Thalès (direct)',
    quand: "Une droite <b>parallèle</b> à un côté coupe les deux autres côtés. On veut une longueur.",
    enonce: "Si (DE) // (BC) avec D ∈ [AB] et E ∈ [AC], alors <b>AD/AB = AE/AC = DE/BC</b>.",
    redaction: [
      "1) <em>Les droites (BD) et (CE) sont sécantes en A, et (DE) est parallèle à (BC).</em>",
      "2) <em>D'après le théorème de Thalès : AD/AB = AE/AC = DE/BC.</em>",
      "3) <em>On remplace les valeurs connues et on résout par produit en croix.</em>",
      "4) <em>Conclusion : la longueur cherchée vaut ... cm.</em>"
    ],
    exemple: "Si AD = 3, AB = 5, AE = 6 et (DE) // (BC) : 3/5 = 6/AC, donc AC = 5×6/3 = <b>10 cm</b>.",
    erreurs: [
      "Écrire AD/DB au lieu de AD/AB (on prend <b>toujours le sommet A</b> au dénominateur).",
      "Oublier de préciser le parallélisme avant d'appliquer Thalès.",
      "Mélanger numérateur et dénominateur dans la règle."
    ]
  },
  thales_reciproque: {
    nom: 'Réciproque du théorème de Thalès',
    quand: "On veut <b>prouver que deux droites sont parallèles</b>, à partir de rapports de longueurs.",
    enonce: "Si A, D, B et A, E, C sont alignés dans le même ordre et AD/AB = AE/AC, alors (DE) // (BC).",
    redaction: [
      "1) <em>Les points A, D, B sont alignés dans cet ordre, idem pour A, E, C.</em>",
      "2) <em>On calcule AD/AB et AE/AC.</em>",
      "3) <em>On trouve les deux rapports égaux (par exemple 2/5 = 2/5).</em>",
      "4) <em>D'après la <b>réciproque</b> du théorème de Thalès, les droites (DE) et (BC) sont parallèles.</em>"
    ],
    exemple: "Si AD = 4, AB = 10, AE = 6, AC = 15 : AD/AB = 4/10 = 2/5 et AE/AC = 6/15 = 2/5. Égalité ⇒ <b>(DE) // (BC)</b>.",
    erreurs: [
      "Oublier de vérifier l'alignement dans le même ordre (indispensable).",
      "Dire « d'après Thalès » au lieu de « d'après la réciproque ».",
      "Confondre AD/AB avec AD/DB."
    ]
  },
  thales_contraposee: {
    nom: 'Contraposée du théorème de Thalès',
    quand: "On veut <b>prouver que deux droites ne sont PAS parallèles</b>.",
    enonce: "Si AD/AB ≠ AE/AC (avec les points alignés dans le même ordre), alors (DE) n'est pas parallèle à (BC).",
    redaction: [
      "1) <em>On calcule les rapports AD/AB et AE/AC.</em>",
      "2) <em>Les deux rapports sont différents.</em>",
      "3) <em>D'après la <b>contraposée</b> du théorème de Thalès, les droites (DE) et (BC) ne sont pas parallèles.</em>"
    ],
    exemple: "Si AD/AB = 2/5 et AE/AC = 1/3 : les deux sont différents ⇒ (DE) <b>n'est pas parallèle</b> à (BC).",
    erreurs: [
      "Dire « d'après Thalès » au lieu de « d'après la contraposée ».",
      "Oublier que Thalès suppose un ordre d'alignement."
    ]
  },
  trigonometrie: {
    nom: 'Trigonométrie dans le triangle rectangle',
    quand: "On a un triangle <b>rectangle</b>, un <b>angle aigu</b> et on veut un côté ou un angle.",
    enonce: "Pour un angle aigu \\(\\alpha\\) d'un triangle rectangle :<br>" +
      "• <b>cos(α) = adjacent / hypoténuse</b><br>" +
      "• <b>sin(α) = opposé / hypoténuse</b><br>" +
      "• <b>tan(α) = opposé / adjacent</b><br>" +
      "Astuce « SOH-CAH-TOA ».",
    redaction: [
      "1) <em>Dans le triangle rectangle en ..., l'hypoténuse est ...</em>",
      "2) <em>Pour l'angle α, le côté adjacent est ..., l'opposé est ...</em>",
      "3) <em>On utilise la formule adaptée : cos / sin / tan = ... / ...</em>",
      "4) <em>On isole l'inconnue et on conclut avec l'unité.</em>"
    ],
    exemple: "Triangle rectangle en A, \\(\\widehat{B} = 35°\\), BC = 10. On cherche AB (adjacent à B) : cos(35°) = AB/10, donc AB = 10 × cos(35°) ≈ <b>8,19 cm</b>.",
    erreurs: [
      "Confondre le côté adjacent et le côté opposé.",
      "Confondre hypoténuse avec un autre côté (l'hypoténuse est face à l'angle droit, jamais attachée à l'angle étudié).",
      "Utiliser la formule dans un triangle non rectangle."
    ]
  },
  sommes_angles: {
    nom: 'Somme des angles d\'un triangle',
    quand: "On connaît deux angles d'un triangle et on veut le troisième.",
    enonce: "La somme des trois angles d'un triangle vaut toujours <b>180°</b>.",
    redaction: [
      "1) <em>Dans le triangle ABC, Â + B̂ + Ĉ = 180°.</em>",
      "2) <em>Donc Ĉ = 180° − Â − B̂.</em>",
      "3) <em>On remplace par les valeurs connues et on conclut.</em>"
    ],
    exemple: "Si Â = 60° et B̂ = 70°, alors Ĉ = 180 − 60 − 70 = <b>50°</b>.",
    erreurs: [
      "Utiliser 360° au lieu de 180° (c'est la somme pour un quadrilatère).",
      "Oublier qu'un triangle équilatéral a 3 angles de 60°.",
      "Additionner Â + B̂ sans soustraire de 180."
    ]
  },
  aire_vs_perimetre: {
    nom: 'Aire ≠ périmètre',
    quand: "Il faut bien distinguer ces deux grandeurs.",
    enonce: "• <b>Périmètre</b> = somme des longueurs du contour (unité : m, cm…).<br>" +
      "• <b>Aire</b> = mesure de la surface intérieure (unité : m², cm²…).",
    redaction: [
      "1) <em>Je repère si on me demande le contour (périmètre) ou la surface (aire).</em>",
      "2) <em>J'applique la bonne formule (P = 2(L+l) pour un rectangle, A = L×l).</em>",
      "3) <em>Je n'oublie pas le carré de l'unité pour une aire.</em>"
    ],
    exemple: "Rectangle 5 m × 3 m : périmètre = 2×(5+3) = 16 m ; aire = 5×3 = <b>15 m²</b>.",
    erreurs: [
      "Donner une aire en m (unité linéaire) au lieu de m² (unité carrée).",
      "Additionner les côtés au lieu de les multiplier pour une aire.",
      "Confondre « aire » et « périmètre » dans l'énoncé."
    ]
  },
  conversions_aire: {
    nom: 'Conversions d\'aire',
    quand: "Convertir entre différentes unités d'aire (m², cm², km²…).",
    enonce: "Entre deux unités d'aire consécutives, le facteur est <b>× 100</b> (ou ÷100), pas ×10. " +
      "Car 1 m = 10 dm ⇒ 1 m² = 10² dm² = 100 dm².",
    redaction: [
      "1) <em>Je place le nombre dans un tableau de conversion d'aire (2 cases par unité).</em>",
      "2) <em>Je convertis en sachant que chaque cran vaut ×100.</em>",
      "3) <em>Je vérifie le sens (plus grande unité ⇒ nombre plus petit).</em>"
    ],
    exemple: "150 m² en km² : 1 km² = 1 000 000 m², donc 150 m² = 150 / 1 000 000 = <b>0,000 15 km²</b>.",
    erreurs: [
      "Utiliser ×10 au lieu de ×100.",
      "Inverser le sens (diviser au lieu de multiplier).",
      "Confondre m et m² dans les conversions."
    ]
  },
  fractions_somme: {
    nom: 'Addition de fractions',
    quand: "On additionne ou soustrait deux fractions.",
    enonce: "Il faut <b>un dénominateur commun</b> avant de faire la somme. " +
      "<b>On n'additionne JAMAIS les dénominateurs</b>.",
    redaction: [
      "1) <em>Je trouve un dénominateur commun (multiple commun).</em>",
      "2) <em>Je mets chaque fraction au même dénominateur.</em>",
      "3) <em>J'additionne les numérateurs (dénominateur inchangé).</em>",
      "4) <em>Je simplifie si possible.</em>"
    ],
    exemple: "1/2 + 1/3 : on met au même dénominateur 6 → 3/6 + 2/6 = <b>5/6</b>.",
    erreurs: [
      "Additionner les dénominateurs (1/2 + 1/3 = 2/5 : FAUX).",
      "Additionner numérateurs sans réduire les fractions au même dénominateur.",
      "Oublier de simplifier à la fin."
    ]
  },
  puissances_signe: {
    nom: 'Puissances et signes',
    quand: "Calcul de (−a)ⁿ ou d'expressions avec des parenthèses.",
    enonce: "• <b>(−a)²</b> = (−a) × (−a) = <b>+a²</b> (signe moins × signe moins = plus).<br>" +
      "• <b>−a²</b> = <b>−(a²)</b> (on met d'abord au carré puis on change le signe).",
    redaction: [
      "1) <em>Je regarde s'il y a des parenthèses autour du signe moins.</em>",
      "2) <em>Je développe prudemment : (−3)² = (−3)×(−3) = +9.</em>"
    ],
    exemple: "(−3)² = 9 (résultat positif). Mais −3² = −9 (résultat négatif).",
    erreurs: [
      "Confondre (−3)² et −3² (parenthèses capitales).",
      "Donner (−3)² = −9 (oubli de la règle des signes)."
    ]
  },
  cercle: {
    nom: 'Cercle : périmètre et aire',
    quand: "Calculs de longueur ou surface sur un cercle / disque.",
    enonce: "• <b>Périmètre (circonférence)</b> : <b>P = 2π r = π D</b> (r rayon, D diamètre).<br>" +
      "• <b>Aire du disque</b> : <b>A = π r²</b>.",
    redaction: [
      "1) <em>Je repère le rayon r du cercle.</em>",
      "2) <em>J'applique la bonne formule (périmètre ou aire selon la question).</em>",
      "3) <em>Je donne le résultat en fonction de π ou en décimal (selon la consigne).</em>"
    ],
    exemple: "Rayon 3 cm : P = 2π × 3 = 6π ≈ 18,85 cm ; A = π × 3² = 9π ≈ 28,27 cm².",
    erreurs: [
      "Utiliser πr² pour le périmètre (c'est l'aire).",
      "Utiliser 2πr pour l'aire (c'est le périmètre).",
      "Confondre rayon et diamètre."
    ]
  }
};

/* Construit une aide {cours, savoirFaire, erreurs} adaptée au niveau 1..5 */
function makeHelp(theoremeKey, level) {
  const t = THEOREMES[theoremeKey];
  if (!t) return null;
  if (level <= 1) {
    // 🔴 Niveau complet : énoncé + rédaction + exemple
    return {
      cours: `<b>${t.nom}</b><br><em>Quand l'utiliser :</em> ${t.quand}<br><em>Énoncé :</em> ${t.enonce}`,
      savoirFaire: `<b>Rédaction-type :</b><ol style="margin:6px 0;padding-left:18px;">${t.redaction.map(r => `<li>${r}</li>`).join('')}</ol><em>Exemple :</em> ${t.exemple}`,
      erreurs: t.erreurs
    };
  } else if (level <= 2) {
    // 🟡 Complet mais un peu plus court (on garde tout)
    return {
      cours: `<b>${t.nom}</b><br>${t.enonce}<br><em>${t.quand}</em>`,
      savoirFaire: `<b>Rédaction :</b> ${t.redaction.join(' → ')}<br><em>Ex :</em> ${t.exemple}`,
      erreurs: t.erreurs
    };
  } else if (level <= 3) {
    // 🟢 Énoncé + 1er point de rédaction
    return {
      cours: `<b>${t.nom}</b> — ${t.enonce}`,
      savoirFaire: `<em>Piste :</em> ${t.redaction[0]}. <em>Ex :</em> ${t.exemple}`,
      erreurs: t.erreurs.slice(0, 2)
    };
  } else if (level <= 4) {
    // 💚 Juste un rappel + piège à éviter
    return {
      cours: `<b>${t.nom}</b> : ${t.enonce}`,
      savoirFaire: `Attention à la <b>rigueur</b> de la rédaction.`,
      erreurs: t.erreurs.slice(0, 1)
    };
  } else {
    // ⚫ Expert : à peine un mot-clé
    return {
      cours: `Indice : <b>${t.nom}</b>.`,
      savoirFaire: "À toi de rédiger rigoureusement.",
      erreurs: []
    };
  }
}

/* ==========================================================================
   RAISONNER — Format A : Choisir le bon théorème (5 niveaux)
   ========================================================================== */

function rais_theoreme_n1() {
  // Niveau Rouge : énoncé ultra guidé, 3 choix, 1 seul théorème cible
  const cases = [
    {
      theoreme: 'pythagore_direct',
      figure: svgTriangleRect({ sides: { AB: 'AB = 3', BC: 'BC = 4', AC: '?' } }),
      body: "Dans un triangle ABC rectangle en B, je connais AB = 3 cm et BC = 4 cm. Je veux calculer l'hypoténuse AC. <b>Quel théorème utiliser ?</b>",
      a: "Théorème de Pythagore (direct)",
      opts: ["Théorème de Pythagore (direct)", "Réciproque de Pythagore", "Théorème de Thalès"],
      sol: "On connaît 2 côtés d'un triangle rectangle, on cherche le 3ème → <b>Pythagore direct</b> : \\(AC^2 = AB^2 + BC^2\\)."
    },
    {
      theoreme: 'pythagore_reciproque',
      body: "Dans un triangle, je connais les <b>trois longueurs</b> et je veux savoir si le triangle est rectangle. <b>Quel théorème ?</b>",
      a: "Réciproque de Pythagore",
      opts: ["Réciproque de Pythagore", "Théorème de Pythagore (direct)", "Théorème de Thalès"],
      sol: "Je veux PROUVER que le triangle est rectangle à partir des 3 longueurs → <b>réciproque de Pythagore</b>."
    },
    {
      theoreme: 'thales_direct',
      figure: svgThales({ AB: 5, AC: 7, AD: 3, labels: { A:'A', B:'B', C:'C', D:'D', E:'E' } }),
      body: "Dans un triangle ABC, je sais que (DE) est parallèle à (BC) avec D sur [AB] et E sur [AC]. Je veux calculer AE. <b>Quel théorème ?</b>",
      a: "Théorème de Thalès (direct)",
      opts: ["Théorème de Thalès (direct)", "Réciproque de Thalès", "Théorème de Pythagore"],
      sol: "Configuration Thalès (droite parallèle) et je cherche une longueur → <b>Thalès direct</b>."
    },
    {
      theoreme: 'trigonometrie',
      figure: svgTriangleRect({ sides: { AB: '?', BC: 'BC = 10', AC: '' } }),
      body: "Dans un triangle ABC rectangle en A, je connais l'hypoténuse BC = 10 cm et l'angle \\(\\widehat{B} = 40°\\). Je veux AB. <b>Quel outil utiliser ?</b>",
      a: "Trigonométrie (cosinus)",
      opts: ["Trigonométrie (cosinus)", "Théorème de Pythagore", "Théorème de Thalès"],
      sol: "Un angle aigu connu + une longueur + un triangle rectangle → <b>trigonométrie</b>. AB est adjacent à B, BC est l'hypoténuse → cos."
    },
    {
      theoreme: 'sommes_angles',
      body: "Dans un triangle ABC, je connais Â = 70° et B̂ = 50°. Je veux Ĉ. <b>Quelle propriété utiliser ?</b>",
      a: "Somme des angles d'un triangle (180°)",
      opts: ["Somme des angles d'un triangle (180°)", "Théorème de Pythagore", "Théorème de Thalès"],
      sol: "Je connais 2 angles et je cherche le 3ème → <b>somme des angles = 180°</b>. Ĉ = 180 − 70 − 50 = 60°."
    },
    {
      theoreme: 'cercle',
      body: "Je connais le rayon d'un cercle (3 cm) et je veux calculer sa circonférence (périmètre). <b>Quelle formule ?</b>",
      a: "P = 2πr",
      opts: ["P = 2πr", "A = πr²", "P = πr²"],
      sol: "Périmètre d'un cercle = <b>2πr</b>. Ici : 2π × 3 = 6π ≈ 18,85 cm."
    }
  ];
  return _buildQCM(cases, 'Niveau 🔴 — Choisir le bon théorème');
}

function rais_theoreme_n2() {
  // Niveau Jaune : 4 choix, direct/réciproque, Pythagore ou Thalès
  const cases = [
    {
      theoreme: 'pythagore_reciproque',
      body: "On connaît les 3 côtés d'un triangle : 6 cm, 8 cm, 10 cm. On veut savoir s'il est rectangle.",
      a: "Réciproque de Pythagore",
      opts: ["Réciproque de Pythagore", "Pythagore direct", "Thalès direct", "Réciproque de Thalès"],
      sol: "On connaît les 3 longueurs et on veut vérifier si rectangle → <b>réciproque</b>."
    },
    {
      theoreme: 'pythagore_direct',
      body: "Dans un triangle ABC rectangle en A, on connaît AB et AC. On veut calculer BC.",
      a: "Pythagore direct",
      opts: ["Pythagore direct", "Réciproque de Pythagore", "Trigonométrie", "Thalès"],
      sol: "Triangle rectangle connu, calcul d'un côté manquant → <b>Pythagore direct</b>. BC est l'hypoténuse (face à l'angle droit en A)."
    },
    {
      theoreme: 'thales_reciproque',
      body: "Dans un triangle ABC, on a deux sécantes et on connaît 4 longueurs : AM, AB, AN, AC. On veut savoir si (MN) est parallèle à (BC).",
      a: "Réciproque de Thalès",
      opts: ["Réciproque de Thalès", "Thalès direct", "Pythagore", "Réciproque de Pythagore"],
      sol: "On veut PROUVER le parallélisme → on vérifie \\(\\dfrac{AM}{AB} = \\dfrac{AN}{AC}\\) → <b>réciproque de Thalès</b>."
    },
    {
      theoreme: 'trigonometrie',
      body: "Dans un triangle rectangle, on connaît l'hypoténuse et un angle aigu. On veut un côté.",
      a: "Trigonométrie (cos, sin ou tan)",
      opts: ["Trigonométrie (cos, sin ou tan)", "Pythagore", "Thalès", "Réciproque de Pythagore"],
      sol: "Angle aigu et hypoténuse connus → <b>trigonométrie</b>. Le choix entre cos, sin, tan dépend du côté cherché (adjacent, opposé)."
    },
    {
      theoreme: 'pythagore_contraposee',
      body: "On a un triangle avec AB = 6, BC = 7, AC = 9. On veut prouver qu'il n'est pas rectangle.",
      a: "Contraposée de Pythagore",
      opts: ["Contraposée de Pythagore", "Réciproque de Pythagore", "Pythagore direct", "Thalès direct"],
      sol: "On calcule : 9² = 81 mais 6² + 7² = 85. L'égalité est fausse → <b>contraposée de Pythagore</b> : le triangle n'est pas rectangle en A (opposé à BC = 9 ? non, à AC = 9 si on reprend les notations)."
    },
    {
      theoreme: 'thales_direct',
      body: "Dans un triangle ABC, M est sur [AB], N sur [AC] et (MN) // (BC). On connaît AM = 2, AB = 5, BC = 10. On veut MN.",
      a: "Thalès direct",
      opts: ["Thalès direct", "Réciproque de Thalès", "Contraposée de Thalès", "Pythagore"],
      sol: "Parallélisme donné + calcul de longueur → <b>Thalès direct</b> : AM/AB = MN/BC, donc 2/5 = MN/10, donc MN = 4."
    },
    {
      theoreme: 'aire_vs_perimetre',
      body: "On veut la <b>surface</b> d'un jardin rectangulaire de 12 m de long et 8 m de large.",
      a: "Aire = L × l",
      opts: ["Aire = L × l", "Périmètre = 2(L + l)", "Diagonale par Pythagore", "Périmètre = L + l"],
      sol: "« Surface » = <b>aire</b>. Formule : A = L × l = 12 × 8 = 96 <b>m²</b>."
    }
  ];
  return _buildQCM(cases, 'Niveau 🟡 — Choisir le bon théorème');
}

function rais_theoreme_n3() {
  // Niveau Vert clair : 4 choix avec distracteurs subtils
  const cases = [
    {
      theoreme: 'thales_direct',
      body: "Dans un triangle ABC, (MN) // (BC). On connaît AM, MB, AN. On veut calculer NC.",
      a: "Théorème de Thalès (direct)",
      opts: ["Théorème de Thalès (direct)", "Réciproque de Thalès", "Droite des milieux", "Triangles semblables"],
      sol: "Parallélisme donné, on cherche une longueur → <b>Thalès direct</b>. \\(\\dfrac{AM}{AB} = \\dfrac{AN}{AC}\\). On connaît AM, MB (donc AB), AN → on calcule AC puis NC."
    },
    {
      theoreme: 'pythagore_reciproque',
      body: "On a un triangle ABC avec AB = 7, AC = 24, BC = 25. On veut savoir s'il est rectangle et <b>où</b>.",
      a: "Réciproque de Pythagore (en A)",
      opts: ["Réciproque de Pythagore (en A)", "Réciproque de Pythagore (en B)", "Pythagore direct en A", "Contraposée de Pythagore"],
      sol: "Le plus grand côté est BC = 25 (l'éventuelle hypoténuse). Si rectangle, ce sera en A (sommet opposé à BC). On vérifie \\(7^2 + 24^2 = 49+576 = 625 = 25^2\\). ✓ <b>Rectangle en A par réciproque</b>."
    },
    {
      theoreme: 'trigonometrie',
      body: "On a un triangle rectangle en B. On connaît AB = 6 et \\(\\widehat{A} = 40°\\). On veut BC.",
      a: "Tangente de l'angle A",
      opts: ["Tangente de l'angle A", "Cosinus de l'angle A", "Sinus de l'angle A", "Pythagore direct"],
      sol: "BC est opposé à l'angle A, AB est adjacent à l'angle A → <b>\\(\\tan(\\widehat{A}) = \\dfrac{\\text{opp}}{\\text{adj}} = \\dfrac{BC}{AB}\\)</b>."
    },
    {
      theoreme: 'thales_contraposee',
      body: "On a 2 droites sécantes en A et 4 points M, B, N, C alignés sur ces droites. Les rapports \\(\\dfrac{AM}{AB}\\) et \\(\\dfrac{AN}{AC}\\) sont différents. Que peut-on conclure ?",
      a: "(MN) n'est pas parallèle à (BC) (contraposée de Thalès)",
      opts: ["(MN) n'est pas parallèle à (BC) (contraposée de Thalès)", "(MN) est parallèle à (BC)", "Le triangle est rectangle", "On ne peut rien conclure"],
      sol: "Si les 2 rapports étaient égaux → parallèle (réciproque). Ici ils diffèrent → <b>contraposée</b> : non parallèle."
    },
    {
      theoreme: 'conversions_aire',
      body: "On a une aire de 3 500 cm² à convertir en m².",
      a: "Diviser par 10 000 (facteur ×100 entre cm² et dm², ×100 entre dm² et m²)",
      opts: [
        "Diviser par 10 000 (facteur ×100 entre cm² et dm², ×100 entre dm² et m²)",
        "Diviser par 100",
        "Diviser par 1000",
        "Multiplier par 10 000"
      ],
      sol: "Pour les aires, chaque cran du tableau vaut <b>×100</b>. 1 m² = 100 dm² = 10 000 cm². Donc 3 500 cm² = 3 500 / 10 000 = <b>0,35 m²</b>."
    },
    {
      theoreme: 'cercle',
      body: "On veut <b>l'aire</b> d'un disque de rayon 5 cm.",
      a: "A = π × 5² = 25π ≈ 78,5 cm²",
      opts: [
        "A = π × 5² = 25π ≈ 78,5 cm²",
        "A = 2π × 5 = 10π ≈ 31,4 cm",
        "A = π × 10 = 10π ≈ 31,4 cm²",
        "A = 5² = 25 cm²"
      ],
      sol: "Aire d'un disque = <b>π r²</b>. Ici : π × 25 = 25π ≈ 78,5 cm². (2π r est le périmètre, pas l'aire.)"
    }
  ];
  return _buildQCM(cases, 'Niveau 🟢 — Choisir le bon théorème');
}

function rais_theoreme_n4() {
  // Niveau Vert foncé : situations où plusieurs théorèmes possibles, ordre des étapes
  const cases = [
    {
      theoreme: 'trigonometrie',
      body: "Dans un triangle ABC rectangle en A, on connaît BC = 10 et \\(\\widehat{B} = 35°\\). On veut AC <b>en 2 étapes</b>. Le plan le plus efficace est :",
      a: "Utiliser le sinus de B uniquement",
      opts: ["Utiliser le sinus de B uniquement", "Utiliser Pythagore après avoir trouvé AB", "Utiliser cos puis Pythagore", "Utiliser uniquement la tangente"],
      sol: "AC est le côté opposé à l'angle B, BC est l'hypoténuse → \\(\\sin(\\widehat{B}) = \\dfrac{AC}{BC}\\) donc \\(AC = 10 \\sin(35°)\\). <b>Une seule étape avec le sinus</b>."
    },
    {
      theoreme: 'thales_direct',
      body: "Configuration papillon : deux droites se croisent en A, avec M et B sur l'une, N et C sur l'autre (de part et d'autre de A). On connaît AM, AN, MN. Pour calculer BC, je dois :",
      a: "Vérifier d'abord si (MN) // (BC), puis appliquer Thalès",
      opts: ["Vérifier d'abord si (MN) // (BC), puis appliquer Thalès", "Appliquer directement Thalès sans vérifier", "Utiliser Pythagore", "Utiliser la trigonométrie"],
      sol: "Thalès exige le parallélisme. Dans la configuration papillon, on applique Thalès <b>si et seulement si</b> (MN) // (BC) — il faut le vérifier ou que l'énoncé le donne."
    },
    {
      theoreme: 'pythagore_direct',
      body: "Dans un triangle ABC, je connais AB, BC et je sais que l'angle en B est aigu. Je veux calculer AC. Je peux utiliser :",
      a: "Le théorème de Pythagore seulement si ABC est rectangle",
      opts: ["Le théorème de Pythagore seulement si ABC est rectangle", "Le théorème de Pythagore toujours", "Le théorème de Thalès", "Rien, il manque une information"],
      sol: "Pythagore ne s'applique <b>que dans un triangle rectangle</b>. Avec un angle aigu quelconque, il faut d'autres outils (trigonométrie dans un triangle non rectangle = hors programme 3ème). Réponse : Pythagore si et seulement si rectangle."
    },
    {
      theoreme: 'trigonometrie',
      body: "Triangle rectangle en A, AB = 4, AC = 3. Pour trouver la mesure de l'angle B, le plus simple est :",
      a: "Utiliser tan(B) = AC / AB puis arctan",
      opts: [
        "Utiliser tan(B) = AC / AB puis arctan",
        "Utiliser Pythagore pour trouver BC puis cos(B)",
        "Utiliser sin(B) = AB / BC après avoir calculé BC",
        "Utiliser la somme des angles"
      ],
      sol: "On connaît les deux côtés de l'angle droit : opposé (AC) et adjacent (AB) à l'angle B. <b>tan(B) = opp/adj = 3/4</b>, puis B = arctan(3/4) ≈ 36,87°."
    },
    {
      theoreme: 'thales_reciproque',
      body: "Configuration papillon : on sait que A, M, B alignés dans cet ordre et A, N, C dans l'ordre inverse. Pour prouver (MN) // (BC), je dois :",
      a: "Vérifier AM/AB = AN/AC, le sens inverse n'est pas un obstacle",
      opts: [
        "Vérifier AM/AB = AN/AC, le sens inverse n'est pas un obstacle",
        "Utiliser uniquement Pythagore",
        "C'est impossible si les sens sont inverses",
        "Ce n'est pas la réciproque mais le théorème direct"
      ],
      sol: "Dans la configuration papillon, la réciproque de Thalès fonctionne <b>si l'alignement est dans le même ordre ou dans des ordres inverses</b>. L'important est que les 3 points sont alignés et le rapport est correct."
    }
  ];
  return _buildQCM(cases, 'Niveau 💚 — Choisir le bon théorème');
}

function rais_theoreme_n5() {
  // Niveau Noire : pièges logiques subtils
  const cases = [
    {
      theoreme: 'pythagore_reciproque',
      body: "Affirmation : « Si les 3 côtés d'un triangle mesurent 5, 12, 13, alors il est rectangle. » <b>Quel est le bon raisonnement ?</b>",
      a: "Réciproque de Pythagore car 5²+12² = 13² (25+144=169)",
      opts: [
        "Réciproque de Pythagore car 5²+12² = 13² (25+144=169)",
        "Pythagore direct car 5²+12² = 13²",
        "Contraposée de Pythagore",
        "Thalès"
      ],
      sol: "On <b>suppose</b> que le triangle est décrit par 3 longueurs et on veut <b>conclure</b> qu'il est rectangle → <b>réciproque</b> (et non direct, qui suppose déjà rectangle)."
    },
    {
      theoreme: 'pythagore_contraposee',
      body: "Dans un triangle ABC, je sais que \\(AB^2 + BC^2 \\neq AC^2\\). Quelle conclusion ?",
      a: "ABC n'est pas rectangle en B (contraposée de Pythagore)",
      opts: [
        "ABC n'est pas rectangle en B (contraposée de Pythagore)",
        "ABC n'est pas rectangle du tout",
        "ABC est rectangle ailleurs qu'en B",
        "On ne peut rien conclure"
      ],
      sol: "Pythagore dit : <em>rectangle en B ⇒ AB²+BC² = AC²</em>. La <b>contraposée</b> : <em>AB²+BC² ≠ AC² ⇒ non rectangle en B</em>. Il <b>pourrait</b> être rectangle ailleurs (en A ou en C)."
    },
    {
      theoreme: 'thales_direct',
      body: "On a deux triangles ABC et MNP tels que \\(\\dfrac{AB}{MN} = \\dfrac{BC}{NP} = \\dfrac{AC}{MP} = \\dfrac{2}{3}\\). Que peut-on dire ?",
      a: "MNP est un agrandissement de ABC (triangles semblables)",
      opts: [
        "MNP est un agrandissement de ABC (triangles semblables)",
        "Les triangles sont rectangles",
        "Il s'agit d'une application du théorème de Thalès",
        "Aucune conclusion possible"
      ],
      sol: "Trois rapports de côtés égaux → <b>triangles semblables</b>. Le rapport 2/3 signifie que MNP est <b>3/2 fois plus grand</b> que ABC."
    },
    {
      theoreme: 'thales_contraposee',
      body: "Dans un triangle ABC, M ∈ [AB] et N ∈ [AC]. On a AM/AB = 0,3 et AN/AC = 0,4. Que peut-on conclure pour (MN) et (BC) ?",
      a: "Les droites ne sont pas parallèles (contraposée de Thalès)",
      opts: [
        "Les droites ne sont pas parallèles (contraposée de Thalès)",
        "Les droites sont parallèles",
        "On ne peut rien dire",
        "Les droites sont perpendiculaires"
      ],
      sol: "La réciproque de Thalès exige l'égalité des rapports. Ici 0,3 ≠ 0,4 → <b>contraposée</b> : (MN) n'est pas parallèle à (BC)."
    },
    {
      theoreme: 'pythagore_direct',
      body: "Dans un triangle ABC rectangle en C, on connaît l'aire (= AC × BC / 2) et l'hypoténuse AB. Peut-on retrouver AC et BC ?",
      a: "Oui, avec un système d'équations (aire + Pythagore)",
      opts: [
        "Oui, avec un système d'équations (aire + Pythagore)",
        "Oui, Pythagore seul suffit",
        "Oui, l'aire seule suffit",
        "Non, il manque une information"
      ],
      sol: "Deux inconnues AC et BC. Équation 1 : AC × BC = 2 × aire. Équation 2 (Pythagore) : AC² + BC² = AB². Deux équations, deux inconnues → <b>solvable</b>."
    }
  ];
  return _buildQCM(cases, 'Niveau ⚫ — Choisir le bon théorème');
}

/* Extrait le niveau 1..5 depuis le titre (🔴=1, 🟡=2, 🟢=3, 💚=4, ⚫=5). */
function _levelFromTitle(title) {
  if (title.includes('🔴')) return 1;
  if (title.includes('🟡')) return 2;
  if (title.includes('🟢')) return 3;
  if (title.includes('💚')) return 4;
  if (title.includes('⚫')) return 5;
  return 1;
}

/* Construit un objet question QCM standard à partir d'un tableau de cas */
function _buildQCM(cases, title) {
  const k = cases[Math.floor(Math.random() * cases.length)];
  const shuffled = shuffle(k.opts.map(o => ({ html: o, correct: o === k.a })));
  const correctIdx = shuffled.findIndex(c => c.correct);
  const figHtml = k.figure ? `<div class="geo-figure">${k.figure}</div>` : '';
  const level = _levelFromTitle(title);
  const help = (k.theoreme && makeHelp(k.theoreme, level)) || {
    cours: "<b>Raisonner</b> = choisir le bon outil pour chaque situation. <b>Direct</b> : je pars d'une propriété (rectangle, parallèle) pour calculer. <b>Réciproque</b> : je prouve la propriété à partir des longueurs. <b>Contraposée</b> : je prouve le contraire.",
    savoirFaire: "Demande-toi : <em>Qu'est-ce que je sais déjà ? Qu'est-ce que je veux montrer ?</em>",
    erreurs: ["Confondre direct et réciproque.", "Utiliser Pythagore sans triangle rectangle.", "Appliquer Thalès sans parallélisme."]
  };
  return {
    theme: 'raisonner', title,
    body: figHtml + k.body,
    type: 'qcm',
    choices: shuffled.map(c => c.html),
    correctIdx,
    solution: k.sol,
    help
  };
}

/* Lance une série de 5 questions d'un format/niveau donné */
let SKILL_FORMAT_GENERATORS = {
  'raisonner.theoreme.1': rais_theoreme_n1,
  'raisonner.theoreme.2': rais_theoreme_n2,
  'raisonner.theoreme.3': rais_theoreme_n3,
  'raisonner.theoreme.4': rais_theoreme_n4,
  'raisonner.theoreme.5': rais_theoreme_n5
};


/* ==========================================================================
   RAISONNER — Format B : Ordonner les étapes d'une démonstration
   Rendu drag-drop : chaque étape est une ligne déplaçable, l'élève les remet en ordre.
   ========================================================================== */

/* Helper : construit un exercice d'ordonnancement */
function _buildOrder(cases, title) {
  const k = cases[Math.floor(Math.random() * cases.length)];
  const n = k.steps.length;
  // Mélange : on renvoie les étapes dans un ordre aléatoire, l'élève doit retrouver l'ordre correct
  const shuffledIdx = shuffle(k.steps.map((_, i) => i));
  // Construit le HTML du drag-drop
  const items = shuffledIdx.map((origIdx, newPos) =>
    `<li class="order-item" draggable="true" data-orig="${origIdx}">
      <span class="order-handle">☰</span>
      <span class="order-text">${k.steps[origIdx]}</span>
    </li>`
  ).join('');
  const header = k.context ? `<div class="order-context">${k.context}</div>` : '';
  const figHtml = k.figure ? `<div class="geo-figure">${k.figure}</div>` : '';
  const level = _levelFromTitle(title);
  const help = (k.theoreme && makeHelp(k.theoreme, level)) || {
    cours: "Une démonstration suit un ordre logique : <ol><li>Énoncer ce qu'on sait.</li><li>Citer le théorème utilisé.</li><li>Appliquer la formule.</li><li>Calculer.</li><li>Conclure clairement.</li></ol>",
    savoirFaire: "Cherche d'abord l'étape qui introduit les données, puis la citation du théorème, puis les calculs, puis la conclusion.",
    erreurs: ["Placer la conclusion avant les calculs.", "Oublier de citer le théorème.", "Mélanger calcul et énoncé."]
  };
  return {
    theme: 'raisonner', title,
    body: `${figHtml}${header}<p><b>Remets les étapes de la démonstration dans le bon ordre</b> (glisse les lignes avec ☰ ou clique sur ↑/↓) :</p>
      <ol class="order-list" data-correct="${k.steps.map((_, i) => i).join(',')}">${items}</ol>
      <p class="note" style="margin-top:8px;font-size:0.8rem;">💡 Astuce : sur mobile, maintiens longtemps l'icône ☰ avant de glisser. Sur ordinateur, clic-glisser.</p>`,
    type: 'order',
    expected: k.steps.map((_, i) => i),
    solution: k.solution || `Ordre correct : <ol>${k.steps.map(s => `<li>${s}</li>`).join('')}</ol>`,
    help
  };
}

function rais_ordre_n1() {
  // Niveau Rouge : 3 étapes seulement, Pythagore direct
  const cases = [
    {
      theoreme: 'pythagore_direct',
      figure: svgTriangleRect({ sides: { AB: 'AB = 3 cm', BC: 'BC = 4 cm', AC: '?' } }),
      context: "On veut calculer la longueur AC dans le triangle ABC rectangle en B avec AB = 3 cm et BC = 4 cm.",
      steps: [
        "Le triangle ABC est rectangle en B. D'après le théorème de Pythagore : AC² = AB² + BC².",
        "AC² = 3² + 4² = 9 + 16 = 25.",
        "Donc AC = √25 = 5 cm."
      ]
    },
    {
      theoreme: 'pythagore_direct',
      figure: svgTriangleRect({ sides: { AB: 'AB = 8 cm', BC: 'AC = 6 cm', AC: '?' }, labels: { A:'A', B:'B', C:'C' } }),
      context: "On veut calculer BC dans le triangle rectangle en A avec AC = 6 et l'hypoténuse BC.  On connaît AB = 8.",
      steps: [
        "Le triangle ABC est rectangle en A, donc d'après Pythagore : BC² = AB² + AC².",
        "BC² = 8² + 6² = 64 + 36 = 100.",
        "BC = √100 = 10 cm."
      ]
    }
  ];
  return _buildOrder(cases, 'Niveau 🔴 — Ordonner une démonstration');
}

function rais_ordre_n2() {
  // Niveau Jaune : 4 étapes, Pythagore + phrase de conclusion obligatoire
  const cases = [
    {
      theoreme: 'pythagore_reciproque',
      figure: svgTriangleRect({ sides: { AB: '5 cm', BC: '12 cm', AC: '13 cm' } }),
      context: "Les trois côtés du triangle ABC mesurent AB = 5 cm, BC = 12 cm, AC = 13 cm. On veut montrer qu'il est rectangle.",
      steps: [
        "Le plus grand côté est AC (13 cm). On calcule AC² = 13² = 169.",
        "On calcule AB² + BC² = 5² + 12² = 25 + 144 = 169.",
        "On constate que AB² + BC² = AC² = 169.",
        "D'après la réciproque du théorème de Pythagore, le triangle ABC est rectangle en B."
      ]
    },
    {
      theoreme: 'pythagore_direct',
      figure: svgTriangleRect({ sides: { AB: '4 cm', BC: '3 cm', AC: '?' }, labels: { A:'A', B:'B', C:'C' } }),
      context: "Dans un triangle rectangle en A, AB = 4 cm et AC = 3 cm. On veut BC.",
      steps: [
        "Le triangle ABC est rectangle en A.",
        "D'après le théorème de Pythagore : BC² = AB² + AC².",
        "BC² = 4² + 3² = 16 + 9 = 25.",
        "BC = √25 = 5 cm."
      ]
    }
  ];
  return _buildOrder(cases, 'Niveau 🟡 — Ordonner une démonstration');
}

function rais_ordre_n3() {
  // Niveau Vert clair : 5 étapes, Thalès direct
  const cases = [
    {
      theoreme: 'thales_direct',
      figure: svgThales({ AB: 5, AC: 10, AD: 3, labels: { A:'A', B:'B', C:'C', D:'M', E:'N' } }),
      context: "Dans un triangle ABC, les points M et N appartiennent respectivement aux segments [AB] et [AC]. On sait que AM = 3, AB = 5, AN = 6 et (MN) // (BC). On veut calculer AC.",
      steps: [
        "Les droites (BM) et (CN) sont sécantes en A, et (MN) est parallèle à (BC).",
        "D'après le théorème de Thalès : AM / AB = AN / AC = MN / BC.",
        "On a donc 3/5 = 6/AC.",
        "Par produit en croix : AC × 3 = 5 × 6, donc AC = 30/3 = 10 cm.",
        "Conclusion : AC mesure 10 cm."
      ]
    },
    {
      theoreme: 'thales_direct',
      figure: svgThales({ AB: 10, AC: 12.5, AD: 4, labels: { A:'A', B:'B', C:'C', D:'M', E:'N' } }),
      context: "Dans le triangle ABC, M ∈ [AB] et N ∈ [AC] avec (MN) // (BC). AM = 4, MB = 6, AN = 5. Calculer NC.",
      steps: [
        "AB = AM + MB = 4 + 6 = 10.",
        "Les droites (AB) et (AC) sont sécantes en A et (MN) // (BC).",
        "D'après le théorème de Thalès : AM/AB = AN/AC.",
        "Soit 4/10 = 5/AC donc AC = 50/4 = 12,5.",
        "D'où NC = AC − AN = 12,5 − 5 = 7,5 cm."
      ]
    }
  ];
  return _buildOrder(cases, 'Niveau 🟢 — Ordonner une démonstration');
}

function rais_ordre_n4() {
  // Niveau Vert foncé : 6 étapes, réciproque de Thalès
  const cases = [
    {
      theoreme: 'thales_reciproque',
      figure: svgThales({ AB: 10, AC: 15, AD: 4, labels: { A:'A', B:'B', C:'C', D:'M', E:'N' } }),
      context: "Dans un triangle ABC, M est sur [AB] et N sur [AC]. On sait que AM = 4, AB = 10, AN = 6, AC = 15. On veut prouver que (MN) est parallèle à (BC).",
      steps: [
        "On identifie les points M et N sur les côtés [AB] et [AC] du triangle.",
        "On calcule le rapport AM/AB = 4/10 = 2/5.",
        "On calcule le rapport AN/AC = 6/15 = 2/5.",
        "On constate que AM/AB = AN/AC = 2/5.",
        "Les points A, M, B d'une part et A, N, C d'autre part sont alignés dans le même ordre.",
        "D'après la réciproque du théorème de Thalès, les droites (MN) et (BC) sont parallèles."
      ]
    }
  ];
  return _buildOrder(cases, 'Niveau 💚 — Ordonner une démonstration');
}

function rais_ordre_n5() {
  // Niveau Noir : 7 étapes, démonstration mixte (trigo + Pythagore)
  const cases = [
    {
      theoreme: 'trigonometrie',
      figure: svgTriangleRect({ sides: { AB: '?', BC: '10 cm', AC: '' }, angleAt: 'B' }),
      context: "Dans un triangle ABC rectangle en A, on connaît BC = 10 cm et l'angle \\(\\widehat{ABC} = 35°\\). On veut calculer AB.",
      steps: [
        "Le triangle ABC est rectangle en A.",
        "Dans un triangle rectangle, le cosinus d'un angle aigu = côté adjacent / hypoténuse.",
        "L'angle considéré est \\(\\widehat{ABC}\\). Son côté adjacent est AB, son hypoténuse est BC.",
        "Donc cos(35°) = AB / BC = AB / 10.",
        "D'où AB = 10 × cos(35°).",
        "À la calculatrice : cos(35°) ≈ 0,819.",
        "AB ≈ 10 × 0,819 ≈ 8,19 cm."
      ]
    }
  ];
  return _buildOrder(cases, 'Niveau ⚫ — Ordonner une démonstration');
}

/* ==========================================================================
   RAISONNER — Format C : Trouver l'erreur dans une démonstration
   ========================================================================== */

function _buildTrouveErreur(cases, title) {
  const k = cases[Math.floor(Math.random() * cases.length)];
  const n = k.steps.length;
  const erreurIdx = k.erreurIdx;
  const stepsHTML = k.steps.map((s, i) => `<li data-step="${i}"><b>Étape ${i+1}.</b> ${s}</li>`).join('');
  const { choices, correctIdx } = makeQCM(
    k.steps.map((_, i) => ({ html: `Étape ${i+1}`, correct: i === erreurIdx }))
  );
  const figHtml = k.figure ? `<div class="geo-figure">${k.figure}</div>` : '';
  const level = _levelFromTitle(title);
  const help = (k.theoreme && makeHelp(k.theoreme, level)) || {
    cours: "Vérifier une démonstration = lire ligne par ligne et se demander : <em>cette étape découle-t-elle logiquement des précédentes ?</em>",
    savoirFaire: "Repère les calculs, les signes, les citations de théorèmes et les phrases de conclusion.",
    erreurs: ["Ne lire que le résultat final.", "Oublier de vérifier chaque calcul.", "Faire confiance aveuglément à la première étape."]
  };
  return {
    theme: 'raisonner', title,
    body: `${figHtml}${k.context ? `<div class="order-context">${k.context}</div>` : ''}
      <p><b>Voici une démonstration qui contient <em>une seule erreur</em>.</b> Quelle étape est incorrecte ?</p>
      <ol class="demo-list">${stepsHTML}</ol>`,
    type: 'qcm',
    choices, correctIdx,
    solution: `L'erreur est à l'<b>étape ${erreurIdx + 1}</b>. ${k.explain}`,
    help
  };
}

function rais_erreur_n1() {
  // Niveau Rouge : erreurs de calcul et de méthode les plus fréquentes en 3ème
  const cases = [
    // --- PYTHAGORE : erreurs de calcul ---
    {
      theoreme: 'pythagore_direct',
      figure: svgTriangleRect({ sides: { AB: '6 cm', BC: '8 cm', AC: '?' } }),
      context: "Triangle ABC rectangle en B, AB = 6 cm, BC = 8 cm.",
      steps: [
        "D'après Pythagore : AC² = AB² + BC².",
        "AC² = 6² + 8² = 36 + 64 = 90.",
        "AC = √90 ≈ 9,49 cm."
      ],
      erreurIdx: 1,
      explain: "Erreur d'addition : 36 + 64 = <b>100</b>, pas 90. Donc AC² = 100 et AC = 10 cm."
    },
    {
      theoreme: 'pythagore_direct',
      figure: svgTriangleRect({ sides: { AB: '3', BC: '4', AC: '?' }, angleAt: 'A' }),
      context: "Triangle ABC rectangle en A, AB = 3 et AC = 4.",
      steps: [
        "Le triangle est rectangle en A donc BC est l'hypoténuse.",
        "D'après Pythagore : BC² = AB² + AC².",
        "BC² = 3 + 4 = 7 et BC = √7 cm."
      ],
      erreurIdx: 2,
      explain: "Erreur classique : on a oublié les <b>carrés</b>. BC² = 3² + 4² = 9 + 16 = 25, donc BC = 5 cm."
    },
    {
      theoreme: 'pythagore_direct',
      figure: svgTriangleRect({ sides: { AB: '5 cm', BC: '12 cm', AC: '?' } }),
      context: "Triangle ABC rectangle en B, AB = 5 cm, BC = 12 cm.",
      steps: [
        "D'après Pythagore : AC² = AB² + BC².",
        "AC² = 5² + 12² = 25 + 144 = 169.",
        "AC² = 169 cm."
      ],
      erreurIdx: 2,
      explain: "On a oublié la <b>racine carrée</b> à la fin ! AC² = 169 veut dire AC = √169 = 13 cm. Très fréquent : ne pas confondre le carré d'une longueur avec la longueur elle-même."
    },
    {
      theoreme: 'pythagore_direct',
      figure: svgTriangleRect({ sides: { AB: '8 cm', BC: '?', AC: '10 cm' }, angleAt: 'B' }),
      context: "Triangle ABC rectangle en B, AB = 8 cm, AC = 10 cm (hypoténuse). On cherche BC.",
      steps: [
        "L'hypoténuse est AC. D'après Pythagore : AC² = AB² + BC².",
        "BC² = AC² + AB² = 100 + 64 = 164.",
        "BC = √164 ≈ 12,8 cm."
      ],
      erreurIdx: 1,
      explain: "Erreur de signe : on <b>additionne</b> les carrés des côtés de l'angle droit, mais quand on cherche un côté non-hypoténuse, il faut <b>soustraire</b>. BC² = AC² − AB² = 100 − 64 = 36, donc BC = 6 cm."
    },
    {
      theoreme: 'pythagore_direct',
      figure: svgTriangleRect({ sides: { AB: '9 cm', BC: '12 cm', AC: '?' } }),
      context: "Triangle ABC rectangle en B, AB = 9 cm, BC = 12 cm.",
      steps: [
        "D'après Pythagore : AC² = AB² + BC².",
        "AC² = 9² + 12² = 81 + 144 = 225.",
        "AC = 225 cm."
      ],
      erreurIdx: 2,
      explain: "Encore l'oubli de la <b>racine</b> : 225 est la valeur de AC², pas de AC. AC = √225 = 15 cm."
    },
    // --- PYTHAGORE : mauvaise identification de l'hypoténuse ---
    {
      theoreme: 'pythagore_reciproque',
      figure: svgTriangleRect({ sides: { AB: '5', BC: '13', AC: '12' }, angleAt: 'B' }),
      context: "Triangle ABC rectangle en B, AB = 5, BC = 13, AC = 12.",
      steps: [
        "L'hypoténuse est le plus grand côté : BC = 13.",
        "D'après Pythagore : AB² + AC² = BC².",
        "On vérifie : 5² + 12² = 25 + 144 = 169 et 13² = 169.",
        "Le triangle est donc rectangle en B."
      ],
      erreurIdx: 3,
      explain: "L'égalité de Pythagore est bien vérifiée, mais pour conclure qu'un triangle est rectangle <b>à partir des longueurs</b>, il faut utiliser la <b>réciproque</b> du théorème de Pythagore, pas le théorème direct. Et le triangle serait rectangle en A (sommet opposé à l'hypoténuse BC), pas en B."
    },
    // --- CALCUL DE CARRÉ ---
    {
      theoreme: 'pythagore_direct',
      figure: svgTriangleRect({ sides: { AB: '7', BC: '24', AC: '?' } }),
      context: "Triangle ABC rectangle en B, AB = 7 cm, BC = 24 cm.",
      steps: [
        "D'après Pythagore : AC² = AB² + BC².",
        "AC² = 7² + 24² = 14 + 48 = 62.",
        "AC = √62 ≈ 7,87 cm."
      ],
      erreurIdx: 1,
      explain: "Erreur sur les carrés : <b>7² = 49</b> (pas 14) et <b>24² = 576</b> (pas 48). On confond avec × 2. Le bon calcul : 49 + 576 = 625, donc AC = 25 cm."
    },
    // --- TRIGONOMÉTRIE : formules ---
    {
      theoreme: 'trigonometrie',
      figure: svgTriangleRect({ sides: { AB: '4', BC: '3', AC: '5' }, angleAt: 'A' }),
      context: "Dans ABC rectangle en A : AB = 4, AC = 3, BC = 5. On cherche cos(ABC).",
      steps: [
        "L'hypoténuse du triangle est BC = 5.",
        "Le côté adjacent à l'angle B est AC (le côté opposé à l'angle A).",
        "cos(ABC) = adjacent / hypoténuse = AC / BC = 3/5."
      ],
      erreurIdx: 1,
      explain: "Le côté <b>adjacent</b> à l'angle B, c'est le côté qui <b>touche</b> B (hors de l'hypoténuse). C'est donc <b>AB = 4</b>, pas AC. Le bon cosinus est cos(ABC) = AB/BC = 4/5."
    },
    {
      theoreme: 'trigonometrie',
      figure: svgTriangleRect({ sides: { AB: '3', BC: '4', AC: '5' }, angleAt: 'A' }),
      context: "Dans ABC rectangle en A : AB = 3, AC = 4, BC = 5. On cherche sin(ABC).",
      steps: [
        "L'hypoténuse est BC.",
        "Le côté opposé à l'angle B est AC.",
        "sin(ABC) = opposé / adjacent = AC / AB = 4/3."
      ],
      erreurIdx: 2,
      explain: "Erreur de formule : <b>sinus = opposé / hypoténuse</b> (pas / adjacent). On a confondu avec la tangente. Le bon sinus : sin(ABC) = AC/BC = 4/5."
    },
    // --- THÉORÈME DE THALÈS : mise en équation ---
    {
      theoreme: 'thales_direct',
      figure: svgThales({ AB: 10, AC: 15, AD: 4, labels: { A:'A', B:'B', C:'C', D:'M', E:'N' } }),
      context: "Dans le triangle ABC : M ∈ [AB], N ∈ [AC] et (MN) // (BC). AM = 4, AB = 10, AN = 6. Calculer AC.",
      steps: [
        "D'après le théorème de Thalès : AM / AB = AN / AC.",
        "Donc 4 / 10 = AC / 6.",
        "AC = 6 × 4 / 10 = 2,4 cm."
      ],
      erreurIdx: 1,
      explain: "On a <b>inversé</b> le rapport : la règle de Thalès écrite à l'étape 1 est AM/AB = AN/<b>AC</b>. Il faut donc écrire 4/10 = 6/AC (l'inconnue AC au dénominateur, en face de AB). On obtient AC = 10 × 6 / 4 = 15 cm."
    },
    // --- ANGLES ET TRIANGLES ---
    {
      theoreme: 'sommes_angles',
      context: "Dans un triangle ABC, on sait que l'angle Â = 60° et l'angle B̂ = 40°. On cherche l'angle Ĉ.",
      steps: [
        "La somme des angles d'un triangle vaut 360°.",
        "Donc Ĉ = 360 − 60 − 40 = 260°.",
        "L'angle Ĉ mesure 260°."
      ],
      erreurIdx: 0,
      explain: "La somme des angles d'un triangle est <b>180°</b>, pas 360° (ça c'est pour un quadrilatère). Ici : Ĉ = 180 − 60 − 40 = 80°."
    },
    {
      theoreme: 'pythagore_direct',
      context: "Un triangle a deux côtés qui mesurent 7 cm et 10 cm, et un angle droit entre eux. Quel est le périmètre ?",
      steps: [
        "Les deux côtés de l'angle droit sont 7 cm et 10 cm.",
        "L'hypoténuse est h tel que h² = 7² + 10² = 49 + 100 = 149, donc h = √149 ≈ 12,2 cm.",
        "Le périmètre est la somme des aires : 7 × 10 + 12,2 = 82,2 cm."
      ],
      erreurIdx: 2,
      explain: "Confusion <b>aire / périmètre</b>. Le <b>périmètre</b> = somme des <b>longueurs</b> des 3 côtés. P = 7 + 10 + 12,2 ≈ 29,2 cm. « 7 × 10 » c'est l'aire du rectangle, pas le périmètre."
    },
    // --- CALCULS NUMÉRIQUES ---
    {
      theoreme: 'aire_vs_perimetre',
      context: "Calcul de la longueur AB d'un cercle de rayon 3 cm.",
      steps: [
        "Le périmètre d'un cercle vaut P = π × D où D est le diamètre.",
        "Le diamètre vaut D = 2 × 3 = 6 cm.",
        "P = π × 6 = 6π ≈ 18,85 cm.",
        "Donc AB mesure 18,85 cm."
      ],
      erreurIdx: 3,
      explain: "La longueur <b>AB</b> n'est pas précisée dans l'énoncé ! Si A et B sont deux points du cercle, il faut savoir lesquels. Si AB est un <b>diamètre</b>, alors AB = 6 cm. Si AB est la <b>circonférence</b> complète, alors AB ≈ 18,85 cm. La question est ambiguë mais en général on cherche le périmètre (circonférence)."
    },
    // --- UNITÉS ---
    {
      theoreme: 'pythagore_direct',
      context: "Calculer l'aire d'un rectangle de 5 m de long et 3 m de large.",
      steps: [
        "L'aire vaut A = longueur × largeur.",
        "A = 5 × 3 = 15.",
        "L'aire mesure 15 m."
      ],
      erreurIdx: 2,
      explain: "L'<b>unité d'aire</b> est m<b>²</b> (mètres carrés), pas m (mètres linéaires). L'aire mesure 15 m². Très fréquent : oublier le « carré » à l'unité."
    },
    {
      theoreme: 'conversions_aire',
      context: "Un terrain mesure 150 m². Combien cela fait-il en km² ?",
      steps: [
        "1 km = 1 000 m, donc 1 km² = 1 000 m².",
        "150 m² = 150 / 1 000 = 0,15 km²."
      ],
      erreurIdx: 0,
      explain: "Pour les <b>aires</b>, les facteurs de conversion sont <b>au carré</b> : 1 km = 1 000 m implique 1 km² = 1 000² m² = 1 000 000 m² (un million). Donc 150 m² = 150 / 1 000 000 = 0,000 150 km²."
    },
    // --- FRACTIONS ---
    {
      theoreme: 'fractions_somme',
      context: "Calcul : 1/2 + 1/3.",
      steps: [
        "On additionne les numérateurs et les dénominateurs.",
        "1/2 + 1/3 = (1+1)/(2+3) = 2/5."
      ],
      erreurIdx: 0,
      explain: "Erreur TRÈS fréquente : on n'<b>ajoute pas</b> les dénominateurs ! Il faut d'abord un <b>dénominateur commun</b>. 1/2 + 1/3 = 3/6 + 2/6 = 5/6."
    },
    // --- PUISSANCES ---
    {
      theoreme: 'puissances_signe',
      context: "Calcul : (−3)².",
      steps: [
        "Un carré est toujours positif.",
        "(−3)² = −3 × 3 = −9."
      ],
      erreurIdx: 1,
      explain: "Piège : (−3)² = (−3) × (−3) = <b>+9</b> (signe moins × signe moins = plus). L'étape 1 dit la bonne règle mais l'étape 2 la contredit. Attention aux parenthèses : −3² est différent de (−3)²."
    }
  ];
  return _buildTrouveErreur(cases, 'Niveau 🔴 — Trouver l\'erreur');
}

function rais_erreur_n2() {
  // Niveau Jaune : erreur dans l'application d'un théorème
  const cases = [
    {
      theoreme: 'pythagore_reciproque',
      figure: svgTriangleRect({ sides: { AB: '6', BC: '8', AC: '10' } }),
      context: "On veut montrer que le triangle ABC avec AB = 6, BC = 8, AC = 10 est rectangle.",
      steps: [
        "Le plus grand côté est AC.",
        "On calcule AC² = 10² = 100.",
        "On calcule AB² + BC² = 6² + 8² = 36 + 64 = 100.",
        "D'après le <b>théorème de Pythagore</b>, le triangle est rectangle en B."
      ],
      erreurIdx: 3,
      explain: "On part des trois longueurs et on veut <b>prouver</b> que le triangle est rectangle. C'est la <b>réciproque</b> du théorème de Pythagore qu'il faut citer, pas le théorème direct."
    },
    {
      theoreme: 'thales_direct',
      figure: svgThales({ AB: 6, AC: 8, AD: 3, labels: { A:'A', B:'B', C:'C', D:'M', E:'N' } }),
      context: "Dans le triangle ABC, M ∈ [AB], N ∈ [AC] et (MN) // (BC). AM = 3, AB = 6, AN = 4. Calcul de AC.",
      steps: [
        "Les droites (AB) et (AC) sont sécantes en A et (MN) // (BC).",
        "D'après Thalès : AM/MB = AN/NC.",
        "3/3 = 4/NC donc NC = 4 cm.",
        "AC = AN + NC = 4 + 4 = 8 cm."
      ],
      erreurIdx: 1,
      explain: "La relation de Thalès s'écrit AM/<b>AB</b> = AN/<b>AC</b> (pas avec MB et NC). Le numérateur et le dénominateur doivent être <em>de même côté</em> de A."
    }
  ];
  return _buildTrouveErreur(cases, 'Niveau 🟡 — Trouver l\'erreur');
}

function rais_erreur_n3() {
  // Niveau Vert clair : erreur subtile sur les hypothèses
  const cases = [
    {
      theoreme: 'pythagore_direct',
      figure: svgTriangleRect({ sides: { AB: '5', BC: '12', AC: '13' } }),
      context: "ABC est un triangle avec AB = 5, BC = 12, AC = 13.",
      steps: [
        "D'après le théorème de Pythagore : AC² = AB² + BC².",
        "On vérifie : 13² = 169 et 5² + 12² = 25 + 144 = 169.",
        "L'égalité est vérifiée, donc ABC est rectangle en B."
      ],
      erreurIdx: 0,
      explain: "Le théorème de Pythagore (direct) suppose <em>déjà</em> que le triangle est rectangle. Or ici on ne le sait pas au départ. On doit utiliser la <b>réciproque</b> : c'est en constatant l'égalité qu'on conclut que le triangle est rectangle."
    },
    {
      theoreme: 'trigonometrie',
      figure: svgTriangleRect({ sides: { AB: '3', BC: '4', AC: '5' }, angleAt: 'A' }),
      context: "Dans un triangle ABC rectangle en A, on cherche cos(B̂) avec AB = 3, AC = 4, BC = 5.",
      steps: [
        "Dans le triangle rectangle en A, l'hypoténuse est BC.",
        "L'angle B̂ a pour côté adjacent AB et pour côté opposé AC.",
        "cos(B̂) = AC / BC = 4/5 = 0,8."
      ],
      erreurIdx: 2,
      explain: "cos = adjacent/hypoténuse. Le côté adjacent à B̂ est <b>AB</b>, pas AC. Donc cos(B̂) = AB/BC = 3/5 = 0,6."
    }
  ];
  return _buildTrouveErreur(cases, 'Niveau 🟢 — Trouver l\'erreur');
}

function rais_erreur_n4() {
  // Niveau Vert foncé : erreur logique dans l'enchaînement
  const cases = [
    {
      theoreme: 'thales_reciproque',
      figure: svgThales({ AB: 2, AC: 2, AD: 1, labels: { A:'A', B:'B', C:'C', D:'M', E:'N' } }),
      context: "Dans un triangle ABC, M ∈ [AB] avec AM/AB = 1/2, N ∈ [AC] avec AN/AC = 1/2. On veut savoir si (MN) // (BC).",
      steps: [
        "On calcule AM/AB et AN/AC.",
        "On trouve AM/AB = 1/2 et AN/AC = 1/2.",
        "Les deux rapports sont égaux.",
        "Les points A, M, B et A, N, C sont alignés dans le même ordre.",
        "D'après le <b>théorème</b> de Thalès, les droites (MN) et (BC) sont parallèles."
      ],
      erreurIdx: 4,
      explain: "On <em>prouve</em> le parallélisme à partir des rapports, c'est donc la <b>réciproque</b> du théorème de Thalès qu'il faut invoquer, pas le théorème direct."
    },
    {
      theoreme: 'pythagore_contraposee',
      figure: svgTriangleRect({ sides: { AB: '6', BC: '7', AC: '9' } }),
      context: "Démonstration que le triangle ABC avec AB=6, BC=7, AC=9 n'est pas rectangle.",
      steps: [
        "Le plus grand côté est AC = 9.",
        "AC² = 9² = 81.",
        "AB² + BC² = 6² + 7² = 36 + 49 = 85.",
        "On a AB² + BC² ≠ AC², donc d'après le théorème de Pythagore, le triangle n'est pas rectangle."
      ],
      erreurIdx: 3,
      explain: "On utilise ici le raisonnement par la <b>contraposée</b> du théorème de Pythagore : « si le triangle était rectangle, on aurait AB²+BC² = AC². Or ce n'est pas le cas, donc il n'est pas rectangle. » Citer le théorème direct est une erreur de logique."
    }
  ];
  return _buildTrouveErreur(cases, 'Niveau 💚 — Trouver l\'erreur');
}

function rais_erreur_n5() {
  // Niveau Noir : erreur très subtile (ordre d'alignement, unités)
  const cases = [
    {
      theoreme: 'thales_reciproque',
      context: "Dans la configuration papillon : A, M, B d'un côté et A, N, C de l'autre. AM=3, AB=6, AN=4, AC=8.",
      steps: [
        "AM/AB = 3/6 = 1/2.",
        "AN/AC = 4/8 = 1/2.",
        "Les deux rapports sont égaux.",
        "D'après la réciproque du théorème de Thalès, les droites (MN) et (BC) sont parallèles."
      ],
      erreurIdx: 3,
      explain: "Dans la <b>configuration papillon</b>, la réciproque de Thalès demande une condition supplémentaire : <b>les points doivent être alignés dans le même ordre ou en ordres inverses</b>. Sans préciser l'alignement, la conclusion n'est pas rigoureuse. Il faut étudier les positions de M et N par rapport à A."
    },
    {
      theoreme: 'pythagore_direct',
      context: "Dans un triangle ABC rectangle en A, AC = 3 m et BC = 5 m (hypoténuse). On veut AB en mètres.",
      steps: [
        "D'après Pythagore : BC² = AB² + AC².",
        "25 = AB² + 9.",
        "AB² = 16.",
        "AB = 4.",
        "AB mesure donc 4 cm."
      ],
      erreurIdx: 4,
      explain: "Les longueurs étaient en <b>mètres</b> (pas en cm) ! Il fallait écrire AB = 4 <b>m</b>. Toujours vérifier l'unité à la fin."
    }
  ];
  return _buildTrouveErreur(cases, 'Niveau ⚫ — Trouver l\'erreur');
}

/* ==========================================================================
   RAISONNER — Format D : Vrai / Faux justifié
   ========================================================================== */

function _buildVF(cases, title) {
  const k = cases[Math.floor(Math.random() * cases.length)];
  const { choices, correctIdx } = makeQCM([
    { html: `✅ <b>Vrai</b> — ${k.vraiRaison}`, correct: k.estVrai === true && k.justeVraie === true },
    { html: `❌ <b>Faux</b> — ${k.fauxRaison}`, correct: k.estVrai === false && k.justeVraie === false },
    { html: `✅ Vrai — ${k.vraiFausseRaison || 'mauvaise justification 1'}`, correct: false },
    { html: `❌ Faux — ${k.fauxFausseRaison || 'mauvaise justification 2'}`, correct: false }
  ]);
  const figHtml = k.figure ? `<div class="geo-figure">${k.figure}</div>` : '';
  const level = _levelFromTitle(title);
  const help = (k.theoreme && makeHelp(k.theoreme, level)) || {
    cours: "<b>Vrai / Faux justifié</b> : un simple « vrai » ou « faux » ne suffit pas. Il faut une <b>raison</b> : énoncé d'un théorème, contre-exemple, calcul précis.",
    savoirFaire: "Pour prouver qu'une affirmation est <b>fausse</b>, un <b>contre-exemple</b> suffit. Pour la prouver <b>vraie</b>, il faut un raisonnement général.",
    erreurs: ["Bonne conclusion mais mauvaise justification.", "Confondre « il existe » et « pour tout ».", "Prouver une affirmation générale avec un seul cas particulier."]
  };
  return {
    theme: 'raisonner', title,
    body: `${figHtml}<div class="order-context"><b>Affirmation :</b> ${k.affirmation}</div>
      <p>Est-elle vraie ou fausse ? <b>Choisis la bonne justification.</b></p>`,
    type: 'qcm',
    choices, correctIdx,
    solution: `${k.estVrai ? '✅ Vrai' : '❌ Faux'}. ${k.estVrai ? k.vraiRaison : k.fauxRaison}`,
    help
  };
}

function rais_vf_n1() {
  // Niveau Rouge : énoncé simple, vrai/faux évident
  const cases = [
    {
      theoreme: 'sommes_angles',
      affirmation: "Dans tout triangle, la somme des angles est 180°.",
      estVrai: true,
      justeVraie: true,
      vraiRaison: "c'est une propriété générale vraie pour tous les triangles (propriété du cours).",
      fauxRaison: "seulement pour les triangles rectangles.",
      vraiFausseRaison: "parce qu'un triangle a 3 angles de 60°.",
      fauxFausseRaison: "c'est 360°, pas 180°."
    },
    {
      theoreme: 'aire_vs_perimetre',
      affirmation: "Un triangle rectangle a deux côtés perpendiculaires.",
      estVrai: true,
      justeVraie: true,
      vraiRaison: "par définition, un triangle rectangle a un angle droit, donc deux côtés (les côtés de l'angle droit) perpendiculaires.",
      fauxRaison: "non, un triangle rectangle n'a pas d'angle droit.",
      vraiFausseRaison: "c'est toujours un triangle équilatéral.",
      fauxFausseRaison: "les 3 côtés sont perpendiculaires."
    }
  ];
  return _buildVF(cases, 'Niveau 🔴 — Vrai / Faux justifié');
}

function rais_vf_n2() {
  // Niveau Jaune : affirmations avec nuances
  const cases = [
    {
      theoreme: 'pythagore_reciproque',
      affirmation: "Si un triangle a trois côtés de longueurs 3, 4, 5, alors il est rectangle.",
      estVrai: true,
      justeVraie: true,
      vraiRaison: "car 3² + 4² = 9 + 16 = 25 = 5². D'après la réciproque de Pythagore, le triangle est rectangle.",
      fauxRaison: "car 3+4+5 = 12.",
      vraiFausseRaison: "parce que les longueurs sont entières.",
      fauxFausseRaison: "on ne peut pas le savoir sans plus d'informations."
    },
    {
      theoreme: 'thales_reciproque',
      affirmation: "Si deux rapports AM/AB et AN/AC sont égaux, alors (MN) // (BC).",
      estVrai: false,
      justeVraie: false,
      vraiRaison: "par la réciproque de Thalès directement.",
      fauxRaison: "la réciproque de Thalès exige aussi que les points soient alignés <b>dans le même ordre</b>. Sans cette condition, ce n'est pas toujours vrai.",
      vraiFausseRaison: "parce que les rapports sont des nombres égaux.",
      fauxFausseRaison: "car Thalès ne s'applique qu'avec 3 rapports."
    }
  ];
  return _buildVF(cases, 'Niveau 🟡 — Vrai / Faux justifié');
}

function rais_vf_n3() {
  // Niveau Vert clair : nuances plus fines (contraposée vs direct)
  const cases = [
    {
      theoreme: 'pythagore_contraposee',
      affirmation: "Si dans un triangle ABC on a AB² + BC² ≠ AC², alors ABC n'est pas rectangle.",
      estVrai: false,
      justeVraie: false,
      vraiRaison: "d'après la contraposée du théorème de Pythagore.",
      fauxRaison: "la contraposée de Pythagore dit que si AB²+BC² ≠ AC² alors ABC n'est pas rectangle <b>en B</b>. Mais il pourrait être rectangle en un autre sommet (A ou C).",
      vraiFausseRaison: "parce que les carrés sont différents.",
      fauxFausseRaison: "il faut utiliser Thalès."
    },
    {
      theoreme: 'pythagore_direct',
      affirmation: "Un triangle avec un angle de 90° a nécessairement un côté de longueur entière.",
      estVrai: false,
      justeVraie: false,
      vraiRaison: "d'après Pythagore, il a toujours des longueurs entières.",
      fauxRaison: "contre-exemple : un triangle rectangle d'hypoténuse √2 et de côtés 1 et 1 n'a pas que des longueurs entières.",
      vraiFausseRaison: "car les angles sont entiers.",
      fauxFausseRaison: "parce qu'un triangle rectangle n'existe pas avec un angle de 90°."
    }
  ];
  return _buildVF(cases, 'Niveau 🟢 — Vrai / Faux justifié');
}

function rais_vf_n4() {
  // Niveau Vert foncé : distinguer direct / réciproque / contraposée
  const cases = [
    {
      theoreme: 'pythagore_direct',
      affirmation: "Si ABC est rectangle en A, alors BC est l'hypoténuse.",
      estVrai: true,
      justeVraie: true,
      vraiRaison: "l'hypoténuse est le côté opposé à l'angle droit. Si l'angle droit est en A, le côté opposé est [BC].",
      fauxRaison: "l'hypoténuse est toujours le plus petit côté.",
      vraiFausseRaison: "par le théorème de Pythagore direct.",
      fauxFausseRaison: "car l'hypoténuse est AC."
    },
    {
      theoreme: 'pythagore_direct',
      affirmation: "Dans un triangle rectangle, le cosinus d'un angle aigu peut être supérieur à 1.",
      estVrai: false,
      justeVraie: false,
      vraiRaison: "pour de très grands angles aigus.",
      fauxRaison: "le cosinus = adjacent/hypoténuse. Or l'hypoténuse est toujours le plus grand côté, donc adjacent/hypoténuse < 1. Le cosinus d'un angle aigu est toujours entre 0 et 1 (strictement).",
      vraiFausseRaison: "pour un angle de 89°.",
      fauxFausseRaison: "le cosinus est toujours négatif."
    }
  ];
  return _buildVF(cases, 'Niveau 💚 — Vrai / Faux justifié');
}

function rais_vf_n5() {
  // Niveau Noir : pièges très fins
  const cases = [
    {
      theoreme: 'aire_vs_perimetre',
      affirmation: "Si deux triangles ont leurs 3 côtés deux à deux proportionnels, alors ils sont semblables.",
      estVrai: true,
      justeVraie: true,
      vraiRaison: "c'est la définition même des triangles semblables : côtés proportionnels deux à deux.",
      fauxRaison: "il faut aussi que les angles soient égaux.",
      vraiFausseRaison: "parce que les triangles se ressemblent.",
      fauxFausseRaison: "ils sont seulement égaux s'ils ont la même aire."
    },
    {
      theoreme: 'thales_direct',
      affirmation: "Si deux triangles sont semblables et que le rapport des longueurs est k, alors le rapport des aires est k².",
      estVrai: true,
      justeVraie: true,
      vraiRaison: "dans un agrandissement de rapport k, les longueurs sont multipliées par k et les aires par k².",
      fauxRaison: "le rapport des aires est aussi k.",
      vraiFausseRaison: "par Thalès.",
      fauxFausseRaison: "c'est k³ pour les aires."
    },
    {
      affirmation: "Un triangle équilatéral peut être rectangle.",
      estVrai: false,
      justeVraie: false,
      vraiRaison: "oui si les 3 côtés sont très courts.",
      fauxRaison: "un triangle équilatéral a 3 angles de 60° chacun. Aucun n'est égal à 90°. Il ne peut donc pas être rectangle.",
      vraiFausseRaison: "si tous les angles sont droits.",
      fauxFausseRaison: "car un triangle équilatéral n'existe pas."
    }
  ];
  return _buildVF(cases, 'Niveau ⚫ — Vrai / Faux justifié');
}

/* ==========================================================================
   REPRÉSENTER — Lecture graphique (5 niveaux)
   ========================================================================== */

/* Helper : QCM clé en main pour représenter */
function _repr_qcm({ title, body, goodHtml, distractors, solution, help }) {
  const all = [{ html: goodHtml, correct: true }]
    .concat(distractors.map(h => ({ html: h, correct: false })));
  const { choices, correctIdx } = makeQCM(all);
  return { theme: 'representer', title, body, type: 'qcm', choices, correctIdx, solution, help };
}

function repr_lecture_n1() {
  // 🔴 Découverte — lire une image sur une droite simple d'une courbe donnée en tableau
  const cases = [
    { x: 2, fx: 5, context: 'La courbe de f passe par le point \\(A(2\\,;\\,5)\\).' },
    { x: 3, fx: 7, context: 'On lit sur le graphique que la courbe passe par \\(B(3\\,;\\,7)\\).' },
    { x: 1, fx: 4, context: 'La courbe de f passe par le point \\((1\\,;\\,4)\\).' }
  ];
  const k = pick(cases);
  return _repr_qcm({
    title: 'Niveau 🔴 — Lire une image',
    body: `${k.context}<br>Quelle est la valeur de \\(f(${k.x})\\) ?`,
    goodHtml: `\\(f(${k.x}) = ${k.fx}\\)`,
    distractors: [
      `\\(f(${k.x}) = ${k.x}\\)`,
      `\\(f(${k.fx}) = ${k.x}\\)`,
      `\\(f(${k.x}) = ${k.fx + 1}\\)`
    ],
    solution: `Lire l'image, c'est lire l'ordonnée du point dont l'abscisse est ${k.x} : \\(f(${k.x}) = ${k.fx}\\).`,
    help: {
      cours: "<b>Image</b> d'un nombre \\(a\\) : c'est l'ordonnée du point de la courbe d'abscisse \\(a\\), notée \\(f(a)\\).",
      savoirFaire: "Trouver \\(a\\) sur l'axe des abscisses, monter jusqu'à la courbe, lire l'ordonnée.",
      erreurs: ["Lire l'antécédent au lieu de l'image.", "Confondre axes x et y.", "Inverser les coordonnées."]
    }
  });
}

function repr_lecture_n2() {
  // 🟡 Apprentissage — antécédent simple
  const cases = [
    { y: 3, x: 1, context: 'La courbe de f passe par les points \\((1\\,;\\,3)\\), \\((2\\,;\\,5)\\), \\((4\\,;\\,9)\\).' },
    { y: 5, x: 2, context: 'La courbe de f passe par les points \\((1\\,;\\,3)\\), \\((2\\,;\\,5)\\), \\((4\\,;\\,9)\\).' },
    { y: 9, x: 4, context: 'La courbe de f passe par les points \\((1\\,;\\,3)\\), \\((2\\,;\\,5)\\), \\((4\\,;\\,9)\\).' }
  ];
  const k = pick(cases);
  return _repr_qcm({
    title: 'Niveau 🟡 — Trouver un antécédent',
    body: `${k.context}<br>Quel est l'antécédent de <b>${k.y}</b> par \\(f\\) ?`,
    goodHtml: `\\(${k.x}\\)`,
    distractors: [`\\(${k.y}\\)`, `\\(${k.y - 1}\\)`, `\\(${k.x + 1}\\)`],
    solution: `On cherche \\(x\\) tel que \\(f(x) = ${k.y}\\). D'après le tableau : \\(x = ${k.x}\\).`,
    help: {
      cours: "<b>Antécédent</b> d'un nombre \\(b\\) par \\(f\\) : c'est un nombre \\(x\\) tel que \\(f(x) = b\\). Géométriquement, on part de \\(b\\) sur l'axe des ordonnées, on va jusqu'à la courbe, on redescend sur l'axe des abscisses.",
      savoirFaire: "Lire en ordonnée, chercher la correspondance sur la courbe, descendre sur l'axe des x.",
      erreurs: ["Lire l'image au lieu de l'antécédent.", "Oublier qu'un nombre peut avoir plusieurs antécédents.", "Confondre avec \\(f(b)\\)."]
    }
  });
}

function repr_lecture_n3() {
  // 🟢 Confirmé — droite : image / antécédent pour fonction affine
  const a = pick([2, -1, 3, -2]);
  const b = pick([1, 0, -2, 3]);
  const x0 = pick([1, 2, 3, -1]);
  const y0 = a * x0 + b;
  return _repr_qcm({
    title: 'Niveau 🟢 — Fonction affine et lecture',
    body: `On considère la fonction affine \\(f(x) = ${a}x ${b >= 0 ? '+ ' + b : '- ' + (-b)}\\).<br>Quelle est la valeur de \\(f(${x0})\\) ?`,
    goodHtml: `\\(${y0}\\)`,
    distractors: [`\\(${y0 + 1}\\)`, `\\(${a + b}\\)`, `\\(${-y0}\\)`],
    solution: `On remplace \\(x\\) par ${x0} : \\(f(${x0}) = ${a} \\times ${x0} ${b >= 0 ? '+ ' + b : '- ' + (-b)} = ${a*x0} ${b >= 0 ? '+ ' + b : '- ' + (-b)} = ${y0}\\).`,
    help: {
      cours: "<b>Fonction affine</b> \\(f(x) = ax + b\\) : \\(a\\) est le coefficient directeur, \\(b\\) l'ordonnée à l'origine.",
      savoirFaire: "Substituer la valeur, attention aux signes et à la règle des signes.",
      erreurs: ["Oublier d'ajouter \\(b\\).", "Se tromper de signe.", "Inverser \\(a\\) et \\(b\\)."]
    }
  });
}

function repr_lecture_n4() {
  // 💚 Maîtrise — lire le coefficient directeur
  const pts = pick([
    { p1: [0, 1], p2: [2, 5], a: 2, b: 1 },
    { p1: [0, 3], p2: [4, 7], a: 1, b: 3 },
    { p1: [0, 5], p2: [1, 2], a: -3, b: 5 },
    { p1: [0, -1], p2: [3, 5], a: 2, b: -1 }
  ]);
  return _repr_qcm({
    title: 'Niveau 💚 — Coefficient directeur',
    body: `Une droite \\((d)\\) passe par les points \\(A(${pts.p1[0]}\\,;\\,${pts.p1[1]})\\) et \\(B(${pts.p2[0]}\\,;\\,${pts.p2[1]})\\).<br>Quel est le coefficient directeur de \\((d)\\) ?`,
    goodHtml: `\\(${pts.a}\\)`,
    distractors: [`\\(${pts.b}\\)`, `\\(${-pts.a}\\)`, `\\(\\dfrac{1}{${pts.a}}\\)`],
    solution: `Formule : \\(a = \\dfrac{y_B - y_A}{x_B - x_A} = \\dfrac{${pts.p2[1]} - ${pts.p1[1]}}{${pts.p2[0]} - ${pts.p1[0]}} = ${pts.a}\\).`,
    help: {
      cours: "Coefficient directeur d'une droite passant par \\(A(x_A;y_A)\\) et \\(B(x_B;y_B)\\) : \\(a = \\dfrac{y_B - y_A}{x_B - x_A}\\).",
      savoirFaire: "Calculer la différence des ordonnées / différence des abscisses.",
      erreurs: ["Inverser numérateur et dénominateur.", "Oublier le signe.", "Confondre avec \\(b\\) (ordonnée à l'origine)."]
    }
  });
}

function repr_lecture_n5() {
  // ⚫ Expert — équation de droite à partir de deux points
  const pts = pick([
    { p1: [1, 4], p2: [3, 10], eq: 'y = 3x + 1', wrongs: ['y = 3x + 4', 'y = 2x + 2', 'y = x + 3'] },
    { p1: [0, 2], p2: [4, -6], eq: 'y = -2x + 2', wrongs: ['y = 2x + 2', 'y = -2x - 2', 'y = -x + 2'] },
    { p1: [0, 5], p2: [2, 5], eq: 'y = 5', wrongs: ['x = 5', 'y = x + 5', 'y = 2x + 5'] },
    { p1: [1, 3], p2: [2, 5], eq: 'y = 2x + 1', wrongs: ['y = 2x + 3', 'y = x + 2', 'y = 3x + 2'] }
  ]);
  return _repr_qcm({
    title: 'Niveau ⚫ — Équation d\'une droite',
    body: `Une droite passe par les points \\(A(${pts.p1[0]}\\,;\\,${pts.p1[1]})\\) et \\(B(${pts.p2[0]}\\,;\\,${pts.p2[1]})\\).<br>Quelle est son équation ?`,
    goodHtml: `\\(${pts.eq}\\)`,
    distractors: pts.wrongs.map(w => `\\(${w}\\)`),
    solution: `Calculer le coefficient directeur \\(a\\), puis l'ordonnée à l'origine \\(b\\) en utilisant l'un des points : \\(b = y_A - a \\times x_A\\).`,
    help: {
      cours: "Pour l'équation \\(y = ax + b\\) d'une droite : 1) calculer \\(a = \\dfrac{\\Delta y}{\\Delta x}\\) ; 2) utiliser un point pour trouver \\(b\\).",
      savoirFaire: "Calculer \\(a\\), puis \\(b = y - ax\\) avec un point.",
      erreurs: ["Inverser \\(a\\) et \\(b\\).", "Mauvais signe.", "Droite horizontale : \\(y = k\\), pas \\(x = k\\)."]
    }
  });
}

/* ==========================================================================
   MODÉLISER — Mise en équation (5 niveaux)
   ========================================================================== */

function _model_qcm({ title, body, goodHtml, distractors, solution, help }) {
  const all = [{ html: goodHtml, correct: true }]
    .concat(distractors.map(h => ({ html: h, correct: false })));
  const { choices, correctIdx } = makeQCM(all);
  return { theme: 'modeliser', title, body, type: 'qcm', choices, correctIdx, solution, help };
}

function model_eq_n1() {
  // 🔴 Découverte — mise en équation la plus simple
  const cases = [
    { s: "La somme d'un nombre \\(x\\) et de 7 vaut 15.", eq: 'x + 7 = 15', wr: ['x - 7 = 15', '7x = 15', 'x × 7 = 15'] },
    { s: "Le double d'un nombre \\(x\\) vaut 20.", eq: '2x = 20', wr: ['x + 2 = 20', 'x - 2 = 20', 'x/2 = 20'] },
    { s: "Un nombre \\(x\\) diminué de 5 vaut 12.", eq: 'x - 5 = 12', wr: ['5 - x = 12', 'x + 5 = 12', '5x = 12'] }
  ];
  const k = pick(cases);
  return _model_qcm({
    title: 'Niveau 🔴 — Traduire une phrase',
    body: `Traduire cette phrase par une équation :<br><i>${k.s}</i>`,
    goodHtml: `\\(${k.eq}\\)`,
    distractors: k.wr.map(w => `\\(${w}\\)`),
    solution: `Mettre en équation = traduire la phrase mot à mot en symboles.`,
    help: {
      cours: "Mots-clés : <b>somme</b> → +, <b>différence</b> → −, <b>double</b> → ×2, <b>moitié / tiers</b> → /2, /3, <b>vaut / est égal à</b> → =.",
      savoirFaire: "Identifier l'inconnue, puis traduire chaque mot en symbole.",
      erreurs: ["Confondre ajouter et multiplier.", "Inverser la soustraction.", "Oublier le signe =."]
    }
  });
}

function model_eq_n2() {
  // 🟡 Apprentissage — équation du 1er degré avec 2 opérations
  const cases = [
    { s: "Trois fois un nombre, diminué de 4, vaut 11.", eq: '3x - 4 = 11', wr: ['3x + 4 = 11', 'x - 4 = 11', '3(x - 4) = 11'] },
    { s: "Le triple d'un nombre augmenté de 2 vaut 17.", eq: '3x + 2 = 17', wr: ['3(x + 2) = 17', 'x + 2 = 17', '3x - 2 = 17'] },
    { s: "La moitié d'un nombre augmentée de 3 vaut 8.", eq: 'x/2 + 3 = 8', wr: ['(x + 3)/2 = 8', 'x/2 - 3 = 8', 'x + 3 = 8/2'] }
  ];
  const k = pick(cases);
  return _model_qcm({
    title: 'Niveau 🟡 — Traduction en deux étapes',
    body: `Traduire par une équation :<br><i>${k.s}</i>`,
    goodHtml: `\\(${k.eq}\\)`,
    distractors: k.wr.map(w => `\\(${w}\\)`),
    solution: `Lire la phrase dans l'ordre et respecter les parenthèses quand on applique une opération à un groupe complet.`,
    help: {
      cours: "Attention : « le double de (x + 3) » = 2(x + 3), mais « le double de x, augmenté de 3 » = 2x + 3.",
      savoirFaire: "Se demander si l'opération s'applique à x seul ou à une expression entière.",
      erreurs: ["Oublier les parenthèses.", "Inverser ordre des opérations.", "Confondre « diminué de » et « moins »."]
    }
  });
}

function model_eq_n3() {
  // 🟢 Confirmé — problème de périmètre / âge / achat
  const cases = [
    { s: "Un rectangle a un périmètre de 30 cm. Sa longueur \\(L\\) mesure 3 cm de plus que sa largeur \\(\\ell\\). Donner l'équation vérifiée par \\(\\ell\\).", eq: '2\\ell + 2(\\ell + 3) = 30', wr: ['\\ell(\\ell + 3) = 30', '2\\ell + 3 = 30', '\\ell + (\\ell + 3) = 30'] },
    { s: "Le prix d'un pull est de 25 €. Un client achète 2 pulls et une écharpe à \\(x\\) €. Il paie 63 € au total. Donner l'équation.", eq: '2 \\times 25 + x = 63', wr: ['25 + 2x = 63', '25x + 2 = 63', '(25 + 2)x = 63'] },
    { s: "Marie a \\(x\\) ans. Son frère a 5 ans de plus qu'elle. La somme de leurs âges vaut 27 ans. Donner l'équation.", eq: 'x + (x + 5) = 27', wr: ['x + 5 = 27', '2x + 5 = 27/2', 'x(x + 5) = 27'] }
  ];
  const k = pick(cases);
  return _model_qcm({
    title: 'Niveau 🟢 — Problème concret',
    body: k.s,
    goodHtml: `\\(${k.eq}\\)`,
    distractors: k.wr.map(w => `\\(${w}\\)`),
    solution: `Identifier l'inconnue, exprimer toutes les quantités en fonction d'elle, utiliser la condition donnée (total, somme, périmètre…).`,
    help: {
      cours: "<b>Modélisation</b> : 1) choisir une inconnue ; 2) traduire chaque grandeur avec cette inconnue ; 3) utiliser la condition (= somme, =total, = périmètre…).",
      savoirFaire: "Relire la phrase et vérifier que chaque élément a été utilisé.",
      erreurs: ["Oublier une grandeur (ex. 2 pulls au lieu d'1).", "Mal traduire « de plus que » (+ et non ×).", "Multiplier au lieu d'additionner."]
    }
  });
}

function model_eq_n4() {
  // 💚 Maîtrise — problème avec inconnue et équation du 1er degré + contextes variés
  const cases = [
    { s: "Dans un parking, il y a \\(x\\) motos et \\(x + 14\\) voitures. On compte au total 46 véhicules. Donner l'équation.", eq: 'x + (x + 14) = 46', wr: ['x(x + 14) = 46', '2x + 14 = 46/2', 'x + 14 = 46'] },
    { s: "Une librairie vend un livre à 12 € et un magazine à 4 €. Un client achète \\(x\\) livres et \\(x + 2\\) magazines pour 52 €. Donner l'équation.", eq: '12x + 4(x + 2) = 52', wr: ['12x + 4x + 2 = 52', '(12 + 4)x + 2 = 52', '12(x + 2) + 4x = 52'] },
    { s: "Un parent a 36 ans, son enfant \\(x\\) ans. Dans 10 ans, le parent aura 3 fois l'âge de l'enfant. Donner l'équation vérifiée par \\(x\\).", eq: '36 + 10 = 3(x + 10)', wr: ['36 + 10 = 3x + 10', '3(36 + 10) = x + 10', '36 = 3x'] }
  ];
  const k = pick(cases);
  return _model_qcm({
    title: 'Niveau 💚 — Modélisation avancée',
    body: k.s,
    goodHtml: `\\(${k.eq}\\)`,
    distractors: k.wr.map(w => `\\(${w}\\)`),
    solution: `Bien identifier ce qui se passe « à l'instant actuel » et « dans X années » / « coût × quantité »…`,
    help: {
      cours: "Pour les problèmes d'âges : attention à décaler <b>tous</b> les âges. Pour les problèmes d'achats : prix unitaire × quantité, <b>un terme par type d'article</b>.",
      savoirFaire: "Lister les quantités avant de rédiger l'équation.",
      erreurs: ["Oublier de décaler un âge.", "Oublier une parenthèse.", "Confondre coût et quantité."]
    }
  });
}

function model_eq_n5() {
  // ⚫ Expert — système ou comparaison de deux offres
  const cases = [
    { s: "L'offre A : 8 € puis 0,5 €/km. L'offre B : 2 €/km sans forfait. Pour quel kilométrage \\(x\\) les offres sont-elles égales ? Écrire l'équation.", eq: '8 + 0{,}5x = 2x', wr: ['8 + 0{,}5x = 2 + x', '8x + 0{,}5 = 2x', '0{,}5x = 2x - 8'] },
    { s: "Julie et Tom comptent leurs billes : Julie en a 3 fois plus que Tom. Ensemble ils en ont 48. Donner l'équation vérifiée par \\(x\\) (nombre de billes de Tom).", eq: '3x + x = 48', wr: ['3 + x = 48', '3x = x + 48', 'x/3 + x = 48'] },
    { s: "Un tarif A vaut 20 € + 3 €/h. Un tarif B vaut 5 €/h. À partir de combien d'heures \\(x\\) l'offre A devient avantageuse ? Écrire l'inéquation correspondante.", eq: '20 + 3x < 5x', wr: ['20 + 3x > 5x', '20 + 3x = 5x', '3x < 5x - 20'] }
  ];
  const k = pick(cases);
  return _model_qcm({
    title: 'Niveau ⚫ — Comparer deux situations',
    body: k.s,
    goodHtml: `\\(${k.eq}\\)`,
    distractors: k.wr.map(w => `\\(${w}\\)`),
    solution: `Identifier clairement les deux expressions en fonction de x, puis les comparer (égalité, inégalité).`,
    help: {
      cours: "Pour <b>comparer deux offres</b> : écrire chaque prix total en fonction de x, puis poser l'égalité (ou l'inégalité).",
      savoirFaire: "Forfait = constante + (prix unitaire × quantité).",
      erreurs: ["Confondre forfait et prix unitaire.", "Oublier le forfait.", "Mauvais sens de l'inégalité."]
    }
  });
}

/* ==========================================================================
   COMMUNIQUER — Conclure correctement (5 niveaux)
   ========================================================================== */

function _comm_qcm({ title, body, goodHtml, distractors, solution, help }) {
  const all = [{ html: goodHtml, correct: true }]
    .concat(distractors.map(h => ({ html: h, correct: false })));
  const { choices, correctIdx } = makeQCM(all);
  return { theme: 'communiquer', title, body, type: 'qcm', choices, correctIdx, solution, help };
}

function comm_conclure_n1() {
  // 🔴 Découverte — conclusion simple Pythagore
  const cases = [
    {
      theoreme: 'pythagore_direct',
      contexte: "Dans le triangle ABC rectangle en B, on a calculé \\(AC^2 = 25\\).",
      good: "Donc \\(AC = \\sqrt{25} = 5\\) cm.",
      wrongs: [
        "Donc \\(AC = 25\\) cm.",
        "Donc \\(AC^2 = 5\\) cm.",
        "Donc \\(AC = 25^2\\) cm."
      ]
    },
    {
      contexte: "On a trouvé \\(BC^2 = 100\\) avec BC en cm.",
      good: "Donc \\(BC = 10\\) cm (on prend la racine carrée).",
      wrongs: [
        "Donc \\(BC = 100\\) cm.",
        "Donc \\(BC^2 = 100\\), donc BC = 100 cm.",
        "Donc \\(BC = 1\\,000\\) cm."
      ]
    }
  ];
  const k = pick(cases);
  return _comm_qcm({
    title: 'Niveau 🔴 — Phrase de conclusion',
    body: `${k.contexte}<br>Quelle est la conclusion correcte ?`,
    goodHtml: k.good,
    distractors: k.wrongs,
    solution: `Après avoir trouvé un carré, il faut <b>prendre la racine carrée</b> pour obtenir la longueur.`,
    help: {
      cours: "En géométrie, quand on calcule un carré d'une longueur \\(\\ell^2 = k\\), la longueur vaut \\(\\ell = \\sqrt{k}\\) (et pas \\(k\\) !).",
      savoirFaire: "Ne jamais confondre \\(\\ell^2\\) et \\(\\ell\\). Toujours écrire la phrase de conclusion en clair.",
      erreurs: ["Oublier la racine carrée.", "Laisser \\(\\ell^2\\) au lieu de \\(\\ell\\).", "Oublier l'unité."]
    }
  });
}

function comm_conclure_n2() {
  // 🟡 Apprentissage — conclusion Thalès / proportionnalité
  const cases = [
    {
      theoreme: 'thales_direct',
      contexte: "On a vérifié que \\(\\dfrac{AD}{AB} = \\dfrac{AE}{AC}\\) et que (BC) // (DE).",
      good: "D'après le théorème de Thalès, on a \\(\\dfrac{AD}{AB} = \\dfrac{AE}{AC} = \\dfrac{DE}{BC}\\).",
      wrongs: [
        "Donc (AB) est parallèle à (DE).",
        "Donc les triangles sont égaux.",
        "Donc AD = AE."
      ]
    },
    {
      theoreme: 'thales_direct',
      contexte: "On a calculé x et trouvé \\(x = 6\\) dans un problème de Thalès sur des longueurs en cm.",
      good: "Donc la longueur cherchée vaut 6 cm.",
      wrongs: [
        "Donc \\(x = 6\\) m.",
        "Donc \\(x = 6\\), sans unité c'est la réponse.",
        "La longueur vaut 6, on ne peut pas conclure sans justification supplémentaire."
      ]
    }
  ];
  const k = pick(cases);
  return _comm_qcm({
    title: 'Niveau 🟡 — Conclusion avec unité',
    body: `${k.contexte}<br>Quelle est la conclusion correcte ?`,
    goodHtml: k.good,
    distractors: k.wrongs,
    solution: `Une conclusion doit : (1) rappeler le théorème, (2) donner la valeur avec la <b>bonne unité</b>.`,
    help: {
      cours: "Une phrase de conclusion complète mentionne : le <b>résultat</b>, l'<b>unité</b>, et renvoie si besoin au <b>théorème</b> utilisé.",
      savoirFaire: "Relire : ai-je mis l'unité ? ai-je répondu à la question ?",
      erreurs: ["Oublier l'unité.", "Mettre la mauvaise unité.", "Ne pas répondre à la question posée."]
    }
  });
}

function comm_conclure_n3() {
  // 🟢 Confirmé — conclusion réciproque Thalès / Pythagore
  const cases = [
    {
      theoreme: 'thales_reciproque',
      contexte: "On a vérifié que \\(\\dfrac{AD}{AB} = \\dfrac{AE}{AC}\\), les points A, D, B et A, E, C étant alignés dans cet ordre.",
      good: "D'après la réciproque du théorème de Thalès, les droites (DE) et (BC) sont parallèles.",
      wrongs: [
        "D'après le théorème de Thalès, on peut calculer DE.",
        "Donc DE = BC.",
        "Donc les triangles ADE et ABC sont égaux."
      ]
    },
    {
      theoreme: 'pythagore_reciproque',
      contexte: "On a vérifié que \\(AB^2 + AC^2 = BC^2\\) dans un triangle ABC.",
      good: "D'après la réciproque du théorème de Pythagore, le triangle ABC est rectangle en A.",
      wrongs: [
        "D'après le théorème de Pythagore, le triangle ABC est rectangle en A.",
        "Donc le triangle ABC est isocèle en A.",
        "Donc AB = AC."
      ]
    }
  ];
  const k = pick(cases);
  return _comm_qcm({
    title: 'Niveau 🟢 — Réciproque : bonne conclusion',
    body: `${k.contexte}<br>Quelle est la conclusion correcte ?`,
    goodHtml: k.good,
    distractors: k.wrongs,
    solution: `La <b>réciproque</b> permet de démontrer une propriété ; le théorème direct permet de <b>déduire une égalité</b>. Il faut aussi préciser le <b>sommet</b> de l'angle droit ou les droites concernées.`,
    help: {
      cours: "Direct : hypothèse \"triangle rectangle\" / \"droites parallèles\" → conclusion \"égalité\". Réciproque : hypothèse \"égalité\" → conclusion \"triangle rectangle\" / \"droites parallèles\".",
      savoirFaire: "Se demander : qu'est-ce que je veux montrer ? Choisir entre direct et réciproque.",
      erreurs: ["Dire « théorème » au lieu de « réciproque ».", "Oublier de préciser le sommet ou la droite.", "Confondre les deux théorèmes."]
    }
  });
}

function comm_conclure_n4() {
  // 💚 Maîtrise — contraposée / négation
  const cases = [
    {
      theoreme: 'pythagore_contraposee',
      contexte: "On a vérifié que \\(AB^2 + AC^2 \\ne BC^2\\) dans un triangle ABC.",
      good: "D'après la contraposée du théorème de Pythagore, le triangle ABC n'est pas rectangle en A.",
      wrongs: [
        "D'après Pythagore, le triangle est rectangle.",
        "Le triangle est isocèle.",
        "On ne peut rien conclure."
      ]
    },
    {
      theoreme: 'thales_reciproque',
      contexte: "On a vérifié que \\(\\dfrac{AD}{AB} \\ne \\dfrac{AE}{AC}\\), avec A, D, B alignés et A, E, C alignés.",
      good: "D'après la contraposée de la réciproque de Thalès, les droites (DE) et (BC) ne sont pas parallèles.",
      wrongs: [
        "D'après Thalès, les droites sont parallèles.",
        "Les droites (DE) et (BC) sont sécantes en A.",
        "On ne peut rien conclure."
      ]
    }
  ];
  const k = pick(cases);
  return _comm_qcm({
    title: 'Niveau 💚 — Conclusion par contraposée',
    body: `${k.contexte}<br>Quelle est la conclusion correcte ?`,
    goodHtml: k.good,
    distractors: k.wrongs,
    solution: `La <b>contraposée</b> d'une implication \"si A alors B\" est \"si non B alors non A\".`,
    help: {
      cours: "La contraposée est logiquement équivalente à l'implication. Elle permet de <b>démontrer une négation</b>.",
      savoirFaire: "Si la conclusion attendue est une négation (« n'est pas », « ne sont pas »), penser à la contraposée.",
      erreurs: ["Utiliser le théorème direct pour conclure une négation.", "Oublier « n'est pas ».", "Affirmer quelque chose d'autre (isocèle…)."]
    }
  });
}

function comm_conclure_n5() {
  // ⚫ Expert — conclusion complète rédigée
  const cases = [
    {
      theoreme: 'pythagore_reciproque',
      contexte: "Problème : « Montrer que le triangle ABC de côtés AB = 6, AC = 8, BC = 10 est rectangle. »<br>On a calculé \\(AB^2 + AC^2 = 100\\) et \\(BC^2 = 100\\).",
      good: "On constate que \\(AB^2 + AC^2 = BC^2\\). D'après la réciproque du théorème de Pythagore, le triangle ABC est rectangle en A.",
      wrongs: [
        "Comme \\(AB^2 + AC^2 = BC^2\\), alors ABC est rectangle.",
        "D'après Pythagore, \\(AB^2 + AC^2 = BC^2\\), donc ABC est rectangle.",
        "Le triangle est rectangle car les trois côtés sont proportionnels."
      ]
    },
    {
      theoreme: 'pythagore_direct',
      contexte: "Problème : « Calculer une longueur. » On travaille dans un triangle rectangle en A avec AB = 5 et AC = 12.<br>On a posé \\(BC^2 = 5^2 + 12^2 = 25 + 144 = 169\\).",
      good: "D'après le théorème de Pythagore, \\(BC^2 = AB^2 + AC^2 = 169\\), donc \\(BC = \\sqrt{169} = 13\\) cm.",
      wrongs: [
        "Donc BC = 169 cm.",
        "Donc \\(BC = 25 + 144\\) cm.",
        "Donc BC² = 13, donc BC = 169 cm."
      ]
    }
  ];
  const k = pick(cases);
  return _comm_qcm({
    title: 'Niveau ⚫ — Rédaction complète',
    body: `${k.contexte}<br>Quelle est la meilleure rédaction pour conclure ?`,
    goodHtml: k.good,
    distractors: k.wrongs,
    solution: `Une rédaction complète mentionne : le <b>théorème cité</b>, l'<b>égalité obtenue</b>, le <b>calcul de la longueur</b> (racine carrée si besoin) et l'<b>unité</b>.`,
    help: {
      cours: "Rédaction-type Pythagore : (1) triangle rectangle → théorème ; (2) égalité des carrés ; (3) calcul ; (4) racine et unité ; (5) conclusion sur la figure.",
      savoirFaire: "Se relire : théorème cité ? calcul juste ? racine prise ? unité présente ? conclusion claire ?",
      erreurs: ["Oublier la racine carrée.", "Mélanger \\(BC\\) et \\(BC^2\\).", "Oublier l'unité.", "Mauvais théorème (Pythagore au lieu de la réciproque)."]
    }
  });
}

/* ==========================================================================
   RÉDACTION — Texte à compléter : raccourci vers la modale existante.
   On génère un "exercice" factice qui redirige vers openRedaction() au lancement.
   ========================================================================== */
const REDACTION_LEVELS = {
  1: { key: 'pythagore_direct', label: 'Pythagore direct — calculer une longueur' },
  2: { key: 'pythagore_reciproque_vrai', label: 'Réciproque de Pythagore — cas vrai' },
  3: { key: 'thales_direct', label: 'Thalès direct — calculer une longueur' },
  4: { key: 'thales_reciproque_vrai', label: 'Réciproque de Thalès — cas vrai' },
  5: { key: 'trigo_cote', label: 'Trigonométrie — calculer un côté' }
};

function _red_placeholder(level) {
  const l = REDACTION_LEVELS[level];
  return {
    theme: 'redaction',
    title: `Rédaction — ${l.label}`,
    body: `Clique sur « ✍️ Rédiger » pour ouvrir l'exercice glisser-déposer.`,
    type: 'qcm',
    choices: [
      `<button class="primary fc-redaction-btn" data-redaction="${l.key}" style="margin-top:8px;">✍️ Ouvrir l'exercice de rédaction</button>`,
      `Passer (me noter 0)`,
      `Je ne sais pas`
    ],
    correctIdx: 0,
    solution: `Utilise la rédaction glisser-déposer pour placer les étiquettes dans le bon ordre.`,
    help: {
      cours: "Une démonstration se rédige par étapes : <b>hypothèses</b> → <b>théorème</b> → <b>calcul</b> → <b>conclusion</b>.",
      savoirFaire: "Repère les mots-clés : « rectangle », « parallèle »… pour savoir quel théorème utiliser.",
      erreurs: ["Oublier l'étape du théorème.", "Sauter le calcul intermédiaire.", "Ne pas conclure clairement."]
    }
  };
}

function red_complete_n1() { return _red_placeholder(1); }
function red_complete_n2() { return _red_placeholder(2); }
function red_complete_n3() { return _red_placeholder(3); }
function red_complete_n4() { return _red_placeholder(4); }
function red_complete_n5() { return _red_placeholder(5); }


/* Export pour SKILL_FORMAT_GENERATORS */
Object.assign(SKILL_FORMAT_GENERATORS, {
  'raisonner.ordre.1': rais_ordre_n1,
  'raisonner.ordre.2': rais_ordre_n2,
  'raisonner.ordre.3': rais_ordre_n3,
  'raisonner.ordre.4': rais_ordre_n4,
  'raisonner.ordre.5': rais_ordre_n5,
  'raisonner.erreur.1': rais_erreur_n1,
  'raisonner.erreur.2': rais_erreur_n2,
  'raisonner.erreur.3': rais_erreur_n3,
  'raisonner.erreur.4': rais_erreur_n4,
  'raisonner.erreur.5': rais_erreur_n5,
  'raisonner.vf.1': rais_vf_n1,
  'raisonner.vf.2': rais_vf_n2,
  'raisonner.vf.3': rais_vf_n3,
  'raisonner.vf.4': rais_vf_n4,
  'raisonner.vf.5': rais_vf_n5,
  // Représenter — Lecture graphique
  'representer.lecture.1': repr_lecture_n1,
  'representer.lecture.2': repr_lecture_n2,
  'representer.lecture.3': repr_lecture_n3,
  'representer.lecture.4': repr_lecture_n4,
  'representer.lecture.5': repr_lecture_n5,
  // Modéliser — Mise en équation
  'modeliser.mise_eq.1': model_eq_n1,
  'modeliser.mise_eq.2': model_eq_n2,
  'modeliser.mise_eq.3': model_eq_n3,
  'modeliser.mise_eq.4': model_eq_n4,
  'modeliser.mise_eq.5': model_eq_n5,
  // Communiquer — Conclure correctement
  'communiquer.conclure.1': comm_conclure_n1,
  'communiquer.conclure.2': comm_conclure_n2,
  'communiquer.conclure.3': comm_conclure_n3,
  'communiquer.conclure.4': comm_conclure_n4,
  'communiquer.conclure.5': comm_conclure_n5,
  // Rédaction — renvoi vers modale glisser-déposer
  'redaction.complete.1': red_complete_n1,
  'redaction.complete.2': red_complete_n2,
  'redaction.complete.3': red_complete_n3,
  'redaction.complete.4': red_complete_n4,
  'redaction.complete.5': red_complete_n5
});


function startSkillExercise(skillId, formatId, level) {
  const key = `${skillId}.${formatId}.${level}`;
  const gen = SKILL_FORMAT_GENERATORS[key];
  if (!gen) {
    alert(`Ce format n'est pas encore disponible (${key}). Les autres formats arriveront bientôt !`);
    return;
  }
  if (!isLevelUnlocked(skillId, formatId, level)) {
    alert('Niveau verrouillé. Réussis 3 exercices au niveau précédent pour le débloquer.');
    return;
  }
  // Génère 5 questions du même format/niveau
  const series = [];
  const seen = new Set();
  for (let i = 0; i < 5; i++) {
    let q;
    let tries = 0;
    do { q = gen(); tries++; } while (seen.has(q.body) && tries < 20);
    seen.add(q.body);
    series.push(q);
  }
  state.mode = 'train';
  state.duree = 0;
  state.series = series;
  state.answers = series.map(() => ({ selectedIdx: null, inputAnswer: '', helped: false }));
  state.current = 0;
  state.startedAt = Date.now();
  state.remaining = 0;
  state._skillContext = { skillId, formatId, level };
  // Masque les popups welcome/PWA pendant l'exercice
  document.body.classList.add('evaluating');
  startTimer();
  showScreen('screen-test');
  renderQuestion();
  // Activer la calculatrice
  showCalcButton();
}

function initSkillsTab() {
  renderSkillsTab();
  document.addEventListener('click', e => {
    const lvlCard = e.target.closest('.skill-level-card');
    if (lvlCard && !lvlCard.classList.contains('locked')) {
      const { skill, format, level } = lvlCard.dataset;
      startSkillExercise(skill, format, parseInt(level));
    }
    // Bouton "✍️ Ouvrir l'exercice de rédaction" dans l'écran test
    const redBtn = e.target.closest('.fc-redaction-btn');
    if (redBtn && redBtn.dataset.redaction) {
      e.preventDefault();
      e.stopPropagation();
      openRedaction(redBtn.dataset.redaction);
    }
  });
  // Quand on clique l'onglet, rafraîchir
  document.querySelectorAll('[data-target="tab-skills"]').forEach(btn => {
    btn.addEventListener('click', () => setTimeout(renderSkillsTab, 50));
  });
}

/* ==========================================================================
   CALCULATRICE INTÉGRÉE
   ========================================================================== */

function showCalcButton() {
  const btn = document.getElementById('btn-calc-toggle');
  if (btn) btn.hidden = false;
}
function hideCalcButton() {
  const btn = document.getElementById('btn-calc-toggle');
  if (btn) btn.hidden = true;
  const w = document.getElementById('calc-widget');
  if (w) w.hidden = true;
}

function initCalc() {
  const toggle = document.getElementById('btn-calc-toggle');
  const widget = document.getElementById('calc-widget');
  const close = document.getElementById('btn-calc-close');
  const display = document.getElementById('calc-display');
  if (!toggle || !widget || !display) return;

  let expr = '';
  const refresh = () => { display.value = expr || '0'; };

  toggle.addEventListener('click', () => { widget.hidden = !widget.hidden; });
  close.addEventListener('click', () => { widget.hidden = true; });

  widget.querySelectorAll('.calc-key').forEach(key => {
    key.addEventListener('click', () => {
      const k = key.dataset.k;
      if (k === 'AC') { expr = ''; }
      else if (k === 'BS') { expr = expr.slice(0, -1); }
      else if (k === '=') {
        try {
          // Remplacer , par . puis évaluer
          let e = expr.replace(/,/g, '.').replace(/sqrt\(/g, 'Math.sqrt(').replace(/sq\(/g, 'Math.pow(');
          const r = Function('"use strict";return (' + e + ')')();
          if (typeof r === 'number' && !isNaN(r) && isFinite(r)) {
            expr = String(+r.toFixed(10)).replace('.', ',').replace(/,?0+$/, '');
          } else {
            expr = 'Erreur';
          }
        } catch(e) { expr = 'Erreur'; }
      }
      else if (k === 'sqrt') { expr += '√('; expr = expr.replace('√(', 'sqrt('); }
      else if (k === 'sq') { expr += '²'; expr = expr.replace('²', ''); /* simplification: x² = x*x */
        // pour simplifier, sq = x² → on multiplie le dernier nombre par lui-même
        const m = expr.match(/(\d+([,.]\d+)?)$/);
        if (m) {
          const n = m[1].replace(',', '.');
          const sq = parseFloat(n) ** 2;
          expr = expr.slice(0, -m[1].length) + String(sq).replace('.', ',');
        }
      }
      else { expr += k; }
      if (expr === 'Erreur') setTimeout(() => { expr = ''; refresh(); }, 1500);
      refresh();
    });
  });
  refresh();
}

/* Quand on revient à l'accueil, masquer la calculatrice */
const _origShowScreen_forCalc = (typeof showScreen === 'function') ? showScreen : null;

/* Hook : afficher/cacher la calculatrice selon l'écran */
function maybeToggleCalc(screenId) {
  const btn = document.getElementById('btn-calc-toggle');
  if (!btn) return;
  // La calculatrice est visible UNIQUEMENT pendant un exercice Compétences
  if (screenId === 'screen-test' && state && state._skillContext) {
    btn.hidden = false;
  } else {
    btn.hidden = true;
    const w = document.getElementById('calc-widget');
    if (w) w.hidden = true;
  }
}

/* Hook finishTest pour enregistrer la progression Compétences */
const _origFinishTest = (typeof finishTest === 'function') ? finishTest : null;


/* ---------- Init ---------- */
initDarkMode();
initA11y();
initTabs();
initThemes();
initKeyboard();
initDuel();
initSkillsTab();
initCalc();
refreshStudentBadge();

/* Service Worker — permet l'installation en PWA et le fonctionnement hors-ligne.
   Enregistrement silencieux : pas d'erreur visible pour l'élève si ça échoue. */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(err => {
      console.warn('[PWA] SW registration failed:', err);
    });
  });
}

/* ==========================================================================
   PWA — Détection de l'installation et affichage d'une astuce à l'élève
   ========================================================================== */
const PWA_TIP_DISMISSED_KEY = 'autopb3.pwa.tip.dismissed';
const PWA_HELP_SHOWN_KEY = 'autopb3.pwa.help.shown';
let deferredInstallPrompt = null;

/* Capte l'événement d'installation pour pouvoir le déclencher plus tard (Android/Chrome).
   iOS ne supporte pas cet event — il faut proposer un guide manuel. */
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  // Popup auto désactivée (cf. bloc plus bas) ; l'événement est capté pour permettre un
  // déclenchement manuel ultérieur si on expose un bouton « Installer » dans l'UI.
});

/* Si l'élève a installé, on masque l'astuce et on le félicite la 1re fois */
window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const tip = document.querySelector('.pwa-tip');
  if (tip) tip.remove();
  if (!localStorage.getItem('autopb3.pwa.installed')) {
    localStorage.setItem('autopb3.pwa.installed', '1');
    // petit toast de remerciement
    const toast = document.createElement('div');
    toast.className = 'pwa-tip pwa-tip-success';
    toast.innerHTML = '🎉 <strong>C\'est installé !</strong> Tu retrouveras l\'app sur ton écran d\'accueil.';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 5000);
  }
});

function isStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
}
function isIOS() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function showPWAInstallTip() {
  if (localStorage.getItem(PWA_TIP_DISMISSED_KEY)) return;
  if (isStandaloneMode()) return;
  if (document.querySelector('.pwa-tip')) return;
  // Si la bannière de bienvenue est affichée, on attend qu'elle soit fermée
  // (sinon on empile deux popups en bas qui gênent la navigation).
  const welcome = document.querySelector('.welcome-banner');
  if (welcome) {
    const observer = new MutationObserver(() => {
      if (!document.querySelector('.welcome-banner')) {
        observer.disconnect();
        setTimeout(showPWAInstallTip, 600);
      }
    });
    observer.observe(document.body, { childList: true });
    return;
  }

  const tip = document.createElement('div');
  tip.className = 'pwa-tip';
  tip.innerHTML = `
    <span class="pwa-tip-icon">📱</span>
    <div class="pwa-tip-body">
      <strong>Installe l'app sur ton téléphone</strong>
      <span class="pwa-tip-sub">Tu pourras travailler <strong>même sans Wi-Fi</strong> et la retrouver sur ton écran d'accueil.</span>
    </div>
    <button class="primary small" id="btn-pwa-install">Installer</button>
    <button class="icon-btn pwa-tip-close" id="btn-pwa-dismiss" aria-label="Masquer">✕</button>`;
  document.body.appendChild(tip);
  $('#btn-pwa-dismiss').addEventListener('click', () => {
    tip.remove();
    localStorage.setItem(PWA_TIP_DISMISSED_KEY, '1');
  });
  $('#btn-pwa-install').addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        localStorage.setItem(PWA_TIP_DISMISSED_KEY, '1');
      }
      deferredInstallPrompt = null;
      tip.remove();
    } else if (isIOS()) {
      showIOSInstallGuide();
      tip.remove();
    }
  });
}

/* iOS : pas d'event d'install → on doit montrer un guide visuel */
function showIOSInstallGuide() {
  const modal = document.createElement('div');
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal">
      <h3>📱 Installer sur iPhone / iPad</h3>
      <p style="font-size:0.95rem;line-height:1.6;">Pour installer l'app sur ton iPhone :</p>
      <ol style="padding-left:22px;line-height:1.8;">
        <li>En bas de Safari, touche le bouton <strong style="display:inline-block;border:1px solid var(--border);padding:0 6px;border-radius:4px;">&#x2B06;</strong> <em>(Partager)</em></li>
        <li>Fais défiler, puis touche <strong>« Sur l'écran d'accueil »</strong></li>
        <li>Touche <strong>« Ajouter »</strong> en haut à droite</li>
      </ol>
      <p class="note" style="font-size:0.85rem;">L'app <strong>Problèmes 3ème</strong> s'affichera sur ton écran d'accueil et fonctionnera même sans Wi-Fi.</p>
      <div class="modal-actions">
        <button class="primary" id="btn-ios-ok">OK, compris</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  $('#btn-ios-ok').addEventListener('click', () => modal.remove());
}

/* Popups auto désactivés : l'élève a déjà le bouton 👤 (identification) dans le header,
   et l'installation de l'app peut se faire via le menu du navigateur. Les popups s'empilaient
   en bas et gênaient la navigation pendant les exercices. Les fonctions restent disponibles
   au cas où on voudrait les réactiver via un bouton dédié dans l'interface. */
function showWelcomeBanner() {
  const banner = document.createElement('div');
  banner.className = 'welcome-banner';
  banner.innerHTML = `
    <div class="welcome-content">
      <strong>Bienvenue !</strong> Identifie-toi (prénom + classe) pour garder ton historique. Ton identité reste <strong>sur ton appareil</strong>, rien n'est envoyé.
    </div>
    <div class="welcome-actions">
      <button class="ghost small" id="welcome-dismiss">Plus tard</button>
      <button class="primary small" id="welcome-login">M'identifier</button>
    </div>`;
  document.body.appendChild(banner);
  $('#welcome-dismiss').addEventListener('click', () => {
    localStorage.setItem('autopb3.welcome-dismissed', '1');
    banner.remove();
  });
  $('#welcome-login').addEventListener('click', () => {
    banner.remove();
    showLogin();
  });
}
