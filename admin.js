// admin.js : espace administrateur

const $ = id => document.getElementById(id);

const state = { clubs: [], venues: [], competitions: [] };

const STATUS_LABELS = { scheduled: "À venir", live: "En direct", finished: "Terminé" };
const GENDER_LABELS = { homme: "Hommes", femme: "Dames" };


/* ---------- Messages ---------- */

function flash(text, isError = false) {
    const el = $("adminStatus");
    el.textContent = text;
    el.className = "admin-status " + (isError ? "is-error" : "is-ok");
}

function dbMessage(err) {

    const t = (err && err.message) || String(err);

    if (t.includes("matches_finished_scores"))
        return "Un match terminé doit avoir deux scores différents (pas de match nul au basket).";
    if (t.includes("matches_live_period"))
        return "Un match en direct doit avoir une période (par exemple Q4).";
    if (t.includes("matches_teams_differ"))
        return "Les deux équipes doivent être différentes.";
    if (t.includes("violates foreign key"))
        return "Suppression impossible : cet élément est utilisé ailleurs (matchs ou fiches).";
    if (t.includes("duplicate key"))
        return "Ce nom existe déjà.";
    if (t.includes("Champ réservé"))
        return "Ce champ est réservé à l'administration.";
    if (t.includes("row-level security"))
        return "Action refusée : ce compte n'a pas les droits nécessaires.";

    return t;

}


/* ---------- Listes déroulantes ---------- */

function clubOptions(selectedId) {
    return `<option value="">— aucun —</option>` + state.clubs
        .map(c => `<option value="${c.id}" ${c.id === selectedId ? "selected" : ""}>${esc(c.name)}</option>`)
        .join("");
}

function fillSelect(id, items, placeholder) {
    const el = $(id);
    const previous = el.value;
    el.innerHTML = (placeholder ? `<option value="">${placeholder}</option>` : "") +
        items.map(i => `<option value="${i.id}">${esc(i.label)}</option>`).join("");
    if (previous) el.value = previous;
}

function refreshSelects() {
    const clubItems = state.clubs.map(c => ({ id: c.id, label: c.name }));
    fillSelect("matchHome", clubItems, "Choisir");
    fillSelect("matchAway", clubItems, "Choisir");
    fillSelect("matchVenue", state.venues.map(v => ({ id: v.id, label: v.city ? `${v.name} (${v.city})` : v.name })), "Non précisé");
    fillSelect("matchComp", state.competitions.map(c => ({ id: c.id, label: `${c.name} ${c.season}` })), "Choisir");
}


/* ---------- Fiches joueurs ---------- */

async function renderPlayers() {

    const rows = await adminListPlayers();

    if (!rows.length) {
        $("playersList").innerHTML = '<p class="admin-empty">Aucune fiche joueur pour le moment.</p>';
        return;
    }

    $("playersList").innerHTML = `
        <div class="admin-scroll">
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Joueur</th><th>Âge</th><th>Ville</th><th>Poste</th>
                    <th>Club</th><th>Publiée</th><th></th>
                </tr>
            </thead>
            <tbody>
                ${rows.map(p => `
                <tr data-id="${p.id}" data-birth="${esc(p.birth_date)}">
                    <td>${esc(p.first_name)} ${esc(p.last_name)}</td>
                    <td>${ageFrom(p.birth_date)}</td>
                    <td>${esc(p.city || "")}</td>
                    <td>${esc(p.position || "")}</td>
                    <td><select data-field="club">${clubOptions(p.club_id)}</select></td>
                    <td><input type="checkbox" data-field="published" ${p.is_published ? "checked" : ""}></td>
                    <td><button type="button" class="btn-small" data-action="save-player">Enregistrer</button></td>
                </tr>`).join("")}
            </tbody>
        </table>
        </div>`;

}


/* ---------- Clubs ---------- */

async function renderClubs() {

    if (!state.clubs.length) {
        $("clubsList").innerHTML = '<p class="admin-empty">Aucun club pour le moment.</p>';
        return;
    }

    $("clubsList").innerHTML = `
        <div class="admin-scroll">
        <table class="admin-table">
            <thead>
                <tr><th>Nom</th><th>Sigle</th><th>Ville</th><th>Équipes</th><th>Catégories</th><th></th></tr>
            </thead>
            <tbody>
                ${state.clubs.map(c => `
                <tr data-id="${c.id}">
                    <td>${esc(c.name)}</td>
                    <td>${esc(c.short_name)}</td>
                    <td>${esc(c.city)}</td>
                    <td>${c.genders.map(g => GENDER_LABELS[g] || g).join(", ")}</td>
                    <td>${c.categories.join(", ")}</td>
                    <td><button type="button" class="btn-small btn-danger" data-action="delete-club">Supprimer</button></td>
                </tr>`).join("")}
            </tbody>
        </table>
        </div>`;

}


/* ---------- Lieux ---------- */

function renderVenues() {

    if (!state.venues.length) {
        $("venuesList").innerHTML = '<p class="admin-empty">Aucun lieu pour le moment.</p>';
        return;
    }

    $("venuesList").innerHTML = `
        <div class="admin-scroll">
        <table class="admin-table">
            <thead><tr><th>Nom</th><th>Ville</th><th></th></tr></thead>
            <tbody>
                ${state.venues.map(v => `
                <tr data-id="${v.id}">
                    <td>${esc(v.name)}</td>
                    <td>${esc(v.city || "À renseigner")}</td>
                    <td><button type="button" class="btn-small btn-danger" data-action="delete-venue">Supprimer</button></td>
                </tr>`).join("")}
            </tbody>
        </table>
        </div>`;

}


/* ---------- Compétitions ---------- */

function renderCompetitions() {

    if (!state.competitions.length) {
        $("competitionsList").innerHTML = '<p class="admin-empty">Aucune compétition pour le moment.</p>';
        return;
    }

    $("competitionsList").innerHTML = `
        <div class="admin-scroll">
        <table class="admin-table">
            <thead>
                <tr><th>Compétition</th><th>Saison</th><th>Points V / D</th><th>Visibilité</th><th></th></tr>
            </thead>
            <tbody>
                ${state.competitions.map(c => `
                <tr data-id="${c.id}">
                    <td>${esc(c.name)}</td>
                    <td>${c.season}</td>
                    <td>${c.points_win} / ${c.points_loss}</td>
                    <td>
                        <span class="status-pill ${c.is_published ? "ok" : "wait"}">
                            ${c.is_published ? "Publiée" : "Brouillon"}
                        </span>
                    </td>
                    <td>
                        <button type="button" class="btn-small" data-action="toggle-comp"
                                data-next="${!c.is_published}">
                            ${c.is_published ? "Dépublier" : "Publier"}
                        </button>
                    </td>
                </tr>`).join("")}
            </tbody>
        </table>
        </div>`;

}


/* ---------- Matchs et scores ---------- */

async function renderMatches() {

    const rows = await adminListMatches();

    if (!rows.length) {
        $("matchesList").innerHTML = '<p class="admin-empty">Aucun match pour le moment.</p>';
        return;
    }

    $("matchesList").innerHTML = `
        <div class="admin-scroll">
        <table class="admin-table">
            <thead>
                <tr>
                    <th>Date (UTC)</th><th>Rencontre</th><th>Statut</th><th>Période</th>
                    <th>Score domicile</th><th>Score extérieur</th><th></th>
                </tr>
            </thead>
            <tbody>
                ${rows.map(m => `
                <tr data-id="${m.id}">
                    <td>
                        ${esc(fmtDateTime(m.scheduled_at))}
                        <br><small class="muted">${esc(m.competitions ? m.competitions.name : "")}</small>
                    </td>
                    <td>
                        ${esc(m.home ? m.home.name : "")} — ${esc(m.away ? m.away.name : "")}
                        <br><small class="muted">${esc(m.venues ? m.venues.name : "")}</small>
                    </td>
                    <td>
                        <select data-field="status">
                            ${Object.entries(STATUS_LABELS).map(([v, label]) =>
                                `<option value="${v}" ${m.status === v ? "selected" : ""}>${label}</option>`).join("")}
                        </select>
                    </td>
                    <td><input type="text" data-field="period" value="${esc(m.current_period || "")}" placeholder="Q4" size="4"></td>
                    <td><input type="number" min="0" data-field="home" value="${m.home_score ?? ""}"></td>
                    <td><input type="number" min="0" data-field="away" value="${m.away_score ?? ""}"></td>
                    <td>
                        <button type="button" class="btn-small" data-action="save-match">Enregistrer</button>
                        <button type="button" class="btn-small btn-danger" data-action="delete-match">Supprimer</button>
                    </td>
                </tr>`).join("")}
            </tbody>
        </table>
        </div>`;

}


/* ---------- Chargement global ---------- */

async function refreshAll() {

    state.clubs = await adminListClubs();
    state.venues = await adminListVenues();
    state.competitions = await adminListCompetitions();

    refreshSelects();

    await Promise.all([renderPlayers(), renderMatches()]);
    await renderClubs();
    renderVenues();
    renderCompetitions();

}


/* ---------- Actions ---------- */

document.addEventListener("click", async event => {

    const btn = event.target.closest("[data-action]");
    if (!btn) return;

    const row = btn.closest("tr");
    const id = row ? row.dataset.id : null;

    try {

        switch (btn.dataset.action) {

            case "save-player": {
                const club = row.querySelector("[data-field=club]").value || null;
                const published = row.querySelector("[data-field=published]").checked;
                await adminUpdatePlayer(id, { club_id: club, is_published: published });
                await renderPlayers();
                const minor = ageFrom(row.dataset.birth) < 18;
                flash(published && minor
                    ? "Fiche enregistrée. Ce joueur a moins de 18 ans : il reste masqué du public."
                    : "Fiche enregistrée.");
                break;
            }

            case "delete-club":
                if (!confirm("Supprimer ce club ?")) return;
                await adminDeleteClub(id);
                await refreshAll();
                flash("Club supprimé.");
                break;

            case "delete-venue":
                if (!confirm("Supprimer ce lieu ?")) return;
                await adminDeleteVenue(id);
                await refreshAll();
                flash("Lieu supprimé.");
                break;

            case "toggle-comp":
                await adminSetCompetitionPublished(id, btn.dataset.next === "true");
                await refreshAll();
                flash("Visibilité de la compétition mise à jour.");
                break;

            case "save-match": {
                const status = row.querySelector("[data-field=status]").value;
                const period = row.querySelector("[data-field=period]").value.trim();
                const num = field => {
                    const v = row.querySelector(`[data-field=${field}]`).value;
                    return v === "" ? null : Number(v);
                };
                await adminUpdateMatch(id, {
                    status,
                    current_period: status === "live" ? (period || null) : null,
                    home_score: num("home"),
                    away_score: num("away")
                });
                await renderMatches();
                flash("Match enregistré.");
                break;
            }

            case "delete-match":
                if (!confirm("Supprimer ce match et son historique de scores ?")) return;
                await adminDeleteMatch(id);
                await renderMatches();
                flash("Match supprimé.");
                break;
        }

    } catch (err) {

        flash(dbMessage(err), true);

    }

});


$("clubForm").addEventListener("submit", async event => {

    event.preventDefault();

    const genders = [...document.querySelectorAll("input[name=clubGender]:checked")].map(i => i.value);
    const categories = [...document.querySelectorAll("input[name=clubCategory]:checked")].map(i => i.value);

    if (!genders.length) {
        flash("Choisissez au moins une équipe (hommes ou dames).", true);
        return;
    }

    try {
        await adminCreateClub({
            name: $("clubName").value.trim(),
            short_name: $("clubShort").value.trim(),
            city: $("clubCity").value.trim(),
            genders,
            categories
        });
        event.target.reset();
        await refreshAll();
        flash("Club créé.");
    } catch (err) {
        flash(dbMessage(err), true);
    }

});


$("venueForm").addEventListener("submit", async event => {

    event.preventDefault();

    try {
        await adminCreateVenue({
            name: $("venueName").value.trim(),
            city: $("venueCity").value.trim() || null
        });
        event.target.reset();
        await refreshAll();
        flash("Lieu ajouté.");
    } catch (err) {
        flash(dbMessage(err), true);
    }

});


$("compForm").addEventListener("submit", async event => {

    event.preventDefault();

    try {
        await adminCreateCompetition({
            name: $("compName").value.trim(),
            season: Number($("compSeason").value),
            points_win: Number($("compWin").value),
            points_loss: Number($("compLoss").value),
            is_published: $("compPublished").checked
        });
        event.target.reset();
        $("compWin").value = 2;
        $("compLoss").value = 1;
        await refreshAll();
        flash("Compétition créée.");
    } catch (err) {
        flash(dbMessage(err), true);
    }

});


$("matchForm").addEventListener("submit", async event => {

    event.preventDefault();

    const home = $("matchHome").value;
    const away = $("matchAway").value;

    if (home && home === away) {
        flash("Les deux équipes doivent être différentes.", true);
        return;
    }

    try {
        await adminCreateMatch({
            competition_id: $("matchComp").value,
            home_club_id: home,
            away_club_id: away,
            venue_id: $("matchVenue").value || null,
            scheduled_at: $("matchDate").value + ":00Z",
            status: "scheduled"
        });
        event.target.reset();
        await refreshAll();
        flash("Match créé. Saisissez le score une fois le match joué.");
    } catch (err) {
        flash(dbMessage(err), true);
    }

});


/* ---------- Onglets ---------- */

document.querySelectorAll(".admin-tab").forEach(tab => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".admin-tab").forEach(t => t.classList.toggle("active", t === tab));
        document.querySelectorAll(".admin-panel").forEach(panel => {
            panel.hidden = panel.id !== "tab-" + tab.dataset.tab;
        });
    });
});


/* ---------- Démarrage ---------- */

function showGate(title, text) {
    $("gateTitle").textContent = title;
    $("gateText").textContent = text;
    $("gateAdmin").hidden = false;
}

async function init() {

    const user = await currentUser();

    if (!user) {
        showGate("Connexion requise", "Connectez-vous depuis la page d'accueil pour accéder à l'administration.");
        return;
    }

    if (!(await isAdmin())) {
        showGate("Accès refusé", "Ce compte n'a pas les droits d'administration.");
        return;
    }

    $("adminApp").hidden = false;
    $("adminLogout").hidden = false;

    try {
        await refreshAll();
    } catch (err) {
        flash(dbMessage(err), true);
    }

}


$("adminLogout").addEventListener("click", async () => {
    await signOut();
    window.location.href = "index.html";
});

init();
