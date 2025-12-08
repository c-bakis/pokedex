
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
    currentOffset = lastId - 30;
    await renderAllPokemon(data.results);
  } finally {
    spinnerHide();
  }
}

async function safeFetchJson(url) {
  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
    console.log(r);
    return await r.json();
  } catch (err) {
    console.error("Fetch error:", err);
    return null;
  }
}

async function loadPokemonDetails(pokemon) {
    spinnerShow();
    try {
    if (pokemonCache.has(pokemon.url)) {
        return pokemonCache.get(pokemon.url);
    }
    const data = await safeFetchJson(pokemon.url);
    if (!data) return null;
    const speciesData = await getSpeciesData(data.species.url);
    const pokemonData = mapPokemonData(data, speciesData);
   pokemonCache.set(pokemon.url, pokemonData);
  pokemonCache.set(data.id, pokemonData);
  pokemonRawCache.set(data.id, data);
  console.log(pokemonCache);
  pushToList(pokemonData);
  return pokemonData;
    } finally {
    spinnerHide();
  }
}

async function mapPokemonData(data, speciesData) {
    return {
        url: data.url,
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
    }
}

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
