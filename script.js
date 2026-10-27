/* =========================================
   DONNÉES (chargées depuis Supabase)
========================================= */

let clubs = [];
let players = [];
let matches = [];
let standings = [];


/* =========================================
   AFFICHER LES CLUBS
========================================= */

const clubsContainer =
    document.getElementById("clubsContainer");


function renderClubs(data = clubs) {

    clubsContainer.innerHTML = "";

    if (data.length === 0) {

        clubsContainer.innerHTML = `
            <div style="
                grid-column:1/-1;
                padding:40px;
                text-align:center;
                color:#98a2b3;
            ">
                Aucun club trouvé.
            </div>
        `;

        return;
    }


    data.forEach(club => {

        const categories = club.categories
            .map(category =>
                `<span class="tag">${category}</span>`
            )
            .join("");


        const card = document.createElement("article");

        card.className = "club-card reveal";

        card.innerHTML = `

            <div class="club-top">

                <div class="club-logo">
                    ${club.name.substring(0,4).toUpperCase()}
                </div>

                <div>

                    <div class="club-name">
                        ${club.name}
                    </div>

                    <div class="club-city">
                        <i class="fa-solid fa-location-dot"></i>
                        ${club.city}
                    </div>

                </div>

            </div>


            <div class="club-info">

                ${categories}

                ${
                    club.genders.includes("hommes")
                    ?
                    `<span class="tag">
                        <i class="fa-solid fa-mars"></i>
                        Hommes
                    </span>`
                    :
                    ""
                }

                ${
                    club.genders.includes("dames")
                    ?
                    `<span class="tag">
                        <i class="fa-solid fa-venus"></i>
                        Dames
                    </span>`
                    :
                    ""
                }

            </div>


            <div class="club-footer">

                <span class="club-players">

                    <i class="fa-solid fa-users"></i>

                    ${club.players} joueurs

                </span>


                <a href="#" class="club-link">

                    Voir le club

                    <i class="fa-solid fa-arrow-right"></i>

                </a>

            </div>

        `;


        clubsContainer.appendChild(card);

    });


    observeReveals();

}


/* =========================================
   RECHERCHE CLUBS
========================================= */

const clubSearch =
    document.getElementById("clubSearch");

const cityFilter =
    document.getElementById("cityFilter");

const genderFilter =
    document.getElementById("genderFilter");


function filterClubs() {

    const search =
        clubSearch.value.toLowerCase().trim();

    const city =
        cityFilter.value;

    const gender =
        genderFilter.value;


    const filtered = clubs.filter(club => {

        const matchesSearch =
            club.name.toLowerCase().includes(search);


        const matchesCity =
            city === "" ||
            club.city === city;


        const matchesGender =
            gender === "" ||
            club.genders.includes(gender);


        return (
            matchesSearch &&
            matchesCity &&
            matchesGender
        );

    });


    renderClubs(filtered);

}


clubSearch.addEventListener(
    "input",
    filterClubs
);

cityFilter.addEventListener(
    "change",
    filterClubs
);

genderFilter.addEventListener(
    "change",
    filterClubs
);


/* =========================================
   JOUEURS
========================================= */

const playersContainer =
    document.getElementById("playersContainer");


function renderPlayers(data = players) {

    playersContainer.innerHTML = "";


    data.forEach(player => {

        const card =
            document.createElement("article");

        card.className =
            "player-card reveal";


        card.innerHTML = `

            <div class="player-image">

                <span class="available">
                    DISPONIBLE
                </span>

                <i class="fa-solid fa-user"></i>

            </div>


            <div class="player-content">

                <div class="player-name">

                    ${player.firstName}
                    ${player.lastName}

                </div>


                <div class="player-details">

                    ${player.age} ans
                    • ${player.city}

                </div>


                <div class="player-tags">

                    <span>
                        ${player.position}
                    </span>

                    <span>
                        ${player.height}
                    </span>

                    <span>
                        ${player.gender}
                    </span>

                </div>

            </div>

        `;


        playersContainer.appendChild(card);

    });


    observeReveals();

}




/* =========================================
   FILTRE JOUEURS PAR POSTE
========================================= */

const filterButtons =
    document.querySelectorAll(".filter-btn");


filterButtons.forEach(button => {

    button.addEventListener("click", () => {

        filterButtons.forEach(btn =>
            btn.classList.remove("active")
        );

        button.classList.add("active");


        const position =
            button.dataset.position;


        if (position === "all") {

            renderPlayers(players);

        } else {

            renderPlayers(
                players.filter(
                    player =>
                        player.position === position
                )
            );

        }

    });

});


/* =========================================
   MATCHS
========================================= */

const matchesContainer =
    document.getElementById("matchesContainer");


function renderMatches() {

    matchesContainer.innerHTML = "";


    matches.forEach(match => {

        const card =
            document.createElement("article");

        card.className =
            "match-card reveal";


        card.innerHTML = `

            <div class="match-header">

                <span>
                    ${match.date}
                </span>

                <span class="match-status">
                    À VENIR
                </span>

            </div>


            <div class="match-teams">

                <div class="match-team">

                    <div class="match-team-logo">
                        ${match.home.substring(0,4)}
                    </div>

                    <strong>
                        ${match.home}
                    </strong>

                </div>


                <span class="vs">
                    VS
                </span>


                <div class="match-team">

                    <div class="match-team-logo">
                        ${match.away.substring(0,4)}
                    </div>

                    <strong>
                        ${match.away}
                    </strong>

                </div>

            </div>


            <div class="match-time">

                <i class="fa-regular fa-clock"></i>

                ${match.time}

                <br>

                <small>
                    ${match.place}
                </small>

            </div>

        `;


        matchesContainer.appendChild(card);

    });


    observeReveals();

}




/* =========================================
   CLASSEMENT
========================================= */

const standingsContainer =
    document.getElementById("standingsContainer");


function renderStandings() {

    standingsContainer.innerHTML = "";


    standings.forEach(row => {

        const tr =
            document.createElement("tr");


        tr.innerHTML = `

            <td>
                <span class="position">
                    ${row.position}
                </span>
            </td>


            <td>

                <div class="table-club">

                    <div class="small-logo">
                        ${row.club.substring(0,4)}
                    </div>

                    ${row.club}

                </div>

            </td>


            <td>${row.games}</td>

            <td>${row.wins}</td>

            <td>${row.losses}</td>

            <td>
                <strong>
                    ${row.points}
                </strong>
            </td>

        `;


        standingsContainer.appendChild(tr);

    });

}




/* =========================================
   MENU MOBILE
========================================= */

const menuButton =
    document.getElementById("menuButton");

const navbar =
    document.getElementById("navbar");


menuButton.addEventListener("click", () => {

    navbar.classList.toggle("open");


    const icon =
        menuButton.querySelector("i");


    if (navbar.classList.contains("open")) {

        icon.className =
            "fa-solid fa-xmark";

    } else {

        icon.className =
            "fa-solid fa-bars";

    }

});


document.querySelectorAll(".nav-link")
    .forEach(link => {

        link.addEventListener("click", () => {

            navbar.classList.remove("open");

            menuButton.querySelector("i").className =
                "fa-solid fa-bars";

        });

    });


/* =========================================
   SEARCH OVERLAY
========================================= */

const openSearch =
    document.getElementById("openSearch");

const closeSearch =
    document.getElementById("closeSearch");

const searchOverlay =
    document.getElementById("searchOverlay");

const globalSearch =
    document.getElementById("globalSearch");

const searchResults =
    document.getElementById("searchResults");


openSearch.addEventListener("click", () => {

    searchOverlay.classList.add("open");

    setTimeout(() => {

        globalSearch.focus();

    },300);

});


closeSearch.addEventListener("click", () => {

    searchOverlay.classList.remove("open");

});


globalSearch.addEventListener("input", () => {

    const query =
        globalSearch.value.toLowerCase().trim();


    if (!query) {

        searchResults.innerHTML =
            "<p>Commencez votre recherche...</p>";

        return;

    }


    const clubResults =
        clubs.filter(club =>
            club.name.toLowerCase()
                .includes(query) ||
            club.city.toLowerCase()
                .includes(query)
        );


    const playerResults =
        players.filter(player =>
            `${player.firstName} ${player.lastName}`
                .toLowerCase()
                .includes(query)
        );


    searchResults.innerHTML = "";


    if (
        clubResults.length === 0 &&
        playerResults.length === 0
    ) {

        searchResults.innerHTML =
            "<p>Aucun résultat.</p>";

        return;

    }


    clubResults.forEach(club => {

        const item =
            document.createElement("div");

        item.style.padding = "15px 0";

        item.innerHTML = `

            <strong>
                <i class="fa-solid fa-building"></i>
                ${club.name}
            </strong>

            <small style="display:block;color:#98a2b3">
                Club • ${club.city}
            </small>

        `;

        searchResults.appendChild(item);

    });


    playerResults.forEach(player => {

        const item =
            document.createElement("div");

        item.style.padding = "15px 0";

        item.innerHTML = `

            <strong>
                <i class="fa-solid fa-user"></i>
                ${player.firstName}
                ${player.lastName}
            </strong>

            <small style="display:block;color:#98a2b3">
                Joueur • ${player.position}
            </small>

        `;

        searchResults.appendChild(item);

    });

});


/* =========================================
   COMPTEURS
========================================= */

const counters =
    document.querySelectorAll(".counter");


function animateCounter(counter) {

    const target =
        Number(counter.dataset.target);

    let current = 0;

    const duration = 1500;

    const start =
        performance.now();


    function update(time) {

        const progress =
            Math.min(
                (time - start) / duration,
                1
            );


        current =
            Math.floor(
                progress * target
            );


        counter.textContent =
            current;


        if (progress < 1) {

            requestAnimationFrame(update);

        } else {

            counter.textContent =
                target;

        }

    }


    requestAnimationFrame(update);

}


let countersStarted = false;


function checkCounters() {

    const section =
        document.querySelector(".stats-section");


    const rect =
        section.getBoundingClientRect();


    if (
        !countersStarted &&
        rect.top < window.innerHeight &&
        rect.bottom > 0
    ) {

        countersStarted = true;

        counters.forEach(
            animateCounter
        );

    }

}


/* =========================================
   SCROLL REVEAL
========================================= */

function observeReveals() {

    const elements =
        document.querySelectorAll(".reveal");


    elements.forEach(element => {

        if (element.dataset.observed)
            return;


        element.dataset.observed = "true";


        const observer =
            new IntersectionObserver(
                entries => {

                    entries.forEach(entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            entry.target
                                .classList
                                .add("visible");

                            observer.unobserve(
                                entry.target
                            );

                        }

                    });

                },
                {
                    threshold: .12
                }
            );


        observer.observe(element);

    });

}


observeReveals();


window.addEventListener(
    "scroll",
    checkCounters
);


/* =========================================
   ACTIVE NAVIGATION
========================================= */

const sections =
    document.querySelectorAll("section[id]");

const navLinks =
    document.querySelectorAll(".nav-link");


function updateActiveNav() {

    let current = "";


    sections.forEach(section => {

        const sectionTop =
            section.offsetTop - 150;


        if (
            window.scrollY >= sectionTop
        ) {

            current =
                section.getAttribute("id");

        }

    });


    navLinks.forEach(link => {

        link.classList.remove("active");


        if (
            link.getAttribute("href") ===
            `#${current}`
        ) {

            link.classList.add("active");

        }

    });

}


window.addEventListener(
    "scroll",
    updateActiveNav
);


/* =========================================
   FERMETURE SEARCH AVEC ESC
========================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {

            searchOverlay
                .classList
                .remove("open");

        }

    }
);


/* =========================================
   LOADER
========================================= */

window.addEventListener(
    "load",
    () => {

        const loader =
            document.getElementById("loader");


        setTimeout(() => {

            loader.classList.add("hidden");

        },700);

    }
);


/* =========================================
   INITIALISATION
========================================= */

function emptyMessage(text) {
    return `<div style="grid-column:1/-1;padding:40px;text-align:center;color:#98a2b3;">${text}</div>`;
}


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            const data = await loadBasketData();

            clubs = data.clubs;
            players = data.players;
            matches = data.matches;
            standings = data.standings;

            cityFilter.innerHTML =
                '<option value="">Toutes les villes</option>' +
                data.cities.map(c => `<option value="${c}">${c}</option>`).join("");

            document.getElementById("standingsYear").textContent =
                data.season ?? "";

            document.querySelectorAll(".counter").forEach(el => {
                el.dataset.target = data.counts[el.dataset.stat] ?? 0;
            });

            countersStarted = false;

        } catch (err) {

            console.error("Chargement des données impossible :", err);

        }

        renderClubs();
        renderPlayers();
        renderMatches();
        renderStandings();

        if (!players.length)
            playersContainer.innerHTML = emptyMessage("Aucun joueur publié pour le moment.");

        if (!matches.length)
            matchesContainer.innerHTML = emptyMessage("Aucun match à venir pour le moment.");

        if (!standings.length)
            standingsContainer.innerHTML =
                '<tr><td colspan="6" style="text-align:center;color:#98a2b3;padding:30px;">Le classement apparaîtra après les premiers matchs terminés.</td></tr>';

        checkCounters();

    }
);


/* =========================================
   CONNEXION
========================================= */

const loginButton = document.getElementById("loginButton");
const footerLogin = document.getElementById("footerLogin");
const authModal = document.getElementById("authModal");
const closeAuth = document.getElementById("closeAuth");
const authError = document.getElementById("authError");
const authInfo = document.getElementById("authInfo");
const sessionEmail = document.getElementById("sessionEmail");
const adminLink = document.getElementById("adminLink");
const logoutButton = document.getElementById("logoutButton");
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const forgotForm = document.getElementById("forgotForm");

const authViews = {
    login: document.getElementById("viewLogin"),
    signup: document.getElementById("viewSignup"),
    forgot: document.getElementById("viewForgot"),
    session: document.getElementById("viewSession")
};


function messageAuth(err) {

    const t = (err && err.message) || "";

    if (t.includes("Invalid login credentials"))
        return "Email ou mot de passe incorrect.";
    if (t.includes("Email not confirmed"))
        return "Email non confirmé : ouvrez le lien reçu par email.";
    if (t.includes("User already registered"))
        return "Un compte existe déjà avec cet email.";
    if (t.includes("Password should be at least"))
        return "Le mot de passe doit contenir au moins 8 caractères.";
    if (t.toLowerCase().includes("rate limit"))
        return "Trop de tentatives. Patientez quelques minutes.";

    return "Erreur : " + t;

}


function showAuthView(name) {

    Object.entries(authViews).forEach(([key, el]) => {
        el.hidden = key !== name;
    });

    authError.textContent = "";
    authInfo.textContent = "";

}


async function openAuth() {

    authModal.hidden = false;

    const user = await currentUser();

    if (user) {

        sessionEmail.textContent = user.email;
        adminLink.hidden = !(await isAdmin());
        showAuthView("session");

    } else {

        showAuthView("login");

    }

}


function setBusy(form, busy) {
    form.querySelector("button[type='submit']").disabled = busy;
}


loginButton.addEventListener("click", openAuth);

footerLogin.addEventListener("click", event => {
    event.preventDefault();
    openAuth();
});

closeAuth.addEventListener("click", () => {
    authModal.hidden = true;
});

authModal.addEventListener("click", event => {
    if (event.target === authModal) authModal.hidden = true;
});

document.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => showAuthView(btn.dataset.view));
});


loginForm.addEventListener("submit", async event => {

    event.preventDefault();
    setBusy(loginForm, true);
    authError.textContent = "";

    try {

        await signIn(
            document.getElementById("loginEmail").value.trim(),
            document.getElementById("loginPassword").value
        );
        loginForm.reset();
        await openAuth();

    } catch (err) {

        authError.textContent = messageAuth(err);

    } finally {

        setBusy(loginForm, false);

    }

});


signupForm.addEventListener("submit", async event => {

    event.preventDefault();
    setBusy(signupForm, true);
    authError.textContent = "";
    authInfo.textContent = "";

    try {

        const session = await signUp(
            document.getElementById("signupEmail").value.trim(),
            document.getElementById("signupPassword").value
        );

        if (session) {
            window.location.href = "profil.html";
            return;
        }

        signupForm.reset();
        authInfo.textContent =
            "Compte créé. Ouvrez le lien de confirmation reçu par email, puis connectez-vous.";

    } catch (err) {

        authError.textContent = messageAuth(err);

    } finally {

        setBusy(signupForm, false);

    }

});


forgotForm.addEventListener("submit", async event => {

    event.preventDefault();
    setBusy(forgotForm, true);
    authError.textContent = "";
    authInfo.textContent = "";

    try {

        await sendPasswordReset(document.getElementById("forgotEmail").value.trim());
        forgotForm.reset();
        authInfo.textContent =
            "Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé.";

    } catch (err) {

        authError.textContent = messageAuth(err);

    } finally {

        setBusy(forgotForm, false);

    }

});


logoutButton.addEventListener("click", async () => {

    try {
        await signOut();
    } catch (err) {
        authError.textContent = messageAuth(err);
        return;
    }

    showAuthView("login");

});
