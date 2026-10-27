(() => {
  const $ = (id) => document.getElementById(id);
  const cfg = window.BC_CONFIG;
  const ready = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY;
  const sb = ready ? supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY) : null;
  let mode = "login";

  // Affichage sûr : uniquement textContent (pas d'injection HTML / XSS).
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };

  function card(p) {
    const c = el("article", "card");
    c.append(el("h3", "", p.display_name));
    c.append(el("div", "meta", [p.position, p.city, p.height_cm ? p.height_cm + " cm" : null].filter(Boolean).join(" · ") || "Profil en cours"));
    if (p.level) c.append(el("div", "meta", "Niveau : " + p.level));
    if (p.looking_for_club) c.append(el("span", "tag", "Cherche un club"));
    return c;
  }

  async function loadPlayers() {
    const box = $("players"), st = $("status");
    box.replaceChildren(); st.className = "msg";
    if (!ready) { st.textContent = "Connexion à Supabase non configurée : renseigne js/config.js."; return; }
    let q = sb.from("public_players").select("*").order("display_name").limit(60);
    const name = $("f-q").value.trim().replace(/[%,()]/g, "");
    if (name) q = q.ilike("display_name", `%${name}%`);
    const city = $("f-city").value.trim().replace(/[%,()]/g, "");
    if (city) q = q.ilike("city", `%${city}%`);
    if ($("f-pos").value) q = q.eq("position", $("f-pos").value);
    if ($("f-level").value) q = q.eq("level", $("f-level").value);
    const { data, error } = await q;
    if (error) { st.className = "msg err"; st.textContent = "Impossible de charger les joueurs. Vérifie ta connexion et réessaie."; return; }
    st.textContent = data.length ? "" : "Aucun joueur public ne correspond à ces critères.";
    data.forEach((p) => box.append(card(p)));
  }

  function setMode(m) {
    mode = m;
    $("dlg-title").textContent = m === "login" ? "Se connecter" : "Créer un compte";
    $("a-submit").textContent = m === "login" ? "Se connecter" : "Créer mon compte";
    $("l-name").classList.toggle("hidden", m === "login");
    $("l-type").classList.toggle("hidden", m === "login");
    $("a-pass").autocomplete = m === "login" ? "current-password" : "new-password";
    $("a-msg").textContent = ""; $("dlg").showModal();
  }

  async function submit(e) {
    e.preventDefault();
    const msg = $("a-msg"); msg.className = "msg";
    if (!ready) { msg.className = "msg err"; msg.textContent = "Supabase n'est pas configuré (js/config.js)."; return; }
    const email = $("a-email").value.trim(), password = $("a-pass").value;
    if (mode === "login") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) { msg.className = "msg err"; msg.textContent = "E-mail ou mot de passe incorrect."; return; }
      $("dlg").close();
    } else {
      const { error } = await sb.auth.signUp({ email, password, options: { data: { display_name: $("a-name").value.trim(), account_type: $("a-type").value } } });
      if (error) { msg.className = "msg err"; msg.textContent = "Inscription impossible : " + error.message; return; }
      msg.textContent = "Compte créé. Confirme ton adresse e-mail grâce au lien reçu, puis connecte-toi.";
    }
  }

  async function refreshSession() {
    const { data } = ready ? await sb.auth.getSession() : { data: {} };
    const user = data.session && data.session.user;
    ["btn-login", "btn-signup"].forEach((i) => $(i).classList.toggle("hidden", !!user));
    $("btn-logout").classList.toggle("hidden", !user);
    $("who").classList.toggle("hidden", !user);
    $("btn-profile").classList.toggle("hidden", !user);
    if (user) $("who").textContent = user.email;
  }

  $("btn-login").onclick = () => setMode("login");
  $("btn-signup").onclick = $("cta-signup").onclick = () => setMode("signup");
  $("a-cancel").onclick = () => $("dlg").close();
  $("auth-form").onsubmit = submit;
  $("a-reset").onclick = async () => {
    const email = $("a-email").value.trim(); const msg = $("a-msg");
    if (!email || !ready) { msg.textContent = "Saisis ton adresse e-mail d'abord."; return; }
    await sb.auth.resetPasswordForEmail(email);
    msg.textContent = "Si ce compte existe, un e-mail de récupération vient d'être envoyé.";
  };
  $("btn-logout").onclick = async () => { await sb.auth.signOut(); };
  ["f-q", "f-city"].forEach((i) => $(i).addEventListener("input", () => { clearTimeout(loadPlayers.t); loadPlayers.t = setTimeout(loadPlayers, 300); }));
  ["f-pos", "f-level"].forEach((i) => $(i).addEventListener("change", loadPlayers));
  if (ready) sb.auth.onAuthStateChange(refreshSession);
  refreshSession(); loadPlayers();
})();
