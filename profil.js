// profil.js : fiche joueur de l'utilisateur connecté

const $ = id => document.getElementById(id);

let me = null;        // utilisateur connecté
let existing = null;  // fiche existante, ou null


function showSection(name) {
    $("gate").hidden = name !== "gate";
    $("recoverySection").hidden = name !== "recovery";
    $("profileSection").hidden = name !== "profile";
    $("logoutBtn").hidden = name !== "profile";
}

function setMsg(el, text, isError = false) {
    el.textContent = text;
    el.className = "msg " + (isError ? "is-error" : "is-ok");
}

function updateAgeNote() {
    const birth = $("pfBirth").value;
    if (!birth) {
        $("ageNote").textContent = "";
        return;
    }
    const age = ageFrom(birth);
    $("ageNote").textContent = age < 18
        ? "Votre fiche est enregistrée. Elle ne sera affichée publiquement qu'à partir de 18 ans."
        : "";
}

function renderStatus() {

    if (!existing) {
        $("statusBox").innerHTML =
            "<p>Vous n'avez pas encore de fiche. Remplissez le formulaire ci-dessous pour la créer.</p>";
        return;
    }

    const validated = existing.is_published;
    const club = existing.clubs ? existing.clubs.name : "Aucun club rattaché";

    $("statusBox").innerHTML = `
        <p>
            <span class="status-pill ${validated ? "ok" : "wait"}">
                ${validated ? "Fiche publiée" : "En attente de validation"}
            </span>
        </p>
        <p class="muted" style="margin-top:10px">
            ${validated
                ? "Votre fiche est visible par les clubs et les visiteurs."
                : "L'administration vérifiera votre fiche avant de la publier."}
        </p>
        <p style="margin-top:10px"><strong>Club :</strong> ${esc(club)}</p>
    `;
}

function fillForm(p) {

    $("pfFirst").value = p.first_name || "";
    $("pfLast").value = p.last_name || "";
    $("pfBirth").value = p.birth_date || "";
    $("pfGender").value = p.gender || "";
    $("pfHeight").value = p.height_cm || "";
    $("pfPosition").value = p.position || "";
    $("pfCity").value = p.city || "";

    // Date de naissance et consentement : fixés à la création
    $("pfBirth").disabled = true;
    $("consentRow").hidden = true;
    $("pfConsent").required = false;
    $("formTitle").textContent = "Mes informations";
    $("saveBtn").textContent = "Enregistrer les modifications";

    updateAgeNote();

}

function resetFormForCreation() {

    $("profileForm").reset();
    $("pfBirth").disabled = false;
    $("consentRow").hidden = false;
    $("pfConsent").required = true;
    $("formTitle").textContent = "Créer ma fiche";
    $("saveBtn").textContent = "Créer ma fiche";
    updateAgeNote();

}


async function loadProfile() {

    existing = await getMyPlayer(me.id);

    if (existing) {
        fillForm(existing);
    } else {
        resetFormForCreation();
    }

    renderStatus();

}


async function start() {

    // Lien « mot de passe oublié » : ouvre directement le formulaire de nouveau mot de passe
    if (window.location.hash.includes("type=recovery")) {
        showSection("recovery");
        return;
    }

    me = await currentUser();

    if (!me) {
        showSection("gate");
        return;
    }

    showSection("profile");
    await loadProfile();

}


$("pfBirth").addEventListener("change", updateAgeNote);


$("profileForm").addEventListener("submit", async event => {

    event.preventDefault();

    const submit = $("saveBtn");
    submit.disabled = true;

    const fields = {
        first_name: $("pfFirst").value.trim(),
        last_name: $("pfLast").value.trim(),
        gender: $("pfGender").value,
        height_cm: $("pfHeight").value ? Number($("pfHeight").value) : null,
        position: $("pfPosition").value || null,
        city: $("pfCity").value.trim() || null
    };

    try {

        if (existing) {

            await updateMyPlayer(existing.id, fields);
            setMsg($("profileMsg"), "Modifications enregistrées.");

        } else {

            if (!$("pfConsent").checked)
                throw new Error("Vous devez accepter la publication de votre nom et prénom.");

            fields.birth_date = $("pfBirth").value;
            await createMyPlayer(me.id, fields);
            setMsg($("profileMsg"), "Fiche créée. Elle sera publiée après validation par l'administration.");

        }

        await loadProfile();

    } catch (err) {

        setMsg($("profileMsg"), "Enregistrement impossible : " + err.message, true);

    } finally {

        submit.disabled = false;

    }

});


$("recoveryForm").addEventListener("submit", async event => {

    event.preventDefault();

    const p1 = $("newPassword").value;
    const p2 = $("newPassword2").value;

    if (p1 !== p2) {
        setMsg($("recoveryMsg"), "Les deux mots de passe ne correspondent pas.", true);
        return;
    }

    try {

        await updatePassword(p1);
        history.replaceState(null, "", window.location.pathname);
        await start();

    } catch (err) {

        setMsg($("recoveryMsg"), "Mot de passe non modifié : " + err.message, true);

    }

});


$("logoutBtn").addEventListener("click", async () => {

    await signOut();
    window.location.href = "index.html";

});


start();
