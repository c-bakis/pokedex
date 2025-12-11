
async function loadPokemon() {
  spinnerShow();
  try {
    const URL = `https://pokeapi.co/api/v2/pokemon?limit=30&offset=${currentOffset}`;
    const data = await safeFetchJson(URL);
    if (!data) {
      console.error("Failed to load initial Pokemon data");
      reloadbutton();
      return;
    }
    currentOffset += 30;
    await renderAllPokemon(data.results);
  } finally {
    spinnerHide();
  }
};

async function loadAllPokemon() {
  spinnerShow();
  try {
    const URL = `https://pokeapi.co/api/v2/pokemon?limit=1025&offset=${currentOffset}`;
    const data = await safeFetchJson(URL);
    if (!data) return;
    pokemonContainer.innerHTML = "";
    closeBurgerMenu();
    await renderAllPokemon(data.results);
  } finally {
    spinnerHide();
  }
};

async function loadGenerationOfPokemon(firstId, lastId) {
  spinnerShow();
  try {
    const limit = lastId - firstId;
    const url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${firstId}`;
    const data = await safeFetchJson(url);
    if (!data) return;
    currentOffset = lastId;
    await renderAllPokemon(data.results);
  } finally {
    spinnerHide();
  }
};

async function safeFetchJson(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    return await r.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
};

async function loadPokemonDetails(pokemon) {
    spinnerShow();
    try {
    if (typeof pokemon === 'object' && pokemon !== null && 'url' in pokemon && pokemonCache.has(pokemon.url)) {
        const pokemonData = pokemonCache.get(pokemon.url);
        return pokemonData;
      } else if (pokemonCache.has(pokemon)) {
        const pokemonData = pokemonCache.get(pokemon);
        return pokemonData;
      } else {
        const data = await fetchAndStorePokemonData(pokemon);
        return data;
      }
    } finally {
      spinnerHide();
  }
};

async function fetchAndStorePokemonData(pokemon) {
          const data = await safeFetchJson(pokemon.url);
        if (!data) return null;
        const speciesData = await getSpeciesData(data.species.url);
        const pokemonData = await mapPokemonData(data, speciesData, pokemon.url); 
        pokemonCache.set(pokemon.url, pokemonData);
        pushToList(pokemonData);
        return pokemonData;
};

async function getSpeciesData(speciesUrl) {
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

async function mapPokemonData(data, speciesData, url) {
    return {
        url: url,
        speciesUrl: data.species.url, 
        id: data.id,
        name: findGermanName(speciesData) || data.name,
    image: data.sprites.other.dream_world.front_default
      ? data.sprites.other.dream_world.front_default
      : data.sprites.front_default,
    types: findTypes(data),
    class: data.types && data.types[0] ? data.types[0].type.name : "unknown",
    abilities: findAbilitiesInfo(data),
    height: data.height / 10,
    weight: data.weight / 10,
    description: findGermanDescription(speciesData) || "keine Beschreibnung verfügbar",
    stats: findStats(data),
    evolutionchainUrl: speciesData.evolution_chain.url,
    }
};

const openPokemonDialog = async (evoUrl = null, url, abUrl = null) => {
  const pokemonId = extractId(url);
  await loadPokemonDetails(url);
  const pokemon = pokemonList.find((p) => p.id === pokemonId);
  await createDialog(pokemon);
  fillStatsBar(pokemon);
  openTab(null, "about");
  dialog.showModal();
  blockScroll();
  setupNoScrollAndHover();
  dialogSection.classList.remove("hide");
};

async function insertAbilitiesDataInDialog (abilityUrls) {
  let abilitiesData = null;
  if (abilityCache.has(abilityUrls)) {
    abilitiesData = abilityCache.get(abilityUrls);
  } else {
    abilitiesData = await getAbilityData(abilityUrls);
    if (abilitiesData) abilityCache.set(abilityUrls, abilitiesData);
  }
    return abilitiesData
    .map((ab) => templateAbilitiesInDialog(ab)).join("");
};

async function insertEvolutionDataInDialog (evoUrl) {
  let evolutionData = null; if (evolutionCache.has(evoUrl)) {
    evolutionData = evolutionCache.get(evoUrl);
  } else {
    evolutionData = await getEvolutionChain(evoUrl);
    if (evolutionData) evolutionCache.set(evoUrl, evolutionData);
  }  if (!evolutionData || evolutionData.length === 0) return "None";
   else if (evolutionData || evolutionData.length !== 0) {
    return evolutionData.map((ev) => templateEvolutionsInDialog(ev)).join("");
  } else {
    return "";
  }
};

const getAbilityData = async (abilityUrls) => {
  return Promise.all(abilityUrls.map(async (abUrl) => {
    const abData = await safeFetchJson(abUrl);
      if (!abData) return { name: abUrl, effect: "No data available" };
      const effectEntry = abData.effect_entries.find(
        (entry) => entry.language.name === "de"
      );
      const abilityName = abData.names.find(
        (nameEntry) => nameEntry.language.name === "de"
      );
      return {
        name: abilityName ? abilityName.name : abUrl,
        effect: effectEntry ? effectEntry.effect : "Keine Beschreibung verfügbar",
      };
    })
  );
};

const getEvolutionChain = async (evoUrl) => {
  const evolutionChainData = await getEvolutionData(evoUrl);
  if (!evolutionChainData || !evolutionChainData.chain) return [];
  const results = [];

  const traverse = async (node, evoDetails = null) => {
    const speciesUrl = node.species && node.species.url;
    const id = extractId(speciesUrl);
    const name = await fetchOrFindGermanName(id) || (node.species && node.species.name) || null;
    const image = id ? await getImageForEvolutionChain(id) : null;
    results.push(evolutionobject(name, id, image, evoDetails));
    if (node.evolves_to && node.evolves_to.length > 0) {
      for (const child of node.evolves_to) {
        const childEvoDetails = (child.evolution_details && child.evolution_details[0]) || null;
        await traverse(child, childEvoDetails);
      }
    }
  };
  await traverse(evolutionChainData.chain, null);
  return results;
};

const evolutionobject = (name, id, image, evoDetails) => {
  return {
    species_name: name,
    id: id,
    min_level: evoDetails && typeof evoDetails.min_level !== 'undefined' ? evoDetails.min_level : null,
    trigger_name: evoDetails && evoDetails.trigger ? evoDetails.trigger.name : null,
    item: evoDetails && evoDetails.item ? evoDetails.item.name : null,
    image: image || null,
  };
};

const getImageForEvolutionChain = async (id) => {
  if (!id) return null;
  const url = `https://pokeapi.co/api/v2/pokemon/${id}/`;
  const data = await safeFetchJson(url);
  if (!data) return null;
  return (
    (data.sprites && data.sprites.other && data.sprites.other.dream_world && data.sprites.other.dream_world.front_default) ||
    data.sprites.front_default ||
    null
  );
};

const fetchOrFindGermanName = async (id) => {
      let url = `https://pokeapi.co/api/v2/pokemon-species/${id}/`;
      let speciesData = await getSpeciesData(url);
      let germanName = findGermanName(speciesData);
      return germanName;
    
  };

const getUrlsById = async (id) => {
    let item = {
      url: `https://pokeapi.co/api/v2/pokemon/${id}/`
    }
    return item;
  };

const getEvolutionData = async (evoUrl) => {
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
};

const extractId = (speciesEntryUrl) => {
    let id = null;
    if (speciesEntryUrl) {
      const parts = speciesEntryUrl.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      const parsed = Number(last);
      if (!Number.isNaN(parsed)) id = parsed;
    }
    return id;
};

const isNullOrData = (min_level, trigger_name, item) => {
    if (min_level !== null) {
        return `Level ${min_level}`;
    } else if (trigger_name === 'use-item' && item !== null) {
        return `Benutze ${item}`;
    } else {
        return '';
    }
};
