(() => {
  const $ = (id) => document.getElementById(id);
  const cfg = window.BC_CONFIG;
  const gate = $("gate");
  if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) { gate.textContent = "Supabase n'est pas configuré (js/config.js)."; return; }
  const sb = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  const ROLES = { player: "Joueur", club: "Club", recruiter: "Recruteur", supporter: "Supporter", admin: "Administrateur" };
  const isMinor = () => { const v = $("p-birth").value; if (!v) return false; const d = new Date(v); d.setFullYear(d.getFullYear() + 18); return d > new Date(); };
  const note = () => $("minor-note").classList.toggle("hidden", !isMinor());
  const say = (id, text, err) => { $(id).className = "msg" + (err ? " err" : ""); $(id).textContent = text; };

  async function init() {
    const { data: s } = await sb.auth.getSession();
    if (!s.session) { gate.textContent = "Connecte-toi depuis la page d'accueil pour modifier ton profil."; return; }
    const uid = s.session.user.id;
    const { data: p, error } = await sb.from("profiles").select("*").eq("id", uid).single();
    if (error) { gate.className = "msg err"; gate.textContent = "Profil introuvable. Réessaie dans un instant."; return; }
    gate.classList.add("hidden"); $("pf").classList.remove("hidden");
    $("role-info").textContent = "Type de compte : " + ROLES[p.role] + (p.is_verified ? " (vérifié)" : "");
    if (["club", "recruiter"].includes(p.role) && !p.is_verified) $("verify").classList.remove("hidden");
    const map = { "p-name": "display_name", "p-birth": "birth_date", "p-phone": "phone", "p-city": "city", "p-pos": "position", "p-level": "level", "p-height": "height_cm", "p-bio": "bio", "p-video": "video_url" };
    for (const [id, col] of Object.entries(map)) $(id).value = p[col] ?? "";
    $("p-looking").checked = p.looking_for_club; $("p-public").checked = p.is_public; note();
    $("p-birth").addEventListener("change", note);

    $("pf").onsubmit = async (e) => {
      e.preventDefault();
      const video = $("p-video").value.trim();
      if (video && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be|vimeo\.com)\//.test(video)) { say("p-msg", "Le lien vidéo doit venir de YouTube ou Vimeo (https).", true); return; }
      const h = $("p-height").value;
      const upd = { display_name: $("p-name").value.trim(), birth_date: $("p-birth").value || null, phone: $("p-phone").value.trim() || null,
        city: $("p-city").value.trim() || null, position: $("p-pos").value || null, level: $("p-level").value || null,
        height_cm: h ? parseInt(h, 10) : null, bio: $("p-bio").value.trim() || null, video_url: video || null,
        looking_for_club: $("p-looking").checked, is_public: $("p-public").checked };
      const { error } = await sb.from("profiles").update(upd).eq("id", uid);
      say("p-msg", error ? "Enregistrement impossible. Vérifie les champs et réessaie." : "Profil enregistré.", !!error);
    };

    $("vf").onsubmit = async (e) => {
      e.preventDefault();
      const { error } = await sb.from("verification_requests").insert({ user_id: uid, kind: p.role, note: $("v-note").value.trim() });
      say("v-msg", error ? "Demande non envoyée. Réessaie plus tard." : "Demande envoyée. L'administration la traitera prochainement.", !!error);
    };
  }
  init();
})();
