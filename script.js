/* =========================================
   DONNÉES DE DÉMONSTRATION
========================================= */

const clubs = [

    {
        id: 1,
        name: "ASFB",
        city: "Bobo-Dioulasso",
        players: 32,
        genders: ["hommes", "dames"],
        categories: ["Minime", "Junior", "Espoir", "Senior"]
    },

    {
        id: 2,
        name: "RCB",
        city: "Ouagadougou",
        players: 41,
        genders: ["hommes"],
        categories: ["Junior", "Espoir", "Senior"]
    },

    {
        id: 3,
        name: "Étalons Basket",
        city: "Ouagadougou",
        players: 28,
        genders: ["hommes", "dames"],
        categories: ["Minime", "Senior"]
    },

    {
        id: 4,
        name: "Kadiogo Basket",
        city: "Ouagadougou",
        players: 36,
        genders: ["dames"],
        categories: ["Junior", "Senior"]
    },

    {
        id: 5,
        name: "Bobo Basket Club",
        city: "Bobo-Dioulasso",
        players: 24,
        genders: ["hommes"],
        categories: ["Minime", "Junior"]
    },

    {
        id: 6,
        name: "Koudougou BC",
        city: "Koudougou",
        players: 19,
        genders: ["hommes", "dames"],
        categories: ["Senior"]
    }

];


const players = [

    {
        id: 1,
        firstName: "Ibrahim",
        lastName: "Traoré",
        age: 21,
        city: "Ouagadougou",
        height: "1m87",
        position: "Meneur",
        gender: "Homme"
    },

    {
        id: 2,
        firstName: "Abdoul",
        lastName: "Sawadogo",
        age: 23,
        city: "Bobo-Dioulasso",
        height: "1m92",
        position: "Arrière",
        gender: "Homme"
    },

    {
        id: 3,
        firstName: "Mariam",
        lastName: "Ouédraogo",
        age: 20,
        city: "Ouagadougou",
        height: "1m78",
        position: "Ailier",
        gender: "Femme"
    },

    {
        id: 4,
        firstName: "Issaka",
        lastName: "Kaboré",
        age: 24,
        city: "Koudougou",
        height: "2m01",
        position: "Pivot",
        gender: "Homme"
    },

    {
        id: 5,
        firstName: "Adama",
        lastName: "Compaoré",
        age: 19,
        city: "Ouagadougou",
        height: "1m82",
        position: "Meneur",
        gender: "Homme"
    },

    {
        id: 6,
        firstName: "Awa",
        lastName: "Zongo",
        age: 22,
        city: "Bobo-Dioulasso",
        height: "1m80",
        position: "Ailier",
        gender: "Femme"
    }

];


const matches = [

    {
        home: "ASFB",
        away: "RCB",
        date: "20 SEPT.",
        time: "18:00",
        place: "Palais des Sports"
    },

    {
        home: "Étalons Basket",
        away: "Kadiogo BC",
        date: "22 SEPT.",
        time: "16:00",
        place: "Ouagadougou Arena"
    },

    {
        home: "Bobo Basket Club",
        away: "Koudougou BC",
        date: "24 SEPT.",
        time: "17:30",
        place: "Maison des Jeunes"
    }

];


const standings = [

    {
        position: 1,
        club: "ASFB",
        games: 12,
        wins: 10,
        losses: 2,
        points: 22
    },

    {
        position: 2,
        club: "RCB",
        games: 12,
        wins: 9,
        losses: 3,
        points: 21
    },

    {
        position: 3,
        club: "Étalons Basket",
        games: 12,
        wins: 8,
        losses: 4,
        points: 20
    },

    {
        position: 4,
        club: "Kadiogo BC",
        games: 12,
        wins: 7,
        losses: 5,
        points: 19
    },

    {
        position: 5,
        club: "Bobo Basket Club",
        games: 12,
        wins: 5,
        losses: 7,
        points: 17
    },

    {
        position: 6,
        club: "Koudougou BC",
        games: 12,
        wins: 3,
        losses: 9,
        points: 15
    }

];


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


renderPlayers();


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


renderMatches();


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


renderStandings();


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

document.addEventListener(
    "DOMContentLoaded",
    () => {

        renderClubs();

        renderPlayers();

        renderMatches();

        renderStandings();

        checkCounters();

    }
);