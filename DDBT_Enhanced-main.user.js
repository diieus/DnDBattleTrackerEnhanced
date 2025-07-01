// ==UserScript==
// @name         D&D Battle Tracker Enhanced
// @version      1.3.0
// @description  D&D Battle Tracker Ehanced - traductions, ajout d'images, basés sur mes DB Google Sheets
// @author       ASI
// @match        https://dndbattletracker.com/*
// @updateURL    https://github.com/diieus/DnDBattleTrackerEnhanced/raw/refs/heads/main/DDBT_Enhanced-main.user.js
// @downloadURL  https://github.com/diieus/DnDBattleTrackerEnhanced/raw/refs/heads/main/DDBT_Enhanced-main.user.js
// @grant        none
// ==/UserScript==



(function() {
	'use strict';

	let monsterData = []; // { name, ac, hp, initiative, url }
	let selectedMonster = null;

	let friends_favorites = ['Ashrynn', 'Galel', 'Gani', 'Ahizak', 'Oloquial', 'Salim', 'Charles-Henri', 'Tran'];

	// --- Fonctions utilitaires ---
	function extractBetweenParentheses(text) {
		const match = text.match(/\(([^)]+)\)/);
		return match ? match[1] : "";
	}

	function extractFirstNumber(text) {
		const match = text.match(/\d+/);
		return match ? match[0] : "";
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
		"Invisible": "Invisible\u200B", // Ajout du Zéro-width Space
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
		"Invisible\u200B": "https://www.aidedd.org/dnd/images-conditions/invisible.png",
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

		"Épuisement": `Une créature épuisée subit un malus à tous ses d20 de -2 par niveau d'épuisement. De plus, sa vitese est diminuée de 1,50m par niveau d'épuisement.
Certaines capacités spéciales et dangers naturels, comme la famine et les effets d'une exposition prolongée au froid ou à la chaleur, peuvent conduire à un état spécial appelé l'épuisement. L'épuisement se mesure en six niveaux. Un effet peut donner à une créature un ou plusieurs niveaux d'épuisement, comme mentionné dans la description de l'effet.
Si une créature déjà épuisée subit un autre effet qui cause l'épuisement, son niveau actuel d'épuisement augmente par le nombre mentionné dans l'effet d'épuisement.
Un effet qui supprime l'épuisement réduit son niveau tel que mentionné dans la description de l'effet.
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

		"Invisible\u200B": `Une créature invisible ne peut être vue sans l'aide de la magie ou un sens particulier. En ce qui concerne le fait de se cacher, la créature est considérée dans une zone à visibilité nulle. L'emplacement de la créature peut être détecté par un bruit qu'elle fait ou par les traces qu'elle laisse.
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
        <span style="display: inline-block; width: 30px;"></span><span style="font-weight: bold; text-decoration: line-through;">Vision</span> &#128065;<br>
        <span style="display: inline-block; width: 30px;"></span>&#127919;<span style="color: green; font-weight: bold;">&#8592;Avantage</span><br>
        <span style="display: inline-block; width: 30px;"></span>&#127919;<span style="color: red; font-weight: bold;">&#8594;Désavantage</span>
        `,
		"À terre": `
        <span style="display: inline-block; width: 30px;"></span>&#127919;<span style="color: green; font-weight: bold;">&#8592;Avantage (CaC)</span><br>
		<span style="display: inline-block; width: 30px;"></span>&#127919;<span style="color: red; font-weight: bold;">&#8592;Désavantage (Dist)</span><br>
        <span style="display: inline-block; width: 30px;"></span>&#127919;<span style="color: red; font-weight: bold;">&#8594;Désavantage</span>
        `,
		"Épuisement": `
        <span style="display: inline-block; width: 30px;"></span>&#127922;<span style="color: red; font-weight: bold;"> -2 aux d20 / niveau d'épuisement</span><br>
	<span style="display: inline-block; width: 30px;"></span>&#127939;<span style="color: red; font-weight: bold;"> -1,50m / niveau d"épuisement</span>
        `,
		"Agrippé": `
        <span style="display: inline-block; width: 30px;"></span><span style="font-weight: bold; text-decoration: line-through;">Vitesse</span> &#127939;
        `,
		"Assourdi": `
        <span style="display: inline-block; width: 30px;"></span><span style="font-weight: bold; text-decoration: line-through;">Ouïe</span> &#128066;
        `,
		"Effrayé": `
        <span style="display: inline-block; width: 30px;"></span>&#127919;<span style="color: red; font-weight: bold;">&#8594;Désavantage</span>
        `,
		"Empoisonné": `
        <span style="display: inline-block; width: 30px;"></span>&#127919;<span style="color: red; font-weight: bold;">&#8594;Désavantage</span>
        `,
		"Entravé": `
        <span style="display: inline-block; width: 30px;"></span><span style="font-weight: bold; text-decoration: line-through;">Vitesse</span> &#127939;<br>
        <span style="display: inline-block; width: 30px;"></span>&#127919;<span style="color: green; font-weight: bold;">&#8592;Avantage</span><br>
        <span style="display: inline-block; width: 30px;"></span>&#127919;<span style="color: red; font-weight: bold;">&#8594;Désavantage</span>
        `,
		"Étourdi": `
        <span style="display: inline-block; width: 30px;"></span><span style="font-weight: bold;">Ne fait rien</span> &#128683;<br>
        <span style="display: inline-block; width: 30px;"></span>&#127919;<span style="color: green; font-weight: bold;">&#8592;Avantage</span>
        `,
		"Incapable d'agir": `
        <span style="display: inline-block; width: 30px;"></span><span style="font-weight: bold;">Ne fait rien</span> &#128683;
        `,
		"Inconscient": `
        <span style="display: inline-block; width: 30px;"></span><span style="font-weight: bold;">Ne fait rien</span> &#128683;<br>
        <span style="display: inline-block; width: 30px;"></span>&#127919;<span style="color: green; font-weight: bold;">&#8592;Avantage</span>
        `,
		"Invisible\u200B": `
        <span style="display: inline-block; width: 30px;"></span>&#127919;<span style="color: red; font-weight: bold;">&#8592;Désavantage</span><br>
        <span style="display: inline-block; width: 30px;"></span>&#127919;<span style="color: green; font-weight: bold;">&#8594;Avantage</span>
        `,
		"Paralysé": `
        <span style="display: inline-block; width: 30px;"></span><span style="font-weight: bold;">Ne fait rien</span> &#128683;<br>
        <span style="display: inline-block; width: 30px;"></span>&#127919;<span style="color: green; font-weight: bold;">&#8592;Avantage</span>
        `,
		"Pétrifié": `
        <span style="display: inline-block; width: 30px;"></span><span style="font-weight: bold;">Ne fait rien</span> &#128683;<br>
		<span style="display: inline-block; width: 30px;"></span><span style="font-weight: bold;">Immunisé</span> &#128737;<br>
        <span style="display: inline-block; width: 30px;"></span>&#127919;<span style="color: green; font-weight: bold;">&#8592;Avantage</span>
        `
	};

	// --- Récupération des données depuis la Google Sheet ---
	function fetchMonsterData() {
		const sheets = [{
				name: "2024_MONSTERS_DB",
				priority: 1
			},
			{
				name: "MONSTERS_DB",
				priority: 2
			},
			{
				name: "FOES_DB",
				priority: 3
			},
			{
				name: "FRIENDS_DB",
				priority: 4
			}
		];

		const baseUrl = "https://docs.google.com/spreadsheets/d/1ooQv-5Amjq-z-Cb71cODHM_EfurF79Ax7OrUCuSlybY/gviz/tq?tqx=out:json&sheet=";
		const mergedData = new Map();

		Promise.all(
			sheets.map(sheet =>
				fetch(baseUrl + sheet.name)
				.then(response => response.text())
				.then(data => {
					const jsonData = data.match(/google\.visualization\.Query\.setResponse\((.*)\)/);
					if (jsonData && jsonData[1]) {
						const obj = JSON.parse(jsonData[1]);
						if (obj.table && obj.table.rows) {
							obj.table.rows.forEach(row => {
								const name = row.c[0] && row.c[0].v ? row.c[0].v : "";
								if (!name) return;

								const entry = {
									name: row.c[0] && row.c[0].v ? row.c[0].v : "",
									ac: row.c[4] && row.c[4].v ? row.c[4].v.toString() : "",
									hp: row.c[5] && row.c[5].v ? row.c[5].v.toString() : "",
									initiative: row.c[8] && row.c[8].v ? row.c[8].v.toString() : "",
									url: row.c[16] && row.c[16].v ? row.c[16].v.toString() : "",
									picture: row.c[17] && row.c[17].v ? row.c[17].v.toString() : "",
									source: sheet.name
								};

								const existing = mergedData.get(name);
								if (!existing || existing.priority < sheet.priority) {
									mergedData.set(name, {
										...entry,
										priority: sheet.priority
									});
								}
							});
						}
					}
				})
				.catch(err => console.error(`Erreur lors de la récupération des données depuis ${sheet.name} :`, err))
			)
		).then(() => {
			monsterData = Array.from(mergedData.values()).map(({
				priority,
				...data
			}) => data);
			console.log("Données des monstres récupérées :", monsterData);
			updateDndBeyondLinks();
		});
	}


	// --- Mise à jour des champs pour React ---
	function updateField(id, value) {
		const element = document.getElementById(id);
		if (element) {
			element.focus();
			const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
			nativeInputValueSetter.call(element, value);
			element.dispatchEvent(new Event('input', {
				bubbles: true
			}));
			element.dispatchEvent(new Event('change', {
				bubbles: true
			}));
			element.blur();
		}
	}

	// Copie le monstre sans initiative
	function copyMonsterWithoutInit(monster) {
		updateField('combobox-create-creature-form-name', monster.name);
		updateField('combobox-create-creature-form-hp', extractFirstNumber(monster.hp));
		if (monster.ac) {
			const nums = extractFirstNumber(monster.ac).match(/\d+/g);
			if (nums && nums.length === 1) {
				updateField('create-creature-form-ac', nums[0]);
			}
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
		//plusButton.style.marginLeft = "4px";

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
		// === menu déroulant « Favorites » ===
		const favorites = friends_favorites;
		const favContainer = document.createElement('div');

		favContainer.style.position = 'relative';
		favContainer.style.marginLeft = '4px';


		const favButton = document.createElement('button');
		//favButton.textContent = '⌄';
		favButton.textContent = '✯';
		favButton.title = 'Favorites';
		favButton.type = 'button';
		favContainer.appendChild(favButton);

		const favList = document.createElement('div');
		favList.style.position = 'absolute';
		favList.style.top = '100%';
		favList.style.left = '0';
		favList.style.background = '#fff';
		favList.style.border = '1px solid #ccc';
		favList.style.padding = '4px';
		favList.style.display = 'none';

		favorites.forEach(name => {
			const item = document.createElement('div');
			item.textContent = name;
			item.style.cursor = 'pointer';
			item.style.padding = '2px 6px';
			item.addEventListener('mouseover', () => {
				item.style.backgroundColor = '#f0f0f0';
			});
			item.addEventListener('mouseout', () => {
				item.style.backgroundColor = '';
			});
			item.addEventListener('click', () => {
				const m = monsterData.find(m => m.name === name);
				if (m) copyMonsterWithoutInit(m);
				favList.style.display = 'none';
			});
			favList.appendChild(item);
		});

		favContainer.appendChild(favList);
		container.appendChild(favContainer);
		// ←— Aligner les zones cliquables de "+" et "⌄"
		[plusButton, favButton].forEach(btn => {
			btn.style.boxSizing = 'border-box';
			btn.style.flex = '0 0 auto';
			btn.style.width = '40px';
			btn.style.height = '40px';
			btn.style.padding = '0';
			btn.style.fontSize = '1.2em';
		});


		// afficher/masquer au survol
		favButton.addEventListener('mouseenter', () => {
			favList.style.display = 'block';
		});
		favContainer.addEventListener('mouseleave', () => {
			favList.style.display = 'none';
		});
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
				const prefix = monster.source === '2024_MONSTERS_DB' ? '(2024) ' : '';
				div.textContent = prefix + monster.name;
				div.style.padding = "5px";
				div.style.cursor = "pointer";
				div.addEventListener('mouseover', () => {
					div.style.backgroundColor = '#f0f0f0';
				});
				div.addEventListener('mouseout', () => {
					div.style.backgroundColor = '';
				});
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
			updateField("combobox-create-creature-form-hp", extractFirstNumber(monster.hp));
			if (monster.ac) {
				const numbers = extractFirstNumber(monster.ac).match(/\d+/g);
				if (numbers && numbers.length === 1) {
					updateField("create-creature-form-ac", extractFirstNumber(monster.ac));
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
		// Traite les conditions dans les collapsed-creature (texte brut)
		const collapsedNotes = document.querySelectorAll('.collapsed-creature--notes.collapsed-creature--status__margin');
		collapsedNotes.forEach(noteElem => {
			let originalText = noteElem.textContent.trim();

			// Évite de retraiter si déjà traduit (on suppose que les conditions FR ne sont pas des clés)
			const isAlreadyTranslated = originalText.split(',').every(condition => {
				const trimmed = condition.trim();
				return !conditionsMap.hasOwnProperty(trimmed); // pas dans les clés anglaises = sûrement FR
			});
			if (isAlreadyTranslated) return;

			let conditionList = originalText.split(',').map(c => c.trim());
			let translatedList = conditionList.map(condition => {
				return conditionsMap[condition] || condition;
			});
			noteElem.textContent = translatedList.join(', ');
		});


	}

	function updateCreaturePicture() {
		const favorites = friends_favorites;
		// Parcourir tous les creature-wrapper
		const creatureWrappers = document.querySelectorAll('.creature-wrapper');
		creatureWrappers.forEach(wrapper => {
			// Récupérer le nom de la créature à partir de l'attribut aria-label (en retirant "expanded" si présent)
			let ariaLabel = wrapper.getAttribute('aria-label') || "";
			let creatureName = ariaLabel
				.replace(/ expanded/i, "") // Supprime "expanded"
				.replace(/\s*#\d+/g, "") // Supprime les "#123" avec espaces éventuels
				.trim(); // Nettoie les espaces restants
			if (!creatureName) return;

			if (favorites.includes(creatureName)) {
				wrapper.style.setProperty('background-image', 'none', 'important');
				wrapper.style.setProperty('background-color', 'rgb(127, 206, 123)', 'important');
			}


			// Trouver le monstre correspondant dans monsterData
			let monster = monsterData.find(m => m.name.toLowerCase() === creatureName.toLowerCase());
			if (!monster) return;

			// Déterminer s'il y a une image
			let hasImage = typeof monster.picture === "string" &&
				monster.picture.trim() !== "" &&
				/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(monster.picture.trim());

			// Dans le wrapper, trouver l'élément expanded-creature
			let expandedCreature = wrapper.querySelector('.expanded-creature');
			if (!expandedCreature) return;

			// Vérifier si l'élément "Illustration" est déjà présent dans expandedCreature
			if (expandedCreature.querySelector('.Picture-stat')) return;

			// Rechercher tous les éléments "expanded-creature--separator" dans expandedCreature
			let separators = expandedCreature.querySelectorAll('.expanded-creature--separator');
			if (!separators || separators.length === 0) {
				return;
			}
			// Choisir le dernier séparateur
			let lastSeparator = separators[separators.length - 1];

			// Créer un nouvel élément de stat pour "Illustration"
			let pictureElem = document.createElement("div");
			pictureElem.className = "expanded-creature--stat Picture-stat";


			// Créer le label "Illustration" et ajouter l'icône correspondante
			let label = document.createElement("b");
			label.textContent = "Illustration ";
			if (hasImage) {
				label.textContent += "👁";
			} else {
				label.textContent += "❌";
			}
			pictureElem.appendChild(label);

			if (hasImage) {


				// Créer le tooltip pour afficher l'image
				let tooltip = document.createElement("div");
				tooltip.className = "custom-tooltip image-tooltip";
				tooltip.style.position = "absolute";
				tooltip.style.background = "#fff";
				tooltip.style.border = "1px solid #000";
				tooltip.style.padding = "4px";
				tooltip.style.zIndex = "2000";
				tooltip.style.whiteSpace = "pre-wrap";
				tooltip.style.display = "none";

				let img = document.createElement("img");
				img.src = monster.picture;
				img.style.maxWidth = "300px";
				img.style.maxHeight = "300px";
				tooltip.appendChild(img);
				document.body.appendChild(tooltip);

				// Attacher les événements pour afficher/cacher le tooltip lors du survol du label
				label.addEventListener("mouseenter", function(e) {
					const rect = label.getBoundingClientRect();
					tooltip.style.top = (rect.bottom + window.scrollY) + "px";
					tooltip.style.left = (rect.left + window.scrollX) + "px";
					tooltip.style.display = "block";
				});
				label.addEventListener("mouseleave", function(e) {
					tooltip.style.display = "none";
				});
			}
			// Insérer pictureElem juste avant le dernier séparateur
			lastSeparator.parentNode.insertBefore(pictureElem, lastSeparator);
		});
	}



	// --- Observers et mises à jour périodiques ---
	function observeForSearchBar() {
		const target = document.body;
		const config = {
			childList: true,
			subtree: true
		};
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
	linkObserver.observe(document.body, {
		childList: true,
		subtree: true
	});

	function observeDOMChanges() {
		// Essayez de trouver un conteneur spécifique, sinon utilisez document.body
		const container = document.querySelector('.creature-list') || document.body;

		// Configuration de l'observateur :
		// childList : observer l'ajout ou la suppression directe d'enfants
		// subtree : observer également les changements dans les descendants
		const config = {
			childList: true,
			subtree: true
		};

		// Callback qui est appelé lorsque des mutations sont détectées
		const callback = (mutationsList, observer) => {
			for (const mutation of mutationsList) {
				// Si des noeuds ont été ajoutés, déclencher les mises à jour
				if (mutation.addedNodes.length > 0) {
					// Vous pouvez ajouter ici un test pour filtrer uniquement certains changements si nécessaire
					updateDndBeyondLinks();
					updateConditions();
					updateNoteConditions();
					updateCreaturePicture();
					// Une fois déclenché pour la mutation, on peut sortir pour éviter des appels multiples en même temps.
					break;
				}
			}
		};

		// Créer l'observateur et l'attacher au conteneur
		const observer = new MutationObserver(callback);
		observer.observe(container, config);
	}



	window.addEventListener('load', function() {
		createSearchElements();
		fetchMonsterData();
		observeForSearchBar();
		updateConditions();
		updateNoteConditions();
		updateCreaturePicture();
		observeDOMChanges();
	});
})();
