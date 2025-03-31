// ==UserScript==
// @name         D&D Battle Tracker Enhanced
// @version      1.0.2
// @description  D&D Battle Tracker Ehanced - traductions, ajout d'images, basés sur mes DB Google Sheets
// @author       ASI
// @match        https://dndbattletracker.com/*
// @updateURL    https://github.com/diieus/DnDBattleTrackerEnhanced/raw/refs/heads/main/DDBT_Enhanced-main.user.js
// @downloadURL  https://github.com/diieus/DnDBattleTrackerEnhanced/raw/refs/heads/main/DDBT_Enhanced-main.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let monsterData = [];       // { name, ac, hp, initiative, url }
    let selectedMonster = null;

    // --- Fonctions utilitaires ---
    function extractBetweenParentheses(text) {
        const match = text.match(/\(([^)]+)\)/);
        return match ? match[1] : "";
    }
    function removeParentheses(text) {
        return text.replace(/\(.*?\)/g, '').trim();
    }

    // Mapping de traduction (anglais -> français)
    const conditionsMap = {
        "Blinded": "Aveuglé",
        "Charmed": "Charmé",
        "Deafened": "Assourdi",
        "Exhaustion": "Épuisement",
        "Frightened": "Effrayé",
        "Grappled": "Agrippé",
        "Incapacitated": "Incapable d'agir",
        "Invisible": "Invisible",
        "Paralyzed": "Paralysé",
        "Petrified": "Pétrifié",
        "Poisoned": "Empoisonné",
        "Prone": "À terre",
        "Restrained": "Entravé",
        "Stunned": "Étourdi",
        "Unconscious": "Inconscient"
    };
    // Mapping des icônes – taille 32px
    const conditionsImageMap = {
        "Aveuglé": "https://www.aidedd.org/dnd/images-conditions/blinded.png",
        "Charmé": "https://www.aidedd.org/dnd/images-conditions/charmed.png",
        "Assourdi": "https://www.aidedd.org/dnd/images-conditions/deafened.png",
        "Épuisement": "https://www.aidedd.org/dnd/images-conditions/exhaustion.png",
        "Effrayé": "https://www.aidedd.org/dnd/images-conditions/frightened.png",
        "Agrippé": "https://www.aidedd.org/dnd/images-conditions/grappled.png",
        "Incapable d'agir": "https://www.aidedd.org/dnd/images-conditions/incapacitated.png",
        "Invisible": "https://www.aidedd.org/dnd/images-conditions/invisible.png",
        "Paralysé": "https://www.aidedd.org/dnd/images-conditions/paralyzed.png",
        "Pétrifié": "https://www.aidedd.org/dnd/images-conditions/petrified.png",
        "Empoisonné": "https://www.aidedd.org/dnd/images-conditions/poisoned.png",
        "À terre": "https://www.aidedd.org/dnd/images-conditions/prone.png",
        "Entravé": "https://www.aidedd.org/dnd/images-conditions/restrained.png",
        "Étourdi": "https://www.aidedd.org/dnd/images-conditions/stunned.png",
        "Inconscient": "https://www.aidedd.org/dnd/images-conditions/unconscious.png"
    };

    // Mapping des descriptions détaillées pour chaque condition
    const conditionDescriptions = {
        "À terre": `La seule option de mouvement possible pour une créature à terre est de ramper, à moins qu'elle ne se relève et mette alors un terme à son état.
La créature a un désavantage aux jets d'attaque.
Un jet d'attaque contre la créature a un avantage si l'attaquant est à 1,50 mètre ou moins de la créature. Sinon, le jet d'attaque a un désavantage.`,

        "Épuisement": `Certaines capacités spéciales et dangers naturels, comme la famine et les effets d'une exposition prolongée au froid ou à la chaleur, peuvent conduire à un état spécial appelé l'épuisement. L'épuisement se mesure en six niveaux. Un effet peut donner à une créature un ou plusieurs niveaux d'épuisement, comme mentionné dans la description de l'effet.
Niveau - Effet
1 - Désavantage aux jets de caractéristique
2 - Vitesse diminuée de moitié
3 - Désavantage aux jets d'attaque et de sauvegarde
4 - Maximum de points de vie diminué de moitié
5 - Vitesse réduite à 0
6 - Mort

Si une créature déjà épuisée subit un autre effet qui cause l'épuisement, son niveau actuel d'épuisement augmente par le nombre mentionné dans l'effet d'épuisement.
Une créature subit les effets de son niveau d'épuisement plus ceux des niveaux inférieurs. Par exemple, une créature qui souffre d'un épuisement de niveau deux voit sa vitesse diminuée de moitié et a un désavantage aux jets de caractéristique.
Un effet qui supprime l'épuisement réduit son niveau tel que mentionné dans la description de l'effet, et tous les effets reliés à l'épuisement disparaissent si le niveau d'épuisement d'une créature est réduit à moins de 1.
Terminer un repos long réduit le niveau d'épuisement d'une créature de 1, à condition que la créature ait aussi mangé et bu. De même, être rappelé à la vie réduit le niveau d'épuisement d'une créature de 1.`,

        "Agrippé": `La vitesse d'une créature agrippée passe à 0, et elle ne peut bénéficier d'aucun bonus à sa vitesse.
L'état prend fin si la créature qui agrippe est incapable d'agir (voir l'état).
L'état se termine également si un effet met la créature agrippée hors de portée de la créature ou de l'effet qui l'agrippe, comme par exemple lorsqu'une créature est projetée par le sort vague tonnante.`,

        "Assourdi": `Une créature assourdie n'entend pas et rate automatiquement tout jet de caractéristique qui nécessite l’ouïe.`,

        "Aveuglé": `Une créature aveuglée ne voit pas et rate automatiquement tout jet de caractéristique qui nécessite la vue.
Les jets d'attaque contre la créature ont un avantage, et les jets d'attaque de la créature ont un désavantage.`,

        "Charmé": `Une créature charmée ne peut pas attaquer le charmeur ou le cibler avec des capacités ou des effets magiques nuisibles.
Le charmeur a un avantage à ses jets de caractéristique pour interagir socialement avec la créature.`,

        "Effrayé": `Une créature effrayée a un désavantage aux jets de caractéristique et aux jets d'attaque tant que la source de sa peur est dans sa ligne de vue.
La créature ne peut se rapprocher volontairement de la source de sa peur.`,

        "Empoisonné": `Une créature empoisonnée a un désavantage aux jets d'attaque et aux jets de caractéristique.`,

        "Entravé": `La vitesse d'une créature entravée passe à 0, et elle ne peut bénéficier d'aucun bonus à sa vitesse.
Les jets d'attaque contre la créature ont un avantage, et les jets d'attaque de la créature ont un désavantage.
La créature a un désavantage à ses jets de sauvegarde de Dextérité.`,

        "Étourdi": `Une créature étourdie est incapable d'agir (voir l'état), ne peut plus bouger et parle de manière hésitante.
La créature rate automatiquement ses jets de sauvegarde de Force et de Dextérité.
Les jets d'attaque contre la créature ont un avantage.`,

        "Incapable d'agir": `Une créature incapable d'agir ne peut effectuer aucune action ni aucune réaction.`,

        "Inconscient": `Une créature inconsciente est incapable d'agir (voir l'état), ne peut plus bouger ni parler, et n'est plus consciente de ce qui se passe autour d'elle.
La créature lâche ce qu'elle tenait et tombe à terre.
La créature rate automatiquement ses jets de sauvegarde de Force et de Dextérité.
Les jets d'attaque contre la créature ont un avantage.
Toute attaque qui touche la créature est un coup critique si l'attaquant est à 1,50 mètre ou moins de la créature.`,

        "Invisible": `Une créature invisible ne peut être vue sans l'aide de la magie ou un sens particulier. En ce qui concerne le fait de se cacher, la créature est considérée dans une zone à visibilité nulle. L'emplacement de la créature peut être détecté par un bruit qu'elle fait ou par les traces qu'elle laisse.
Les jets d'attaque contre la créature ont un désavantage, et les jets d'attaque de la créature ont un avantage.`,

        "Paralysé": `Une créature paralysée est incapable d'agir (voir l'état) et ne peut plus bouger ni parler.
La créature rate automatiquement ses jets de sauvegarde de Force et de Dextérité.
Les jets d'attaque contre la créature ont un avantage.
Toute attaque qui touche la créature est un coup critique si l'attaquant est à 1,50 mètre ou moins de la créature.`,

        "Pétrifié": `Une créature pétrifiée est transformée, ainsi que tout objet non magique qu'elle porte, en une substance inanimée solide (généralement en pierre). Son poids est multiplié par dix et son vieillissement cesse.
La créature est incapable d'agir (voir l'état), ne peut plus bouger ni parler, et n'est plus consciente de ce qui se passe autour d'elle.
Les jets d'attaque contre la créature ont un avantage.
La créature rate automatiquement ses jets de sauvegarde de Force et de Dextérité.
La créature obtient la résistance contre tous les types de dégâts.
La créature est immunisée contre le poison et la maladie, mais un poison ou une maladie déjà dans son organisme est seulement suspendu, pas neutralisé.`
    };

    // Mapping des résumés des effets (affichés directement dans la note)
    const conditionSummaries = {
        "Aveuglé": `
        <span style="font-weight: bold; text-decoration: line-through;">Vision</span> &#128065;<br>
        &#127919;<span style="color: green; font-weight: bold;">&#8592;Avantage</span><br>
        &#127919;<span style="color: red; font-weight: bold;">&#8594;Désavantage</span>
        `,
        "À terre": "PROUT en V2",
        "Épuisement": "Résumé pour Épuisement…",
        "Agrippé": "Résumé pour Agrippé…",
        "Assourdi": `
        <span style="font-weight: bold; text-decoration: line-through;">Ouïe</span> &#128066;<br>
        `,
        "Effrayé": "Résumé pour Effrayé…",
        "Empoisonné": "Résumé pour Empoisonné…",
        "Entravé": "Résumé pour Entravé…",
        "Étourdi": "Résumé pour Étourdi…",
        "Incapable d'agir": "Résumé pour Incapable d'agir…",
        "Inconscient": "Résumé pour Inconscient…",
        "Invisible": "Résumé pour Invisible…",
        "Paralysé": "Résumé pour Paralysé…",
        "Pétrifié": "Résumé pour Pétrifié…"
    };

    // --- Récupération des données depuis la Google Sheet ---
    function fetchMonsterData() {
        const url = "https://docs.google.com/spreadsheets/d/1ooQv-5Amjq-z-Cb71cODHM_EfurF79Ax7OrUCuSlybY/gviz/tq?tqx=out:json&sheet=MONSTERS_DB";
        fetch(url)
            .then(response => response.text())
            .then(data => {
            const jsonData = data.match(/google\.visualization\.Query\.setResponse\((.*)\)/);
            if (jsonData && jsonData[1]) {
                const obj = JSON.parse(jsonData[1]);
                if (obj.table && obj.table.rows) {
                    monsterData = obj.table.rows.map(row => ({
                        name: row.c[0] && row.c[0].v ? row.c[0].v : "",
                        ac: row.c[4] && row.c[4].v ? row.c[4].v.toString() : "",
                        hp: row.c[5] && row.c[5].v ? row.c[5].v.toString() : "",
                        initiative: row.c[8] && row.c[8].v ? row.c[8].v.toString() : "",
                        url: row.c[16] && row.c[16].v ? row.c[16].v.toString() : ""
                    })).filter(monster => monster.name);
                    console.log("Données des monstres récupérées :", monsterData);
                    updateDndBeyondLinks();
                }
            }
        })
            .catch(err => console.error("Erreur lors de la récupération des données :", err));
    }

    // --- Mise à jour des champs pour React ---
    function updateField(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.focus();
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
            nativeInputValueSetter.call(element, value);
            element.dispatchEvent(new Event('input', { bubbles: true }));
            element.dispatchEvent(new Event('change', { bubbles: true }));
            element.blur();
        }
    }

    // --- Barre de recherche custom ---
    function createSearchElements() {
        if (document.getElementById("monster-search-input")) return;

        const container = document.createElement('div');
        container.style.display = "inline-flex";
        container.style.alignItems = "center";
        container.style.position = "relative";
        container.style.marginTop = "8px";

        const searchInput = document.createElement('input');
        searchInput.type = "text";
        searchInput.placeholder = "Rechercher...";
        searchInput.id = "monster-search-input";

        const plusButton = document.createElement('button');
        plusButton.textContent = "+";
        plusButton.title = "Copier les données du monstre sélectionné";
        plusButton.type = "button";
        plusButton.style.marginLeft = "0";

        const suggestionContainer = document.createElement('div');
        suggestionContainer.id = "monster-suggestions";
        suggestionContainer.style.border = "1px solid #ccc";
        suggestionContainer.style.backgroundColor = "#fff";
        suggestionContainer.style.zIndex = "1000";
        suggestionContainer.style.maxHeight = "200px";
        suggestionContainer.style.overflowY = "auto";
        suggestionContainer.style.display = "none";

        container.appendChild(searchInput);
        container.appendChild(plusButton);
        container.appendChild(suggestionContainer);

        function updateSuggestionPosition() {
            suggestionContainer.style.position = "absolute";
            suggestionContainer.style.top = (searchInput.offsetHeight + 2) + "px";
            suggestionContainer.style.left = "0";
            suggestionContainer.style.width = "100%";
            suggestionContainer.style.boxSizing = "border-box";
        }
        updateSuggestionPosition();

        searchInput.addEventListener('input', function() {
            updateSuggestionPosition();
            const query = searchInput.value.trim().toLowerCase();
            suggestionContainer.innerHTML = "";
            selectedMonster = null;
            if (query === "") {
                suggestionContainer.style.display = "none";
                return;
            }
            const filtered = monsterData.filter(monster => monster.name.toLowerCase().includes(query));
            if (filtered.length === 0) {
                suggestionContainer.style.display = "none";
                return;
            }
            filtered.forEach(monster => {
                const div = document.createElement('div');
                div.textContent = monster.name;
                div.style.padding = "5px";
                div.style.cursor = "pointer";
                div.addEventListener('click', function() {
                    searchInput.value = monster.name;
                    selectedMonster = monster;
                    suggestionContainer.style.display = "none";
                });
                suggestionContainer.appendChild(div);
            });
            suggestionContainer.style.display = "block";
        });

        document.addEventListener('click', function(event) {
            if (!container.contains(event.target)) {
                suggestionContainer.style.display = "none";
            }
        });

        plusButton.addEventListener('click', function(e) {
            e.preventDefault();
            let monster = selectedMonster;
            if (!monster) {
                const inputValue = searchInput.value.trim().toLowerCase();
                monster = monsterData.find(m => m.name.toLowerCase() === inputValue);
            }
            if (!monster) {
                alert("Monstre non trouvé. Veuillez sélectionner un monstre valide.");
                return;
            }
            updateField("combobox-create-creature-form-name", monster.name);
            let initValue = extractBetweenParentheses(monster.initiative);
            updateField("create-creature-form-initiative", "1d20" + initValue);
            updateField("combobox-create-creature-form-hp", removeParentheses(monster.hp));
            if (monster.ac) {
                const numbers = monster.ac.match(/\d+/g);
                if (numbers && numbers.length === 1) {
                    updateField("create-creature-form-ac", removeParentheses(monster.ac));
                } else {
                    console.log("Plusieurs valeurs pour la Classe d'armure détectées pour", monster.name, ". Champ AC non modifié.");
                }
            }
        });

        const originalInput = document.getElementById("combobox-create-creature-form-name");
        if (originalInput) {
            const originalWrapper = originalInput.parentNode;
            originalWrapper.parentNode.insertBefore(container, originalWrapper.nextSibling);
        }
    }

    // --- Mise à jour des liens D&D Beyond ---
    function updateDndBeyondLinks() {
        const links = document.querySelectorAll('.creature-toolbar-wrapper.creature-toolbar-wrapper__focused a[title="D&D Beyond Monster Search"]');
        links.forEach(link => {
            let aria = link.getAttribute('aria-label') || "";
            let regex = /^Search\s+(.+)\s+on D&D Beyond$/;
            let match = aria.match(regex);
            if (match && match[1]) {
                let creatureName = match[1].trim();
                let monster = monsterData.find(m => m.name.toLowerCase() === creatureName.toLowerCase());
                if (monster && monster.url) {
                    link.href = monster.url;
                }
            }
        });
    }

    // --- Mise à jour des conditions dans les checkbox (ul.conditions) ---
    function updateConditions() {
        const conditionItems = document.querySelectorAll('ul.conditions li.condition div[role="checkbox"]');
        conditionItems.forEach(item => {
            if (item.querySelector("img")) return; // déjà traité
            const originalText = item.innerText.trim();
            if (conditionsMap[originalText]) {
                const translated = conditionsMap[originalText];
                item.innerHTML = "";
                if (conditionsImageMap[translated]) {
                    const img = document.createElement('img');
                    img.src = conditionsImageMap[translated];
                    img.style.width = "32px";
                    img.style.height = "32px";
                    img.style.verticalAlign = "middle";
                    img.style.marginRight = "4px";
                    item.appendChild(img);
                }
                item.appendChild(document.createTextNode(translated));
            }
        });
    }

    // --- Mise à jour des conditions dans les notes ---
    function updateNoteConditions() {
        const noteItems = document.querySelectorAll('.creature--columns.creature--columns__wide .creature-note-list--item');
        noteItems.forEach(item => {
            // Cible le tag <b> qui contient la condition
            let boldElem = item.querySelector("b");
            if (boldElem) {
                let aElem = boldElem.querySelector("a");
                if (aElem) {
                    // Désactive le lien en retirant l'attribut href
                    aElem.removeAttribute("href");
                    let conditionText = aElem.textContent.trim();
                    console.log("Note condition text:", conditionText);
                    if (conditionsMap[conditionText]) {
                        const translated = conditionsMap[conditionText];
                        aElem.innerHTML = "";
                        if (conditionsImageMap[translated]) {
                            const img = document.createElement('img');
                            img.src = conditionsImageMap[translated];
                            img.style.width = "32px";
                            img.style.height = "32px";
                            img.style.verticalAlign = "middle";
                            img.style.marginRight = "4px";
                            aElem.appendChild(img);
                        }
                        aElem.appendChild(document.createTextNode(translated));

                        // Configure le tooltip avec la description détaillée
                        let tooltipHTML = "<strong>" + translated + "</strong>";
                        if (conditionDescriptions[translated]) {
                            tooltipHTML += "<br>" + conditionDescriptions[translated];
                        }

                        if (aElem._tooltip) {
                            aElem._tooltip.remove();
                        }
                        let tooltip = document.createElement('div');
                        tooltip.className = "custom-tooltip";
                        tooltip.innerHTML = tooltipHTML;
                        tooltip.style.position = "absolute";
                        tooltip.style.background = "#fff";
                        tooltip.style.border = "1px solid #000";
                        tooltip.style.padding = "4px";
                        tooltip.style.zIndex = "2000";
                        tooltip.style.whiteSpace = "pre-wrap";
                        tooltip.style.display = "none";
                        document.body.appendChild(tooltip);
                        aElem._tooltip = tooltip;

                        aElem.addEventListener('mouseenter', function(e) {
                            const rect = aElem.getBoundingClientRect();
                            tooltip.style.top = (rect.bottom + window.scrollY) + "px";
                            tooltip.style.left = (rect.left + window.scrollX) + "px";
                            tooltip.style.display = "block";
                        });
                        aElem.addEventListener('mouseleave', function(e) {
                            tooltip.style.display = "none";
                        });

                        // Insérer le résumé des effets après le timer
                        let timerElem = item.querySelector(".creature-note-list--timer");
                        if (timerElem) {
                            // Crée un saut de ligne et le résumé
                            let br = document.createElement("br");
                            // Insère le <br> après le timer
                            if (timerElem.nextSibling) {
                                timerElem.parentNode.insertBefore(br, timerElem.nextSibling);
                            } else {
                                timerElem.parentNode.appendChild(br);
                            }
                            let summaryElem = document.createElement("div");
                            summaryElem.className = "condition-summary";
                            summaryElem.innerHTML = conditionSummaries[translated] || "";
                            // Insère le résumé après le <br>
                            if (br.nextSibling) {
                                br.parentNode.insertBefore(summaryElem, br.nextSibling);
                            } else {
                                br.parentNode.appendChild(summaryElem);
                            }
                        } else {
                            // Sinon, insère simplement le résumé à la fin de l'élément note avec un saut de ligne au début
                            let br = document.createElement("br");
                            item.appendChild(br);
                            let summaryElem = document.createElement("div");
                            summaryElem.className = "condition-summary";
                            summaryElem.innerHTML = conditionSummaries[translated] || "";
                            item.appendChild(summaryElem);
                        }


                    }
                }
            }
        });
    }

    // --- Observers et mises à jour périodiques ---
    function observeForSearchBar() {
        const target = document.body;
        const config = { childList: true, subtree: true };
        const callback = function(mutationsList) {
            if (document.getElementById("combobox-create-creature-form-name") &&
                !document.getElementById("monster-search-input")) {
                createSearchElements();
            }
        };
        const observer = new MutationObserver(callback);
        observer.observe(target, config);
    }

    const linkObserver = new MutationObserver(() => {
        updateDndBeyondLinks();
    });
    linkObserver.observe(document.body, { childList: true, subtree: true });

    setInterval(updateDndBeyondLinks, 1000);
    setInterval(updateConditions, 1000);
    setInterval(updateNoteConditions, 1000);

    window.addEventListener('load', function() {
        createSearchElements();
        fetchMonsterData();
        observeForSearchBar();
        updateConditions();
        updateNoteConditions();
    });
})();

