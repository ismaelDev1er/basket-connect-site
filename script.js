/* BASKET CONNECT — JavaScript sans compilation.
   Pour activer Supabase, remplace les deux valeurs ci-dessous par celles de ton projet.
   Ne mets JAMAIS la clé service_role dans un fichier public. Utilise uniquement la clé anon/publishable. */
const SUPABASE_URL = 'https://hrsvecduiiyfokbyxolu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhyc3ZlY2R1aWl5Zm9rYnl4b2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4Mzc3NjksImV4cCI6MjEwNzQxMzc2OX0.3LWMAIfP2p4C1S0oIbL9Rczoe7unDNGv-R3Ob2C-yW4';

const isSupabaseConfigured = () => window.supabase && SUPABASE_URL.startsWith('https://') && !SUPABASE_URL.includes('TON-PROJET') && SUPABASE_ANON_KEY.length > 20 && !SUPABASE_ANON_KEY.includes('COLLE-ICI');
const db = isSupabaseConfigured() ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
let currentFilter = 'player';
let authMode = 'signup';
let allProfiles = [];
let toastTimer;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const escapeHTML = (value = '') => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const labelForType = (type) => ({player:'Joueur',club:'Club',recruiter:'Recruteur'}[type] || 'Membre');

function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
}

function openAuth(mode = 'signup') {
  setAuthMode(mode);
  $('#authModal').classList.add('open');
  $('#authModal').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => (mode === 'signup' ? $('#username') : $('#email')).focus(), 100);
}
function closeAuth() {
  $('#authModal').classList.remove('open');
  $('#authModal').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
function setAuthMode(mode) {
  authMode = mode;
  const signup = mode === 'signup';
  $('#authTitle').textContent = signup ? 'Rejoins la communauté.' : 'Content de te revoir.';
  $('#authDescription').textContent = signup ? 'Crée ton compte pour commencer à connecter le monde du basket.' : 'Connecte-toi pour retrouver ton espace Basket Connect.';
  $('#usernameLabel').hidden = !signup;
  $('#signupFields').hidden = !signup;
  $('#username').required = signup;
  $('#city').required = signup;
  $('#authSubmit').innerHTML = signup ? 'Créer mon compte <span>↗</span>' : 'Me connecter <span>↗</span>';
  $('#formMessage').textContent = '';
  $('#formMessage').classList.remove('success');
  $$('[data-auth-mode]').forEach(button => button.classList.toggle('active', button.dataset.authMode === mode));
}

function profileCard(profile) {
  const name = profile.username || profile.club_name || 'Membre Basket Connect';
  const type = profile.user_type || 'player';
  const detail = profile.city || 'Ville non renseignée';
  const bio = profile.bio || (type === 'player' ? 'À la recherche de nouvelles opportunités sur le terrain.' : type === 'club' ? 'À la recherche de nouveaux talents pour renforcer notre équipe.' : 'À la recherche de talents basketball.');
  const avatar = profile.avatar_url ? `<img src="${escapeHTML(profile.avatar_url)}" alt="Photo de ${escapeHTML(name)}" loading="lazy">` : (type === 'club' ? '🏀' : type === 'recruiter' ? '✦' : escapeHTML(name.slice(0,1).toUpperCase()));
  const subtitle = type === 'player' ? [profile.position, profile.level].filter(Boolean).join(' · ') || 'Profil joueur' : type === 'club' ? (profile.division || 'Club de basketball') : 'Recrutement basketball';
  return `<article class="profile-card"><div class="profile-card-top"><div class="profile-avatar">${avatar}</div><div><div class="profile-name">${escapeHTML(name)}</div><div class="profile-subtitle">${escapeHTML(subtitle)}</div></div><span class="profile-badge">${escapeHTML(labelForType(type))}</span></div><p class="profile-bio">${escapeHTML(bio)}</p><div class="profile-card-bottom"><span>⌖ &nbsp;${escapeHTML(detail)}</span><span class="profile-arrow" aria-hidden="true">↗</span></div></article>`;
}

function renderProfiles() {
  const search = $('#directorySearch').value.trim().toLocaleLowerCase('fr');
  const filtered = allProfiles.filter(profile => {
    const typeMatches = (profile.user_type || 'player') === currentFilter;
    const haystack = [profile.username, profile.city, profile.bio, profile.club_name, profile.division, profile.position].filter(Boolean).join(' ').toLocaleLowerCase('fr');
    return typeMatches && haystack.includes(search);
  });
  const grid = $('#directoryGrid');
  if (filtered.length) {
    grid.innerHTML = filtered.map(profileCard).join('');
    $('#directoryStatus').textContent = `${filtered.length} profil${filtered.length > 1 ? 's' : ''} affiché${filtered.length > 1 ? 's' : ''}.`;
  } else {
    grid.innerHTML = `<article class="empty-state"><span class="empty-icon">${currentFilter === 'club' ? '🏀' : currentFilter === 'recruiter' ? '✦' : '⛹🏾'}</span><h3>Aucun profil pour le moment</h3><p>${!db ? 'Configure Supabase dans script.js pour charger les profils réels.' : !currentUser ? 'Connecte-toi ou crée ton compte pour découvrir les profils de la communauté.' : 'Aucun profil public ne correspond à cette recherche. Essaie une autre ville ou reviens plus tard.'}</p><button class="btn btn-primary" data-open-auth="signup">${currentFilter === 'club' ? 'Inscrire mon club' : 'Rejoindre Basket Connect'} <span>↗</span></button></article>`;
    $('#directoryStatus').textContent = 'Aucun résultat pour ce filtre.';
    grid.querySelector('[data-open-auth]')?.addEventListener('click', () => openAuth('signup'));
  }
}

async function loadProfiles() {
  if (!db) {
    allProfiles = [];
    renderProfiles();
    $('#directoryStatus').textContent = 'Base non connectée — renseigne les clés Supabase dans script.js.';
    return;
  }
  if (!currentUser) {
    allProfiles = [];
    renderProfiles();
    $('#directoryStatus').textContent = 'Connecte-toi pour voir les profils de la communauté.';
    return;
  }
  $('#directoryStatus').textContent = 'Chargement des profils…';
  const { data, error } = await db.from('profiles').select('id, username, user_type, city, avatar_url, bio, is_public, player_profiles(position, level), club_profiles(club_name, division)').eq('is_public', true).order('created_at', {ascending:false}).limit(60);
  if (error) {
    console.error('Chargement profils:', error.message);
    $('#directoryStatus').textContent = 'Impossible de charger les profils. Vérifie la base SQL et les règles RLS dans Supabase.';
    allProfiles = [];
  } else {
    allProfiles = (data || []).map(profile => ({...profile, ...(profile.player_profiles || {}), ...(profile.club_profiles || {})}));
  }
  renderProfiles();
}

async function loadEvents() {
  if (!db) return;
  const { data, error } = await db.from('events').select('id, event_type, title, description, city, location, event_date').eq('status','active').gte('event_date', new Date().toISOString()).order('event_date',{ascending:true}).limit(4);
  if (error) { console.warn('Chargement événements:', error.message); return; }
  if (!data?.length) return;
  $('#eventsGrid').innerHTML = data.map(event => {
    const date = new Date(event.event_date);
    const dateText = date.toLocaleDateString('fr-FR',{day:'2-digit',month:'short'}).replace('.','').toUpperCase();
    const type = ({game:'MATCH',tryout:'DÉTECTION',training:'ENTRAÎNEMENT'})[event.event_type] || 'ÉVÉNEMENT';
    return `<article class="event-card"><div class="event-date"><strong>${escapeHTML(date.getDate().toString().padStart(2,'0'))}</strong><span>${escapeHTML(date.toLocaleDateString('fr-FR',{month:'short'}).replace('.','').toUpperCase())}</span></div><div><span class="event-type">${type}</span><h3>${escapeHTML(event.title)}</h3><p>${escapeHTML(event.description || 'Événement de la communauté Basket Connect')} · ${escapeHTML(event.city || event.location || 'Lieu à confirmer')} · ${escapeHTML(date.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}))}</p></div><button class="event-arrow" data-event-id="${escapeHTML(event.id)}" aria-label="Voir événement">↗</button></article>`;
  }).join('');
  $$('#eventsGrid [data-event-id]').forEach(button => button.addEventListener('click', () => showToast('Connecte-toi pour participer à un événement.')));
}

async function submitAuth(event) {
  event.preventDefault();
  const message = $('#formMessage');
  const submit = $('#authSubmit');
  message.textContent = '';
  if (!db) {
    message.textContent = 'La connexion Supabase n’est pas configurée. Renseigne SUPABASE_URL et SUPABASE_ANON_KEY en haut de script.js.';
    return;
  }
  const email = $('#email').value.trim();
  const password = $('#password').value;
  const username = $('#username').value.trim();
  const city = $('#city').value.trim();
  const ageCat = $('#ageCat').value === 'minor' ? 'minor' : 'adult';
  submit.disabled = true;
  submit.textContent = authMode === 'signup' ? 'Création du compte…' : 'Connexion…';
  try {
    if (authMode === 'signup') {
      const userType = $('#userType').value;
      const { data, error } = await db.auth.signUp({email, password, options:{data:{username, user_type:userType, city, age_category:ageCat}}});
      if (error) throw error;
      if (data.user && data.session) {
        const { error: profileError } = await db.from('profiles').upsert({id:data.user.id, username, user_type:userType, city, is_public:true, age_category:ageCat});
        if (profileError) throw profileError;
        message.classList.add('success');
        message.textContent = 'Compte créé ! Ton profil est prêt.';
        showToast('Bienvenue dans Basket Connect !');
        setTimeout(closeAuth, 900);
        await loadProfiles();
      } else {
        message.classList.add('success');
        message.textContent = 'Inscription envoyée. Vérifie ta boîte e-mail pour confirmer ton compte, puis connecte-toi.';
      }
    } else {
      const { data, error } = await db.auth.signInWithPassword({email, password});
      if (error) throw error;
      message.classList.add('success');
      message.textContent = `Connexion réussie${data.user?.email ? ' : ' + data.user.email : ''}.`;
      showToast('Connexion réussie.');
      setTimeout(closeAuth, 900);
      await loadProfiles();
    }
  } catch (error) {
    message.classList.remove('success');
    message.textContent = error.message || 'Une erreur est survenue. Vérifie les paramètres Supabase.';
  } finally {
    submit.disabled = false;
    submit.innerHTML = authMode === 'signup' ? 'Créer mon compte <span>↗</span>' : 'Me connecter <span>↗</span>';
  }
}

function init() {
  $('#currentYear').textContent = new Date().getFullYear();
  $$('[data-open-auth]').forEach(button => button.addEventListener('click', () => { if (currentUser) { location.hash = '#annuaire'; } else { openAuth(button.dataset.openAuth); } }));
  $$('[data-auth-mode]').forEach(button => button.addEventListener('click', () => setAuthMode(button.dataset.authMode)));
  $('#closeModal').addEventListener('click', closeAuth);
  $('#authModal').addEventListener('click', event => { if (event.target === $('#authModal')) closeAuth(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAuth(); });
  $('#authForm').addEventListener('submit', submitAuth);
  $$('.filter-tab').forEach(button => button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    $$('.filter-tab').forEach(tab => tab.classList.toggle('active', tab === button));
    renderProfiles();
  }));
  $('#directorySearch').addEventListener('input', renderProfiles);
  $('#menuToggle').addEventListener('click', () => $('#navLinks').classList.toggle('open'));
  $$('#navLinks a').forEach(link => link.addEventListener('click', () => $('#navLinks').classList.remove('open')));
  initSession();
  initPosters();
  loadProfiles();
  loadEvents();
  if (!db) console.info('Basket Connect fonctionne en mode aperçu. Configure Supabase dans script.js pour activer les comptes et les données en ligne.');
}

document.addEventListener('DOMContentLoaded', init);


/* ===== SESSION (compte connecté) ===== */
let currentUser = null;
let currentProfile = null;

async function ensureProfile(user) {
  if (!db || !user) return null;
  let { data } = await db.from('profiles').select('id, username, user_type').eq('id', user.id).maybeSingle();
  if (!data) {
    const meta = user.user_metadata || {};
    const username = String(meta.username || (user.email || 'joueur').split('@')[0]).slice(0, 30);
    const { error } = await db.from('profiles').upsert({
      id: user.id, username,
      user_type: ['player', 'club', 'recruiter'].includes(meta.user_type) ? meta.user_type : 'player',
      city: meta.city ? String(meta.city).slice(0, 50) : null,
      is_public: true, age_category: meta.age_category === 'minor' ? 'minor' : 'adult'
    });
    if (error) { console.warn('Création du profil:', error.message); return null; }
    ({ data } = await db.from('profiles').select('id, username, user_type').eq('id', user.id).maybeSingle());
  }
  return data;
}

function updateHeader() {
  const box = $('#headerActions');
  if (!box) return;
  if (currentUser) {
    box.innerHTML = `<span class="user-chip">${escapeHTML(currentProfile?.username || currentUser.email || 'Membre')}</span><button class="btn btn-quiet" id="logoutBtn">Déconnexion</button>`;
    $('#logoutBtn').addEventListener('click', async () => { await db.auth.signOut(); showToast('Tu es déconnecté.'); });
  } else {
    box.innerHTML = `<button class="btn btn-quiet" data-open-auth="login">Connexion</button><button class="btn btn-primary" data-open-auth="signup">Rejoindre la communauté <span>↗</span></button>`;
    $$('#headerActions [data-open-auth]').forEach(button => button.addEventListener('click', () => openAuth(button.dataset.openAuth)));
  }
}

async function applySession(user) {
  currentUser = user || null;
  currentProfile = user ? await ensureProfile(user) : null;
  updateHeader();
  await Promise.all([loadProfiles(), loadPosters()]);
}

function initSession() {
  if (!db) { updateHeader(); return; }
  db.auth.onAuthStateChange((_event, session) => { setTimeout(() => applySession(session?.user), 0); });
}

/* ===== AFFICHES ===== */
let posters = [];
const safeUrl = (value) => { try { const url = new URL(value); return url.protocol === 'https:' ? url.href : ''; } catch { return ''; } };

function posterDownloadUrl(poster) {
  const ext = ((poster.poster_path || '').match(/\.[a-z0-9]+$/i) || ['.jpg'])[0];
  const name = (poster.title || 'affiche').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'affiche';
  if (db && poster.poster_path) return db.storage.from('event-posters').getPublicUrl(poster.poster_path, { download: `affiche-${name}${ext}` }).data.publicUrl;
  return safeUrl(poster.poster_url);
}

function emptyPosters(text, withLogin) {
  return `<article class="empty-state"><span class="empty-icon">🏀</span><h3>Affiches de la communauté</h3><p>${escapeHTML(text)}</p>${withLogin ? '<button class="btn btn-primary" data-open-auth="login">Se connecter</button>' : ''}</article>`;
}

function posterCard(poster) {
  const date = new Date(poster.event_date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });
  const mine = currentUser && poster.created_by === currentUser.id;
  const src = safeUrl(poster.poster_url);
  return `<article class="poster-card"><button type="button" class="poster-open" data-poster-view="${poster.id}" aria-label="Voir l’affiche en grand : ${escapeHTML(poster.title)}"><img src="${escapeHTML(src)}" alt="Affiche : ${escapeHTML(poster.title)}" loading="lazy"></button><div class="poster-tools"><button type="button" class="btn btn-outline" data-poster-view="${poster.id}">Voir en grand</button><a class="btn btn-primary" href="${escapeHTML(posterDownloadUrl(poster))}" download rel="noopener">Télécharger</a></div><span class="poster-kind">${escapeHTML(poster.kind)}</span><h3>${escapeHTML(poster.title)}</h3><div class="poster-meta"><span>📅 ${escapeHTML(date)}</span><span>📍 ${escapeHTML(poster.location)}</span></div><p><strong>Organisateur :</strong> ${escapeHTML(poster.organizer)}</p>${poster.description ? `<p>${escapeHTML(poster.description)}</p>` : ''}${mine ? `<button type="button" class="poster-delete" data-poster-delete="${poster.id}" data-poster-path="${escapeHTML(poster.poster_path || '')}">Supprimer mon affiche</button>` : ''}</article>`;
}

async function loadPosters() {
  const grid = $('#postersGrid'), status = $('#postersStatus');
  if (!grid) return;
  const bindLogin = () => grid.querySelectorAll('[data-open-auth]').forEach(button => button.addEventListener('click', () => openAuth(button.dataset.openAuth)));
  if (!db) { grid.innerHTML = emptyPosters('Configure Supabase dans script.js pour afficher les affiches.', false); return; }
  if (!currentUser) { posters = []; grid.innerHTML = emptyPosters('Connecte-toi pour voir les affiches de la communauté et publier la tienne.', true); status.textContent = ''; bindLogin(); return; }
  status.textContent = 'Chargement des affiches…';
  const { data, error } = await db.from('basketball_events').select('id, title, kind, organizer, location, event_date, description, poster_url, poster_path, created_by').order('event_date', { ascending: true }).limit(100);
  if (error) { console.warn('Chargement affiches:', error.message); status.textContent = 'Impossible de charger les affiches pour le moment.'; return; }
  const now = Date.now();
  posters = (data || []).sort((a, b) => {
    const A = new Date(a.event_date).getTime(), B = new Date(b.event_date).getTime(), upA = A >= now, upB = B >= now;
    return upA !== upB ? (upA ? -1 : 1) : (upA ? A - B : B - A);
  });
  grid.innerHTML = posters.length ? posters.map(posterCard).join('') : emptyPosters('Aucune affiche pour le moment. Publie la première affiche de la communauté !', false);
  status.textContent = posters.length ? `${posters.length} affiche${posters.length > 1 ? 's' : ''}.` : '';
}

function openPoster(id) {
  const list = posters;
  let index = list.findIndex(poster => String(poster.id) === String(id));
  if (index < 0) return;
  const previous = document.activeElement;
  const overlay = document.createElement('div');
  overlay.className = 'lb';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Affiche en grand');
  const show = () => {
    const poster = list[index];
    overlay.innerHTML = `<div class="lb-bar"><strong>${escapeHTML(poster.title)}</strong><span class="lb-act">${list.length > 1 ? '<button type="button" class="btn btn-outline" data-lb="prev" aria-label="Affiche précédente">←</button><button type="button" class="btn btn-outline" data-lb="next" aria-label="Affiche suivante">→</button>' : ''}<a class="btn btn-primary" href="${escapeHTML(posterDownloadUrl(poster))}" download rel="noopener">Télécharger l’image</a><button type="button" class="btn btn-outline" data-lb="close">Fermer</button></span></div><div class="lb-img"><img src="${escapeHTML(safeUrl(poster.poster_url))}" alt="Affiche : ${escapeHTML(poster.title)}"></div>`;
  };
  const close = () => { document.removeEventListener('keydown', onKey); overlay.remove(); document.body.style.overflow = ''; if (previous && previous.focus) previous.focus(); };
  const onKey = (event) => {
    if (event.key === 'Escape') close();
    else if (list.length > 1 && event.key === 'ArrowRight') { index = (index + 1) % list.length; show(); }
    else if (list.length > 1 && event.key === 'ArrowLeft') { index = (index + list.length - 1) % list.length; show(); }
  };
  overlay.addEventListener('click', (event) => {
    const button = event.target.closest('[data-lb]');
    if (button) {
      const action = button.dataset.lb;
      if (action === 'close') close();
      else { index = (index + (action === 'next' ? 1 : list.length - 1)) % list.length; show(); }
      return;
    }
    if (event.target === overlay || event.target.classList.contains('lb-img')) close();
  });
  show();
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  document.addEventListener('keydown', onKey);
  overlay.querySelector('[data-lb="close"]')?.focus();
}

function openPosterForm() {
  if (!db || !currentUser) { showToast('Connecte-toi pour publier une affiche.'); openAuth('login'); return; }
  if (!currentProfile) { showToast('Ton profil n’est pas prêt. Reconnecte-toi puis réessaie.'); return; }
  $('#pMsg').textContent = '';
  $('#posterModal').classList.add('open');
  $('#posterModal').setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => $('#pTitle').focus(), 100);
}
function closePosterForm() {
  $('#posterModal').classList.remove('open');
  $('#posterModal').setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

async function submitPoster(event) {
  event.preventDefault();
  const message = $('#pMsg'), submit = $('#pSubmit'), file = $('#pFile').files[0];
  message.classList.remove('success');
  message.textContent = '';
  if (!db || !currentUser) { message.textContent = 'Connecte-toi pour publier.'; return; }
  const title = $('#pTitle').value.trim(), organizer = $('#pOrg').value.trim(), place = $('#pPlace').value.trim(), when = $('#pDate').value;
  if (!title || !organizer || !place || !when || !file) { message.textContent = 'Remplis tous les champs obligatoires.'; return; }
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { message.textContent = 'Format accepté : JPG, PNG ou WebP.'; return; }
  if (file.size > 5 * 1024 * 1024) { message.textContent = 'L’image dépasse 5 Mo.'; return; }
  submit.disabled = true;
  submit.textContent = 'Publication en cours…';
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${currentUser.id}/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  try {
    const upload = await db.storage.from('event-posters').upload(path, file, { contentType: file.type, upsert: false });
    if (upload.error) throw new Error('Envoi de l’image impossible : ' + upload.error.message);
    const publicUrl = db.storage.from('event-posters').getPublicUrl(path).data.publicUrl;
    const insert = await db.from('basketball_events').insert({ title, kind: $('#pKind').value, organizer, location: place, event_date: new Date(when).toISOString(), description: $('#pDesc').value.trim(), poster_url: publicUrl, poster_path: path, created_by: currentUser.id });
    if (insert.error) { await db.storage.from('event-posters').remove([path]); throw new Error('Enregistrement impossible : ' + insert.error.message); }
    $('#posterForm').reset();
    $('#pPreview').classList.remove('show');
    closePosterForm();
    showToast('Affiche publiée !');
    await loadPosters();
    $('#affiches').scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    message.textContent = error.message || 'Une erreur est survenue.';
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Publier l’affiche <span>↗</span>';
  }
}

function initPosters() {
  $('#openPosterForm').addEventListener('click', openPosterForm);
  $('#closePoster').addEventListener('click', closePosterForm);
  $('#posterModal').addEventListener('click', event => { if (event.target === $('#posterModal')) closePosterForm(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && $('#posterModal').classList.contains('open')) closePosterForm(); });
  $('#posterForm').addEventListener('submit', submitPoster);
  $('#pFile').addEventListener('change', event => {
    const file = event.target.files[0], preview = $('#pPreview');
    if (preview.dataset.url) URL.revokeObjectURL(preview.dataset.url);
    if (file && file.type.startsWith('image/')) { const url = URL.createObjectURL(file); preview.dataset.url = url; preview.src = url; preview.classList.add('show'); }
    else preview.classList.remove('show');
  });
  $('#postersGrid').addEventListener('click', async event => {
    const view = event.target.closest('[data-poster-view]');
    if (view) { openPoster(view.dataset.posterView); return; }
    const del = event.target.closest('[data-poster-delete]');
    if (!del || !currentUser) return;
    if (!confirm('Supprimer cette affiche ?')) return;
    del.disabled = true;
    const { error } = await db.from('basketball_events').delete().eq('id', del.dataset.posterDelete).eq('created_by', currentUser.id);
    if (error) { del.disabled = false; showToast('Suppression impossible : ' + error.message); return; }
    if (del.dataset.posterPath) await db.storage.from('event-posters').remove([del.dataset.posterPath]);
    showToast('Affiche supprimée.');
    loadPosters();
  });
}
