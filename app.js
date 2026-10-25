(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const config = window.BASKET_CONNECT_CONFIG || {};
  const configured = /^https:\/\/.+\.supabase\.co$/.test(config.SUPABASE_URL || "") &&
    config.SUPABASE_ANON_KEY && !String(config.SUPABASE_ANON_KEY).includes("VOTRE_");
  const supabase = configured && window.supabase
    ? window.supabase.createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      }) : null;
  const dialog = $("auth-dialog");
  let authMode = "login";
  let toastTimer;
  const toast = (message) => {
    const el = $("toast"); el.textContent = message; el.classList.add("show");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove("show"), 3500);
  };
  const requireAuth = async (feature) => {
    if (!supabase) return toast("Configure d’abord config.js avec ton projet Supabase de test.");
    const { data } = await supabase.auth.getSession();
    if (!data.session) { toast("Connecte-toi pour accéder à cette rubrique."); openAuth("login"); return false; }
    toast(feature + " : le module sera activé dans la prochaine phase.");
    return true;
  };
  function openAuth(mode) {
    authMode = mode; const signup = mode === "signup";
    $("auth-title").textContent = signup ? "Créer un compte" : "Connexion";
    $("auth-description").textContent = signup ? "Rejoins la communauté Basket Connect." : "Connecte-toi pour retrouver ton espace.";
    $("auth-submit").textContent = signup ? "Créer mon compte" : "Se connecter";
    $("signup-fields").hidden = !signup;
    $("switch-label").textContent = signup ? "Déjà membre ?" : "Nouveau ici ?";
    $("switch-auth").textContent = signup ? "Se connecter" : "Créer un compte";
    $("auth-message").textContent = "";
    $("auth-password").autocomplete = signup ? "new-password" : "current-password";
    if (!dialog.open) dialog.showModal();
  }
  $("login-open").addEventListener("click", () => openAuth("login"));
  $("signup-open").addEventListener("click", () => openAuth("signup"));
  $("hero-signup").addEventListener("click", () => openAuth("signup"));
  $("club-signup").addEventListener("click", () => { openAuth("signup"); $("auth-role").value = "club"; });
  $("switch-auth").addEventListener("click", () => openAuth(authMode === "login" ? "signup" : "login"));
  $("menu-toggle").addEventListener("click", () => {
    const nav = document.querySelector(".topbar nav");
    nav.classList.toggle("mobile-nav");
    nav.style.display = nav.classList.contains("mobile-nav") ? "flex" : "";
  });
  $("community-open").addEventListener("click", () => requireAuth("Communauté"));
  $("events-open").addEventListener("click", () => requireAuth("Événements et affiches"));
  $("forgot-password").addEventListener("click", async () => {
    if (!supabase) return toast("Configure d’abord config.js avec Supabase.");
    const email = $("auth-email").value.trim();
    if (!email) return $("auth-message").textContent = "Saisis d’abord ton adresse e-mail.";
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    $("auth-message").textContent = error ? error.message : "Si le compte existe, un lien de réinitialisation a été envoyé.";
  });
  $("auth-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!supabase) return $("auth-message").textContent = "Supabase n’est pas configuré. Modifie config.js (projet de test uniquement).";
    const email = $("auth-email").value.trim();
    const password = $("auth-password").value;
    const button = $("auth-submit"); button.disabled = true; button.textContent = "Patiente…";
    try {
      let result;
      if (authMode === "signup") {
        result = await supabase.auth.signUp({ email, password, options: { data: {
          pseudo: $("auth-pseudo").value.trim() || email.split("@")[0],
          requested_role: $("auth-role").value
        }}});
        if (!result.error && result.data.user) {
          $("auth-message").textContent = result.data.session
            ? "Compte créé. Complète ton profil depuis ton espace."
            : "Compte créé. Vérifie ta boîte e-mail pour confirmer l’adresse.";
        }
      } else {
        result = await supabase.auth.signInWithPassword({ email, password });
        if (!result.error) { $("auth-message").textContent = "Connexion réussie."; setTimeout(() => dialog.close(), 700); toast("Bienvenue sur Basket Connect !"); }
      }
      if (result.error) $("auth-message").textContent = result.error.message;
    } catch (error) {
      $("auth-message").textContent = "Une erreur est survenue. Vérifie ta connexion et réessaie.";
    } finally {
      button.disabled = false; button.textContent = authMode === "signup" ? "Créer mon compte" : "Se connecter";
    }
  });
  async function loadPlayers() {
    const grid = $("players-grid");
    if (!supabase) {
      grid.innerHTML = '<div class="empty-state">La base de données n’est pas encore configurée. Les profils réels apparaîtront après la configuration sécurisée de Supabase.</div>';
      return;
    }
    grid.innerHTML = '<div class="empty-state">Chargement des profils publics…</div>';
    let query = supabase.from("public_player_profiles").select("user_id,pseudo,city,position,height_cm,level,category").order("pseudo").limit(30);
    const search = $("player-search").value.trim();
    const city = $("city-filter").value;
    const position = $("position-filter").value;
    if (search) query = query.ilike("pseudo", `%${search.replace(/[%_]/g, "")}%`);
    if (city) query = query.eq("city", city);
    if (position) query = query.eq("position", position);
    const { data, error } = await query;
    if (error) {
      grid.innerHTML = '<div class="empty-state">Impossible de charger les profils. Vérifie que le schéma SQL de test est installé et que la vue publique est accessible.</div>';
      return;
    }
    if (!data || !data.length) {
      grid.innerHTML = '<div class="empty-state">Aucun profil public pour le moment. Sois le premier à rejoindre Basket Connect.</div>';
      return;
    }
    grid.replaceChildren();
    data.forEach(player => {
      const card = document.createElement("article"); card.className = "player-card";
      const avatar = document.createElement("div"); avatar.className = "avatar"; avatar.textContent = "🏀";
      const details = document.createElement("div");
      const name = document.createElement("h3"); name.textContent = player.pseudo || "Joueur";
      const info = document.createElement("p");
      info.textContent = [player.city, player.position, player.height_cm ? `${player.height_cm} cm` : null].filter(Boolean).join(" · ") || "Profil sportif";
      const tag = document.createElement("span"); tag.className = "tag"; tag.textContent = player.level || player.category || "Basketball";
      details.append(name, info, tag); card.append(avatar, details); grid.append(card);
    });
  }
  $("refresh-players").addEventListener("click", loadPlayers);
  ["player-search", "city-filter", "position-filter"].forEach(id => $(id).addEventListener(id === "player-search" ? "input" : "change", () => {
    clearTimeout(window._playerSearchTimer); window._playerSearchTimer = setTimeout(loadPlayers, 250);
  }));
  if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) toast("Connecté à Basket Connect.");
    });
  }
  $("year").textContent = new Date().getFullYear();
  loadPlayers();
})();