
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
  console.log(data.results);
    await renderAllPokemon(data.results);
  } finally {
    spinnerHide();
  }
}

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
}

async function loadGenerationOfPokemon(firstId, lastId) {
  spinnerShow();
  try {
    const limit = lastId - firstId;
    const url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${firstId}`;
    const data = await safeFetchJson(url);
    if (!data) return;
    currentOffset = lastId;
    await renderAllPokemon(data.results);
  console.log(data);
  } finally {
    spinnerHide();
  }
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

async function loadPokemonDetails(pokemon) {
    spinnerShow();
    try {
              console.log(pokemonCache.has(pokemon), pokemon);
    if (typeof pokemon === 'object' && pokemon !== null && 'url' in pokemon && pokemonCache.has(pokemon.url)) {
        const pokemonData = pokemonCache.get(pokemon.url);
        console.log(pokemonData);
        return pokemonData;
      } else if (pokemonCache.has(pokemon)) {
        const pokemonData = pokemonCache.get(pokemon);
        console.log(pokemon);
        return pokemonData;
      } else {
        const data = await fetchAndStorePokemonData(pokemon);
        return data;
      }
    } finally {
      spinnerHide();
  }
}

async function fetchAndStorePokemonData(pokemon) {
          const data = await safeFetchJson(pokemon.url);
        if (!data) return null;
        const speciesData = await getSpeciesData(data.species.url);
        const pokemonData = await mapPokemonData(data, speciesData, pokemon.url); 
        pokemonCache.set(pokemon.url, pokemonData);
        pushToList(pokemonData);
    console.log(pokemonData);
        return pokemonData;
}

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
}

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
}

async function evolutionAndAbilityData (evoUrl, abilityUrls) {
  
}


// async function asyncPool(items, asyncFn) {
//   const maxConcurrency = 12;
//   const results = [];
//   const executing = new Set();

//   for (const item of items) {
//     const p = Promise.resolve().then(() => asyncFn(item));
//     results.push(p);
//     executing.add(p);
//     const clean = () => executing.delete(p);
//     p.then(clean).catch(clean);

//     if (executing.size >= maxConcurrency) {
//       await Promise.race(executing);
//     }
//   }
//   const setteledResults = await Promise.allSettled(results);
//   return setteledResults.map((r) =>
//     r.status === "fulfilled" ? r.value : null
//   );
// }
