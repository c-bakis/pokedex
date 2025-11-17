
    const pokemonCache = new Map();
    // Cache raw pokemon API responses keyed by numeric id to avoid re-fetching
    const pokemonRawCache = new Map();
    // Cache species responses to avoid re-fetching species endpoints
    const pokemonSpeciesCache = new Map();
    const dialog = document.getElementById('dialogContent');
    // Add event listener for dialog close events
    dialog.addEventListener('close', () => {
        dialog.innerHTML = '';
        enableScroll();
        setupNoScrollAndHover();
    });

    let pokemonContainer = document.getElementById('pokemon-cards-container');
    let pokemonList = [];
    let currentOffset = 0;

    async function asyncPool(items, asyncFn) {
        const maxConcurrency = 12;
        const results = [];
        const executing = new Set();

        for (const item of items) {
            const p = Promise.resolve().then(() => asyncFn(item));
            results.push(p);
            executing.add(p);
            // When the promise settles, remove it from the executing set
            const clean = () => executing.delete(p);
            p.then(clean).catch(clean);
            console.log(executing.size);

            if (executing.size >= maxConcurrency) {
                await Promise.race(executing);
            }
        }
        const setteledResults = await Promise.allSettled(results);
        return setteledResults.map(r => r.status === 'fulfilled' ? r.value : null);
    }

    // Safe fetch helper: returns parsed JSON or null on error
    async function safeFetchJson(url) {
        try {
            const r = await fetch(url);
            if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
            return await r.json();
        } catch (err) {
            console.error('Fetch error:', err);
            return null;
        }
    }

    async function loadPokemon() {
    currentOffset = 0;
    console.log(currentOffset);
    const data = await safeFetchJson('https://pokeapi.co/api/v2/pokemon?limit=40&offset=0');
    if (!data) return;
    pokemonContainer.innerHTML = '';
    await renderAllPokemon(data.results);
    }

    async function loadMorePokemon() {
    currentOffset += 40;
    console.log(currentOffset);
    let URL = `https://pokeapi.co/api/v2/pokemon?limit=40&offset=${currentOffset}`;
    let data = await safeFetchJson(URL);
    if (!data) return;
    console.log(URL);
    await renderAllPokemon(data.results);
    }

    async function loadAllPokemon() {
    let URL = `https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0`;
    let data = await safeFetchJson(URL);
    if (!data) return;
    pokemonContainer.innerHTML = '';
    await renderAllPokemon(data.results);
    } 

    async function loadGenerationOfPokemon(firstId, lastId) {
    const limit = lastId - firstId;
    currentOffset = lastId;
    console.log(currentOffset);
    let url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${firstId}`;
    let data = await safeFetchJson(url);
    if (!data) return;
    pokemonContainer.innerHTML = '';
    await renderAllPokemon(data.results);
    }

    async function loadPokemonDetails(pokemon) {
        if (pokemonCache.has(pokemon.url)) {
            return pokemonCache.get(pokemon.url);
        }
        const data = await safeFetchJson(pokemon.url);
        if (!data) return null;
        const pokemonData = {
            id: data.id,
            name: await findGermanName(data.id) || data.name,
            image: data.sprites.other.dream_world.front_default ? data.sprites.other.dream_world.front_default : data.sprites.front_default,
            types: findTypes(data),
            class: data.types && data.types[0] ? data.types[0].type.name : 'unknown'
        };
        // Cache both a small summary (by URL and by id) and the full raw data (by id)
        pokemonCache.set(pokemon.url, pokemonData);
        pokemonCache.set(data.id, pokemonData);
        pokemonRawCache.set(data.id, data);
        return pokemonData;
    };

    let fetchPokemonDetails = async (id) => {
        console.log('fetchPokemonDetails', id);
        const cachedSummary = pokemonCache.has(id) ? pokemonCache.get(id) : null;
        let data = pokemonRawCache.has(id) ? pokemonRawCache.get(id) : null;
        if (!data) {
            data = await safeFetchJson(`https://pokeapi.co/api/v2/pokemon/${id}`);
            if (!data) return;
            pokemonRawCache.set(id, data);
        }
        const base = {
            id: cachedSummary ? cachedSummary.id : data.id,
            name: cachedSummary ? cachedSummary.name : data.name,
            image: cachedSummary ? cachedSummary.image : (data.sprites.other.dream_world.front_default ? data.sprites.other.dream_world.front_default : data.sprites.front_default),
            types: cachedSummary ? cachedSummary.types : findTypes(data),
            class: cachedSummary ? cachedSummary.class : (data.types && data.types[0] ? data.types[0].type.name : 'unknown')
        };
        if (!pokemonCache.has(id)) {
            const germanName = await findGermanName(base.id) || base.name;
            const summary = { id: base.id, name: germanName, image: base.image, types: base.types, class: base.class };
            pokemonCache.set(id, summary);
        }
        const abilities = data.abilities.map(ab => ab.ability.name);
        const abilities_info = await asyncPool(data.abilities, async (ab) => {
            const abilityData = await safeFetchJson(ab.ability.url);
            if (!abilityData) return { name: ab.ability.name, effect: 'No data available' };
            const effectEntry = abilityData.effect_entries.find(entry => entry.language.name === 'de');
            const abilityName = abilityData.names.find(nameEntry => nameEntry.language.name === 'de');
            return { name: abilityName.name, effect: effectEntry ? effectEntry.effect : 'No effect description available' };
        });

        let speciesData = null;
        const speciesUrl = data.species && data.species.url;
        if (speciesUrl) {
            if (pokemonSpeciesCache.has(speciesUrl)) {
                speciesData = pokemonSpeciesCache.get(speciesUrl);
            } else {
                speciesData = await safeFetchJson(speciesUrl);
                if (speciesData) pokemonSpeciesCache.set(speciesUrl, speciesData);
            }
        }

        const description = (speciesData && speciesData.flavor_text_entries)
            ? (speciesData.flavor_text_entries.find(entry => entry.language.name === 'de') || { flavor_text: 'No description available' }).flavor_text.replace(/\f/g, ' ')
            : 'No description available';

        const pokemonData = {
            ...base,
            abilities,
            abilities_info,
            description,
            height: data.height / 10,
            weight: data.weight / 10,
            stats: data.stats.map(stat => ({ name: stat.stat.name, value: stat.base_stat })),
            locationAreaEncounters: data.location_area_encounters,
            evolution: speciesData ? await getEvolutionChain(speciesUrl) : []
        };

        const existingIndex = pokemonList.findIndex(p => p.id === id);
        if (existingIndex !== -1) {
            pokemonList[existingIndex] = pokemonData;
        } else {
            pokemonList.push(pokemonData);
        }

        console.log(pokemonData);
        return pokemonData;
    }
    
    let sortPokemonList = () => {
        pokemonList.sort((a, b) => a.id - b.id);
        return pokemonList;
    }

    let renderAllPokemon = async (pokemons) => {
        const results = await asyncPool(pokemons, pokemon => loadPokemonDetails(pokemon));
        // Filter out failed (null) fetches
        console.log(results);
        const validResults = results.filter(r => r !== null);
        // Prevent duplicates by ID
        const newItems = validResults.filter(r => !pokemonList.some(p => p.id === r.id));
        pokemonList = pokemonList.concat(newItems);

        sortPokemonList();
        const html = pokemonList.map(pokemon => renderPokemonCard(pokemon)).join('');
        pokemonContainer.innerHTML = html;
    }

    let findGermanName = async (pokemonId) => {
        const speciesData = await safeFetchJson(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
        if (!speciesData) return null;
        const germanEntry = speciesData.names.find(nameEntry => nameEntry.language.name === 'de');
        return germanEntry ? germanEntry.name : null;
    }

    let findTypes = (data) => {
        const typeIds = data.types.map(typeInfo => {
            const parts = typeInfo.type.url.split('/').filter(Boolean);
            return parts[parts.length - 1];
        });
        return typeIds.map(id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${id}.png`);
    }

    let insertTypes = (types) => {
        return types.map(typeUrl => `<img src="${typeUrl}" class="pokemon-type-image" width="80" height="30" loading="lazy" alt="type icon">`).join('');
    }

    async function sortGeneration(numofGeneration) {
    pokemonList = [];
    pokemonContainer.innerHTML = '';
    switch(numofGeneration) {
        case 1:
            loadGenerationOfPokemon(0, 151);
            break;
        case 2:
            loadGenerationOfPokemon(151, 251);
            break;
        case 3:
            loadGenerationOfPokemon(251, 386);
            break;
        case 4:
            loadGenerationOfPokemon(386, 493);
            break;
        case 5:
            loadGenerationOfPokemon(493, 649);
            break;
        case 6:
            loadGenerationOfPokemon(649, 721);
            break;
        case 7:
            loadGenerationOfPokemon(721, 809);
            break;
        case 8:
            loadGenerationOfPokemon(809, 905);
            break;
        case 9:
            loadGenerationOfPokemon(905, 1010);
            break;
        default:
            console.log('Unknown generation');
            loadPokemon(); 
            break;
    }
}

let setupNoScrollAndHover = () => {
    document.getElementById("main").classList.toggle('no-scroll');
    let pokemonCards = document.querySelectorAll('.pokemon-card');
    pokemonCards.forEach(card => (card.classList.toggle('hover')));
}

let scrollOffset;
const scrollElement = document.getElementById("main");

let blockScroll = () => {
    scrollOffset = window.pageYOffset;
    scrollElement.style.top = `-${scrollOffset}px`;
}
let enableScroll = () => {
    scrollElement.style.removeProperty('top');
    setTimeout(() => window.scrollTo(0, scrollOffset), 0);
    console.log(scrollOffset);
}

let openPokemonDialog = async (pokemonId) => {
    await fetchPokemonDetails(pokemonId);
    const pokemon = pokemonList.find(p => p.id === pokemonId);
    createDialog(pokemon);
    fillStatsBar(pokemon);
    openTab(null, 'about');
    dialog.showModal();
    blockScroll();
    setupNoScrollAndHover();
}


let getEvolutionChain = async (speciesUrl) => {
    // Try to reuse species/evolution chain cache
    let speciesData = null;
    if (pokemonSpeciesCache.has(speciesUrl)) {
        speciesData = pokemonSpeciesCache.get(speciesUrl);
    } else {
        speciesData = await safeFetchJson(speciesUrl);
        if (speciesData) pokemonSpeciesCache.set(speciesUrl, speciesData);
    }
    if (!speciesData || !speciesData.evolution_chain) return [];

    const evoUrl = speciesData.evolution_chain.url;
    let evolutionChainData = null;
    if (pokemonSpeciesCache.has(evoUrl)) {
        evolutionChainData = pokemonSpeciesCache.get(evoUrl);
    } else {
        evolutionChainData = await safeFetchJson(evoUrl);
        if (evolutionChainData) pokemonSpeciesCache.set(evoUrl, evolutionChainData);
    }
    if (!evolutionChainData) return [];

    const evolutions = [];
    let currentStage = evolutionChainData.chain;
    while (currentStage) {
        evolutions.push(currentStage.species.name);
        currentStage = currentStage.evolves_to && currentStage.evolves_to.length > 0 ? currentStage.evolves_to[0] : null;
    }
    console.log(evolutions);
    return evolutions;
}

let insertAbilitiesInfo = (abilities_info, condition) => {
    if (!abilities_info || abilities_info.length === 0) return 'None';
    else if (condition === "names_only") {
        return abilities_info.map(ab => ab.name).join(', ');
    } else if (condition === "with_effects") {
        return abilities_info.map(ab => `<div><strong>${ab.name}</strong>: ${ab.effect}</div>`).join('');
    } else {
        return '';
    }
}

let fillStatsBar = (pokemon) => {
    const statsBars = document.querySelectorAll('.stats-bar-fill');
    if (!pokemon || !pokemon.stats) return;
    pokemon.stats.forEach((stat, index) => {
        if (statsBars[index]) {
            const percentage = Math.min(stat.value, 255) / 255 * 100;
            statsBars[index].style.width =  `${percentage}%`;
        }
    });
}
// 
let createDialog = (pokemon) => {
    if (!pokemon) return;
    console.log(pokemon);
    dialog.innerHTML = '';
    dialog.innerHTML += pokemonDialog(pokemon);
}

let closePokemonDialog = () => {
  if (dialog.open) {
    dialog.close();
  }
}

let closeDialogOutsideClick = (event) => {
    if (event.target === dialog) {
        closePokemonDialog();
    }
}

let openTab = (evt, tabName) => {
    let i, tabcontent, tabbuttons;
    tabcontent = document.getElementsByClassName("dialog-tab-pane");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    } 
    tabbuttons = document.getElementsByClassName("dialog-tab-button");
    for (i = 0; i < tabbuttons.length; i++) {
        if (evt !== null) {
             tabbuttons[i].className = tabbuttons[i].className.replace(" active", "");
        }
    }
    document.getElementById(tabName).style.display = "block";
    if (evt !== null) {
    console.log(evt.currentTarget);
        evt.currentTarget.className += " active";
    }
}

