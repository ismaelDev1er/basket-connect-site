/* BASKET CONNECT — JavaScript sans compilation.
   Pour activer Supabase, remplace les deux valeurs ci-dessous par celles de ton projet.
   Ne mets JAMAIS la clé service_role dans un fichier public. Utilise uniquement la clé anon/publishable. */
const SUPABASE_URL = 'https://TON-PROJET.supabase.co';
const SUPABASE_ANON_KEY = 'COLLE-ICI-TA-CLE-ANON';

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
    grid.innerHTML = `<article class="empty-state"><span class="empty-icon">${currentFilter === 'club' ? '🏀' : currentFilter === 'recruiter' ? '✦' : '⛹🏾'}</span><h3>Aucun profil pour le moment</h3><p>${db ? 'Aucun profil public ne correspond à cette recherche. Essaie une autre ville ou reviens plus tard.' : 'Configure Supabase dans script.js pour charger les profils réels. Tu peux aussi créer ton compte dès que la base est prête.'}</p><button class="btn btn-primary" data-open-auth="signup">${currentFilter === 'club' ? 'Inscrire mon club' : 'Rejoindre Basket Connect'} <span>↗</span></button></article>`;
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
  submit.disabled = true;
  submit.textContent = authMode === 'signup' ? 'Création du compte…' : 'Connexion…';
  try {
    if (authMode === 'signup') {
      const userType = $('#userType').value;
      const { data, error } = await db.auth.signUp({email, password, options:{data:{username, user_type:userType, city}}});
      if (error) throw error;
      if (data.user && data.session) {
        const { error: profileError } = await db.from('profiles').upsert({id:data.user.id, username, user_type:userType, city, is_public:true, age_category:'adult'});
        if (profileError) throw profileError;
        message.classList.add('success');
        message.textContent = 'Compte créé ! Ton profil est prêt.';
        showToast('Bienvenue dans Basket Connect !');
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
  $$('[data-open-auth]').forEach(button => button.addEventListener('click', () => openAuth(button.dataset.openAuth)));
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
  loadProfiles();
  loadEvents();
  if (!db) console.info('Basket Connect fonctionne en mode aperçu. Configure Supabase dans script.js pour activer les comptes et les données en ligne.');
}

document.addEventListener('DOMContentLoaded', init);
