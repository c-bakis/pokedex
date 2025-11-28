
const pokemonCache = new Map();
const pokemonRawCache = new Map();
const pokemonSpeciesCache = new Map();
const pokemonEvolutionCache = new Map();
const _spinnerState = { count: 0 };
function spinnerShow() {
  _spinnerState.count++;
  const el = document.getElementById('loading-screen');
  if (el) el.style.display = 'flex';
}
function spinnerHide() {
  _spinnerState.count = Math.max(0, _spinnerState.count - 1);
  if (_spinnerState.count === 0) {
    const el = document.getElementById('loading-screen');
    if (el) el.style.display = 'none';
  }
}
const dialog = document.getElementById("dialogContent");
const dialogSection = document.getElementById("dialog");
const loadMoreCardsButton = document.getElementById("loadMoreCards");

dialog.addEventListener("close", () => {
  dialog.innerHTML = "";
  enableScroll();
  setupNoScrollAndHover();
  dialogSection.classList.add("hide");
});

let pokemonContainer = document.getElementById("pokemon-cards-container");
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
    const clean = () => executing.delete(p);
    p.then(clean).catch(clean);

    if (executing.size >= maxConcurrency) {
      await Promise.race(executing);
    }
  }
  const setteledResults = await Promise.allSettled(results);
  return setteledResults.map((r) =>
    r.status === "fulfilled" ? r.value : null
  );
}

async function safeFetchJson(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return await r.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

async function loadPokemon() {
  spinnerShow();
  try {
    currentOffset = 0;
    const data = await safeFetchJson(
      "https://pokeapi.co/api/v2/pokemon?limit=35&offset=0"
    );
    if (!data) {
      console.error("Failed to load initial Pokemon data");
      reloadbutton();
      return;
    }
    pokemonContainer.innerHTML = "";
    await renderAllPokemon(data.results);
  } finally {
    spinnerHide();
  }
}

async function loadMorePokemon() {
  spinnerShow();
  try {
    currentOffset += 35;
    console.log(currentOffset);
    let URL = `https://pokeapi.co/api/v2/pokemon?limit=40&offset=${currentOffset}`;
    let data = await safeFetchJson(URL);
    if (!data) return;
    console.log(URL);
    await renderAllPokemon(data.results);
  } finally {
    spinnerHide();
  }
}

async function loadAllPokemon() {
  spinnerShow();
  try {
    let URL = `https://pokeapi.co/api/v2/pokemon?limit=1025&offset=0`;
    let data = await safeFetchJson(URL);
    if (!data) return;
    pokemonContainer.innerHTML = "";
    closeBurgerMenu();
    await renderAllPokemon(data.results);
  } finally {
    spinnerHide();
  }
}

async function loadGenerationOfPokemon(firstId, lastId) {
  spinnerShow();
  try {
    const limit = lastId - firstId;
    currentOffset = lastId - 35;
    console.log(currentOffset, firstId, lastId);
    let url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${firstId}`;
    let data = await safeFetchJson(url);
    if (!data) return;
    pokemonContainer.innerHTML = "";
    await renderAllPokemon(data.results);
  } finally {
    spinnerHide();
  }
}

async function loadPokemonDetails(pokemon) {
  if (pokemonCache.has(pokemon.url)) {
    return pokemonCache.get(pokemon.url);
  }
  const data = await safeFetchJson(pokemon.url);
  if (!data) return null;
  const pokemonData = {
    id: data.id,
    name: (await findGermanName(data.id)) || data.name,
    image: data.sprites.other.dream_world.front_default
      ? data.sprites.other.dream_world.front_default
      : data.sprites.front_default,
    types: findTypes(data),
    class: data.types && data.types[0] ? data.types[0].type.name : "unknown",
  };
  pokemonCache.set(pokemon.url, pokemonData);
  pokemonCache.set(data.id, pokemonData);
  pokemonRawCache.set(data.id, data);
  return pokemonData;
}

let fetchPokemonDetails = async (id) => {
  spinnerShow();
  try {
    let data = pokemonRawCache.has(id) ? pokemonRawCache.get(id) : null;
    let base = await getBaseData(id, data);
    if (!pokemonCache.has(id)) {
      const germanName = (await findGermanName(base.id)) || base.name;
      const summary = {
        id: base.id,
        name: germanName,
        image: base.image,
        types: base.types,
        class: base.class,
      };
      pokemonCache.set(id, summary);
    }
    const abilities_info = await getAbilityData(data.abilities);
    const speciesUrl = data.species && data.species.url;
    const speciesData = await getSpeciesData(speciesUrl);
    const description =
      speciesData && speciesData.flavor_text_entries
        ? (
            speciesData.flavor_text_entries.find(
              (entry) => entry.language.name === "de"
            ) || { flavor_text: "Keine Beschreibung verfügbar" }
          ).flavor_text.replace(/\f/g, " ")
        : "Keine Beschreibung verfügbar";
        const evolutions = await getEvolutionChain(speciesData.evolution_chain.url);

    const pokemonData = {
      ...base,
      abilities_info,
      description,
      evolutions,
      height: data.height / 10,
      weight: data.weight / 10,
      stats: data.stats.map((stat) => ({
        name: stat.stat.name,
        value: stat.base_stat,
      })),
    };
    await indexExist(pokemonData);
    console.log(pokemonData);
    return pokemonData;
  } finally {
    spinnerHide();
  }
};

let getBaseData = async (id, data) => {
  const cachedSummary = pokemonCache.has(id) ? pokemonCache.get(id) : null;
  if (!data) {
    data = await safeFetchJson(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!data) return null;
    pokemonRawCache.set(id, data);
  }
  const base = {
    id: cachedSummary ? cachedSummary.id : data.id,
    name: cachedSummary ? cachedSummary.name : data.name,
    image: cachedSummary
      ? cachedSummary.image
      : data.sprites.other.dream_world.front_default
      ? data.sprites.other.dream_world.front_default
      : data.sprites.front_default,
    types: cachedSummary ? cachedSummary.types : findTypes(data),
    class: cachedSummary
      ? cachedSummary.class
      : data.types && data.types[0]
      ? data.types[0].type.name
      : "unknown",
  };
  return base;
};

let indexExist = async (pokemonData) => {
  if (!pokemonData || typeof pokemonData.id === "undefined") {
    console.warn("indexExist called without pokemonData or id");
    return false;
  }
  const id = pokemonData.id;
  const existingIndex = pokemonList.findIndex((p) => p.id === id);
  if (existingIndex !== -1) {
    pokemonList[existingIndex] = pokemonData;
    console.log(
      `indexExist: updated pokemon id=${id} at index ${existingIndex}`
    );
    return true; // existed
  } else {
    pokemonList.push(pokemonData);
    console.log(`indexExist: added pokemon id=${id}`);
    return false; // did not exist
  }
};

let getAbilityData = async (abilities) => {
  const abilitiesInfo = await asyncPool(abilities, async (ab) => {
    const abilityData = await safeFetchJson(ab.ability.url);
    if (!abilityData)
      return { name: ab.ability.name, effect: "No data available" };
    const effectEntry = abilityData.effect_entries.find(
      (entry) => entry.language.name === "de"
    );
    const abilityName = abilityData.names.find(
      (nameEntry) => nameEntry.language.name === "de"
    );
    return {
      name: abilityName.name,
      effect: effectEntry ? effectEntry.effect : "Keine Beschreibung verfügbar",
    };
  });
  return abilitiesInfo;
};

let insertAbilitiesInfo = (abilities_info, condition) => {
  if (!abilities_info || abilities_info.length === 0) return "None";
  else if (condition === "names_only") {
    return abilities_info.map((ab) => ab.name).join(", ");
  } else if (condition === "with_effects") {
    return abilities_info
      .map((ab) => `<div><strong>${ab.name}</strong>: ${ab.effect}</div>`)
      .join("");
  } else {
    return "";
  }
};

let getSpeciesData = async (speciesUrl) => {
  let speciesData = null;
  if (speciesUrl) {
    if (pokemonSpeciesCache.has(speciesUrl)) {
      speciesData = pokemonSpeciesCache.get(speciesUrl);
    } else {
      speciesData = await safeFetchJson(speciesUrl);
      if (speciesData) pokemonSpeciesCache.set(speciesUrl, speciesData);
    }
  }
  return speciesData;
};

let findGermanName = async (pokemonId) => {
  const speciesData = await safeFetchJson(
    `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`
  );
  if (!speciesData) return null;
  const germanEntry = speciesData.names.find(
    (nameEntry) => nameEntry.language.name === "de"
  );
  return germanEntry ? germanEntry.name : null;
};

let findTypes = (data) => {
  const typeIds = data.types.map((typeInfo) => {
    const parts = typeInfo.type.url.split("/").filter(Boolean);
    return parts[parts.length - 1];
  });
  return typeIds.map(
    (id) =>
      `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${id}.png`
  );
}

let insertTypes = (types) => {
  return types
    .map(
      (typeUrl) =>
        `<img src="${typeUrl}" class="pokemon-type-image" width="80" height="30" loading="lazy" alt="type icon">`
    )
    .join("");
}

let getEvolutionChain = async (evoUrl) => {
  let evolutionChainData = await getEvolutionData(evoUrl);
    if (!evolutionChainData || !evolutionChainData.chain) return [];
  const evolutions = [];
  let currentStage = evolutionChainData.chain;
  let i = 0;
  // working on do while loop for exceptione with more than one evolution like eevee
  // do {
  //   let numOfEvolutions = currentStage.evolves_to.length;

  // }
  console.log(currentStage);
  while (currentStage) {
    const speciesEntry = currentStage.species || {};
    const speciesEntryUrl = speciesEntry.url || null;
    let id = extractId(speciesEntryUrl);
    let url = await getUrlsById(id);
    evolutions.push(url);
    i++;
    // if (l >= 2) {
    //   console.log(i);

    // }      
    // console.log(l)    
    currentStage = currentStage.evolves_to && currentStage.evolves_to.length > 0
      ? currentStage.evolves_to[0]
      : null;
  }
  const evolutionChain = await asyncPool(evolutions, (evolution) =>
    loadPokemonDetails(evolution)
  );
    console.log(evolutionChain);
    return evolutionChain
  }

let getUrlsById = async (id) => {
    let item = {
      url: `https://pokeapi.co/api/v2/pokemon/${id}/`
    }
    return item;
}

let getEvolutionData = async (evoUrl) => {
    let evolutionChainData = null;
  try {
    if (pokemonSpeciesCache.has(evoUrl)) {
      evolutionChainData = pokemonSpeciesCache.get(evoUrl);
    } else {
      evolutionChainData = await safeFetchJson(evoUrl);
      if (evolutionChainData) pokemonSpeciesCache.set(evoUrl, evolutionChainData);
    }
    return evolutionChainData;
  } catch (err) {
    console.error('getEvolutionChain: failed fetching evolution chain:', err, evoUrl);
    return [];
  }
}

let extractId = (speciesEntryUrl) => {
    let id = null;
    if (speciesEntryUrl) {
      const parts = speciesEntryUrl.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      const parsed = Number(last);
      if (!Number.isNaN(parsed)) id = parsed;
    }
    return id;
}

let insertEvolutions = (evolution) => {
  if (!evolution || evolution.length === 0) return "None";
   else if (evolution || evolution.length !== 0) {
    return evolution.map((ev) => templateEvolutions(ev)).join("");
  } else {
    return "";
  }
}

let sortPokemonList = () => {
  pokemonList.sort((a, b) => a.id - b.id);
  return pokemonList;
}

let renderAllPokemon = async (pokemons) => {
  const results = await asyncPool(pokemons, (pokemon) =>
    loadPokemonDetails(pokemon)
  );
  const validResults = results.filter((r) => r !== null);
  const newItems = validResults.filter(
    (r) => !pokemonList.some((p) => p.id === r.id)
  );
  pokemonList = pokemonList.concat(newItems);

  sortPokemonList();
  const html = pokemonList
    .map((pokemon) => renderPokemonCard(pokemon))
    .join("");
  pokemonContainer.innerHTML = html;
};

async function sortGeneration(numofGeneration) {
  pokemonList = [];
  pokemonContainer.innerHTML = "";
  closeBurgerMenu();
  switch (numofGeneration) {
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
      loadGenerationOfPokemon(905, 1025);
      break;
    default:
      console.log("Unknown generation");
      loadPokemon();
      break;
  }
}

let closeBurgerMenu = () => {
  document.getElementById("burger-toggle").checked = false;
};

let setupNoScrollAndHover = () => {
  document.getElementById("body").classList.toggle("no-scroll");
  document.getElementById("header").classList.toggle("no-scroll");
  let pokemonCards = document.querySelectorAll(".pokemon-card");
  pokemonCards.forEach((card) => card.classList.toggle("hover"));
};

let scrollOffset;
const scrollElement = document.getElementById("body");

let blockScroll = () => {
  scrollOffset = window.pageYOffset;
  offsetMinusHeader =
    scrollOffset - document.getElementById("header").offsetHeight;
  scrollElement.style.top = `-${offsetMinusHeader}px`;
};
let enableScroll = () => {
  scrollElement.style.removeProperty("top");
  setTimeout(() => window.scrollTo(0, scrollOffset), 0);
  console.log(scrollOffset);
};

let openPokemonDialog = async (pokemonId) => {
  await fetchPokemonDetails(pokemonId);
  const pokemon = pokemonList.find((p) => p.id === pokemonId);
  createDialog(pokemon);
  fillStatsBar(pokemon);
  openTab(null, "about");
  dialog.showModal();
  blockScroll();
  setupNoScrollAndHover();
  dialogSection.classList.remove("hide");
};

let fillStatsBar = (pokemon) => {
  const statsBars = document.querySelectorAll(".stats-bar-fill");
  if (!pokemon || !pokemon.stats) return;
  pokemon.stats.forEach((stat, index) => {
    if (statsBars[index]) {
      const percentage = (Math.min(stat.value, 255) / 255) * 100;
      statsBars[index].style.width = `${percentage}%`;
    }
  });
};
//
let createDialog = (pokemon) => {
  if (!pokemon) return;
  console.log(pokemon);
  dialog.innerHTML = "";
  dialog.innerHTML += pokemonDialog(pokemon);
};

let closePokemonDialog = () => {
  if (dialog.open) {
    dialog.close();
  }
};

let closeDialogOutsideClick = (event) => {
  if (event.target === dialog) {
    closePokemonDialog();
  }
};

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
};
