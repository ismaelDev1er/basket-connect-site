// db.js : connexion Supabase et chargement des données publiques

if (SUPABASE_URL.includes("VOTRE-PROJET") || SUPABASE_ANON_KEY.includes("VOTRE_CLE")) {
    console.warn("config.js : renseignez SUPABASE_URL et SUPABASE_ANON_KEY.");
}

const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const fmtDate = iso => new Date(iso)
    .toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" })
    .toUpperCase();

const fmtTime = iso => new Date(iso)
    .toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

const fmtHeight = cm =>
    `${Math.floor(cm / 100)}m${String(cm % 100).padStart(2, "0")}`;

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
        db.from("competitions").select("id", { count: "exact", head: true })
            .eq("is_published", true)
    ]);

    for (const r of [clubsRes, playersRes, matchesRes, citiesRes, standingsRes, matchCountRes, compCountRes]) {
        if (r.error) throw r.error;
    }

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
