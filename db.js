// db.js : connexion Supabase, lecture publique, authentification, profil et administration

if (SUPABASE_URL.includes("VOTRE-PROJET") || SUPABASE_ANON_KEY.includes("VOTRE_CLE")) {
    console.warn("config.js : renseignez SUPABASE_URL et SUPABASE_ANON_KEY.");
}

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


/* ---------- Outils ---------- */

const fmtDate = iso => new Date(iso)
    .toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" })
    .toUpperCase();

const fmtTime = iso => new Date(iso)
    .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

const fmtDateTime = iso => new Date(iso)
    .toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

const fmtHeight = cm =>
    `${Math.floor(cm / 100)}m${String(cm % 100).padStart(2, "0")}`;

function ageFrom(birthIso) {
    const b = new Date(birthIso);
    const t = new Date();
    let age = t.getFullYear() - b.getFullYear();
    const m = t.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
    return age;
}

function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function throwIfError(...results) {
    for (const r of results) {
        if (r && r.error) throw r.error;
    }
}

function pageUrl(page) {
    return new URL(page, window.location.href).href;
}


/* ---------- Lecture publique (site) ---------- */

async function loadBasketData() {

    const { data: comp, error: compError } = await db
        .from("competitions")
        .select("id, season")
        .eq("is_published", true)
        .order("season", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (compError) throw compError;

    const [
        clubsRes,
        playersRes,
        matchesRes,
        citiesRes,
        standingsRes,
        matchCountRes,
        compCountRes
    ] = await Promise.all([
        db.from("public_clubs").select("*").order("name"),
        db.from("public_players").select("*").order("last_name"),
        db.from("match_details").select("*").eq("status", "scheduled").order("scheduled_at"),
        db.from("cities").select("city"),
        comp
            ? db.from("competition_standings").select("*")
                .eq("competition_id", comp.id).order("position")
            : Promise.resolve({ data: [], error: null }),
        db.from("match_details").select("id", { count: "exact", head: true }),
        db.from("competitions").select("id", { count: "exact", head: true }).eq("is_published", true)
    ]);

    throwIfError(clubsRes, playersRes, matchesRes, citiesRes, standingsRes, matchCountRes, compCountRes);

    return {
        season: comp ? comp.season : "",

        counts: {
            clubs: clubsRes.data.length,
            players: playersRes.data.length,
            competitions: compCountRes.count ?? 0,
            matches: matchCountRes.count ?? 0
        },

        clubs: clubsRes.data.map(c => ({
            id: c.id,
            name: c.name,
            city: c.city,
            players: c.players_count,
            genders: c.genders.map(g => g === "homme" ? "hommes" : "dames"),
            categories: c.categories
        })),

        players: playersRes.data.map(p => ({
            id: p.id,
            firstName: p.first_name,
            lastName: p.last_name,
            age: p.age,
            city: p.city,
            height: p.height_cm ? fmtHeight(p.height_cm) : "",
            position: p.position,
            gender: p.gender === "homme" ? "Homme" : "Femme"
        })),

        matches: matchesRes.data.map(m => ({
            home: m.home_club,
            away: m.away_club,
            date: fmtDate(m.scheduled_at),
            time: fmtTime(m.scheduled_at),
            place: m.venue || ""
        })),

        standings: standingsRes.data.map(s => ({
            position: s.position,
            club: s.club_name,
            games: s.games,
            wins: s.wins,
            losses: s.losses,
            points: s.points
        })),

        cities: citiesRes.data.map(c => c.city)
    };
}


/* ---------- Authentification ---------- */

async function signIn(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
}

// Renvoie la session si l'inscription est immédiate, sinon null (confirmation par email)
async function signUp(email, password) {
    const { data, error } = await db.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: pageUrl("profil.html") }
    });
    if (error) throw error;
    return data.session;
}

async function sendPasswordReset(email) {
    const { error } = await db.auth.resetPasswordForEmail(email, {
        redirectTo: pageUrl("profil.html")
    });
    if (error) throw error;
}

async function updatePassword(password) {
    const { error } = await db.auth.updateUser({ password });
    if (error) throw error;
}

async function signOut() {
    const { error } = await db.auth.signOut();
    if (error) throw error;
}

async function currentUser() {
    const { data } = await db.auth.getUser();
    return data ? data.user : null;
}

// Vérifié côté base (fonction is_admin) : le navigateur ne voit jamais la table admin_users
async function isAdmin() {
    const { data, error } = await db.rpc("is_admin");
    if (error) return false;
    return data === true;
}


/* ---------- Profil joueur ---------- */

async function getMyPlayer(userId) {
    const { data, error } = await db
        .from("players")
        .select("*, clubs(name)")
        .eq("user_id", userId)
        .maybeSingle();
    if (error) throw error;
    return data;
}

async function createMyPlayer(userId, fields) {
    const { error } = await db.from("players").insert({ ...fields, user_id: userId });
    if (error) throw error;
}

async function updateMyPlayer(id, fields) {
    const { error } = await db.from("players").update(fields).eq("id", id);
    if (error) throw error;
}


/* ---------- Administration ---------- */

async function adminListPlayers() {
    const { data, error } = await db
        .from("players")
        .select("*, clubs(name)")
        .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
}

async function adminUpdatePlayer(id, patch) {
    const { error } = await db.from("players").update(patch).eq("id", id);
    if (error) throw error;
}

async function adminListClubs() {
    const { data, error } = await db.from("clubs").select("*").order("name");
    if (error) throw error;
    return data;
}

async function adminCreateClub(row) {
    const { error } = await db.from("clubs").insert(row);
    if (error) throw error;
}

async function adminDeleteClub(id) {
    const { error } = await db.from("clubs").delete().eq("id", id);
    if (error) throw error;
}

async function adminListVenues() {
    const { data, error } = await db.from("venues").select("*").order("name");
    if (error) throw error;
    return data;
}

async function adminCreateVenue(row) {
    const { error } = await db.from("venues").insert(row);
    if (error) throw error;
}

async function adminDeleteVenue(id) {
    const { error } = await db.from("venues").delete().eq("id", id);
    if (error) throw error;
}

async function adminListCompetitions() {
    const { data, error } = await db.from("competitions").select("*")
        .order("season", { ascending: false });
    if (error) throw error;
    return data;
}

async function adminCreateCompetition(row) {
    const { error } = await db.from("competitions").insert(row);
    if (error) throw error;
}

async function adminSetCompetitionPublished(id, published) {
    const { error } = await db.from("competitions").update({ is_published: published }).eq("id", id);
    if (error) throw error;
}

async function adminListMatches() {
    const { data, error } = await db
        .from("matches")
        .select("*, home:clubs!home_club_id(name), away:clubs!away_club_id(name), competitions(name), venues(name)")
        .order("scheduled_at", { ascending: false });
    if (error) throw error;
    return data;
}

async function adminCreateMatch(row) {
    const { error } = await db.from("matches").insert(row);
    if (error) throw error;
}

async function adminUpdateMatch(id, patch) {
    const { error } = await db.from("matches").update(patch).eq("id", id);
    if (error) throw error;
}

async function adminDeleteMatch(id) {
    const { error } = await db.from("matches").delete().eq("id", id);
    if (error) throw error;
}
