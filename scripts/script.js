
    const pokemonCache = new Map();
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
            name: data.name,
            image: data.sprites.other.dream_world.front_default ? data.sprites.other.dream_world.front_default : data.sprites.front_default,
            types: findTypes(data),
            class: data.types && data.types[0] ? data.types[0].type.name : 'unknown'
        };
        pokemonCache.set(pokemon.url, pokemonData);
        return pokemonData;
    };
    
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
    createDialog(pokemonId);
    openTab(pokemonId);
    dialog.showModal();
    blockScroll();
    setupNoScrollAndHover();
}

let fetchPokemonDetails = async (id) => {
    const data = await safeFetchJson(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!data) return;
    const pokemonData = {
        id: data.id,
        name: data.name,
        image: data.sprites.other.dream_world.front_default ? data.sprites.other.dream_world.front_default : data.sprites.front_default,
        types: findTypes(data),
        class: data.types && data.types[0] ? data.types[0].type.name : 'unknown',
        abilities: data.abilities.map(ab => ab.ability.name),
        abilities_info: await asyncPool(data.abilities, async (ab) => {
            const abilityData = await safeFetchJson(ab.ability.url);
            if (!abilityData) return { name: ab.ability.name, effect: 'No data available' };
            const effectEntry = abilityData.effect_entries.find(entry => entry.language.name === 'en');
            return { name: ab.ability.name, effect: effectEntry ? effectEntry.effect : 'No effect description available' };
        }),
        height: data.height,
        weight: data.weight,
        stats: data.stats.map(stat => ({ name: stat.stat.name, value: stat.base_stat })),
        locationAreaEncounters: data.location_area_encounters,
    };
    const existingIndex = pokemonList.findIndex(p => p.id === id);
    if (existingIndex !== -1) {
        pokemonList[existingIndex] = pokemonData;
    } else {
        pokemonList.push(pokemonData);

}
    return pokemonData;
}

let insertAbilitiesInfo = (abilities_info) => {
    if (!abilities_info || abilities_info.length === 0) return 'None';
    return abilities_info.map(ab => `<div><strong>${ab.name}</strong>: ${ab.effect}</div>`).join('');
}

let createDialog = (pokemonId) => {
    const pokemon = pokemonList.find(p => p.id === pokemonId);
    if (!pokemon) return;
    console.log(pokemon);
    dialog.innerHTML = '';
    dialog.innerHTML += pokemonDialog(pokemon);
}

let openTab = (pokemonId) => {
    const pokemon = pokemonList.find(p => p.id === pokemonId);
    if (!pokemon) return;
    const tabContent = dialog.querySelector('.dialog-tab-content');
    tabContent.innerHTML = '';
    tabContent.innerHTML += aboutTab(pokemon);
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

let opentTab = (evt, tabName) => {
    console.log(tabName);
    console.log(evt.currentTarget);
    // let i, tabcontent, tabbuttons;
    // tabcontent = document.getElementsByClassName("dialog-tab-pane");
    // for (i = 0; i < tabcontent.length; i++) {
    //     tabcontent[i].style.display = "none";
    // } 
    // tabbuttons = document.getElementsByClassName("dialog-tab-button");
    // for (i = 0; i < tabbuttons.length; i++) {
    //     tabbuttons[i].className = tabbuttons[i].className.replace(" active", "");
    // }
    // document.getElementById(tabName).style.display = "block";
    // evt.currentTarget.className += " active";

}
