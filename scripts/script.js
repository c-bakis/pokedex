
const pokemonCache = new Map();
const pokemonSpeciesCache = new Map();
const dialog = document.getElementById("dialogContent");
const dialogSection = document.getElementById("dialog");
const loadMoreCardsButton = document.getElementById("loadMoreCards");
const _spinnerState = { count: 0 };
const pokemonContainer = document.getElementById("pokemon-cards-container");

let pokemonList = [];
let currentOffset = 0;

dialog.addEventListener("close", () => {
  dialog.innerHTML = "";
  enableScroll();
  setupNoScrollAndHover();
  dialogSection.classList.add("hide");
});

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

let pushToList = (pokemonData) => {
  if (!pokemonData || typeof pokemonData.id === "undefined") {
    console.warn(pokemonData.id, "indexExist called without pokemonData or id");
    return false;
  }
  const id = pokemonData.id;
  const existingIndex = pokemonList.findIndex((p) => p.id === id);
  if (existingIndex !== -1) {
    pokemonList[existingIndex] = pokemonData;
    return true;
  } else {
    pokemonList.push(pokemonData);
    return false;
  }
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

let findGermanName = (speciesData) => {
  if (!speciesData) return null;
  let germanEntry = speciesData.names.find(
    (nameEntry) => nameEntry.language.name === "de"
  );
  return germanEntry.name ? germanEntry.name : null;;
} 

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

let findAbilitiesInfo = (data) => {
  return data.abilities.map((ab) => ({
    name: ab.ability.name,
    url: ab.ability.url,
  }));
}

let findGermanDescription = (speciesData) => {
  if (!speciesData || !speciesData.flavor_text_entries) return null;
  let germanEntry = speciesData.flavor_text_entries.find(
    (entry) => entry.language.name === "de" ? entry.language.name === "de" : null
  );
  return germanEntry ? germanEntry.flavor_text : null;
}


let findStats = (data) => {
  return data.stats.map((stat) => ({
    name: stat.stat.name,
    value: stat.base_stat,
  }))
}
let getAbilityData = async (abilities) => {
    const abilityData = await safeFetchJson(abilities.map((ab) => ab.ability.url));
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
};


let getEvolutionChain = async (evoUrl) => {
  const evolutionChainData = await getEvolutionData(evoUrl);
    if (!evolutionChainData || !evolutionChainData.chain) return [];
  const evoChain = [];
  let currentStage = evolutionChainData.chain;
  // working on do while loop for exceptione with more than one evolution like eevee
  do {
    let evoDetails = currentStage.evolution_details[0] || {};
      evoChain.push({
    "species_name": fetchOrFindGermanName(currentStage.species.id) || currentStage.species.name,
    "id": extractId(currentStage.species.url),
    "min_level": !evoDetails ? 1 : evoDetails.min_level,
    "trigger_name": !evoDetails ? null : evoDetails.trigger,
    "item": !evoDetails ? null : evoDetails.item
  }); 
  currentStage = currentStage['evolves_to'][0];
    } while (!!currentStage && currentStage.hasOwnProperty('evolves_to'));
  console.log(evoChain);
  return evoChain;
  }
  
  // while (currentStage) {
  //   const speciesEntry = currentStage.species || {};
  //   const speciesEntryUrl = speciesEntry.url || null;
  //   let id = extractId(speciesEntryUrl);
  //   let url = await getUrlsById(id);
  //   evolutions.push(url);
  //   i++;
  //   currentStage = currentStage.evolves_to && currentStage.evolves_to.length > 0
  //     ? currentStage.evolves_to[0]
  //     : null;
  // }
 

  let fetchOrFindGermanName = async (nameOrId) => {
    let germanName = null;
    if (typeof nameOrId === "string") {
      germanName = nameOrId;
  } else if (typeof nameOrId === "number") {
      if (pokemonCache.has(nameOrId)) {
        germanName = pokemonCache.get(nameOrId).name;
      } else {
        const data = await safeFetchJson(`https://pokeapi.co/api/v2/pokemon-species/${nameOrId}`);
        germanName = findGermanName(data) || data.name;
      }
    }
    return germanName;
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
  const results = await Promise.all(
    pokemons.map((pokemon) => loadPokemonDetails(pokemon))
  );
  const validResults = results.filter((r) => r !== null);
  const newItems = validResults.filter(
    (r) => !pokemonList.some((p) => p.id === r.id)
  );
  pokemonList = pokemonList.concat(newItems);

  sortPokemonList();
  renderCards(pokemonList);
}

let renderCards = (list) => {
  const html = list.map((pokemon) => renderPokemonCard(pokemon)).join("");
  pokemonContainer.innerHTML = html;
}

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
};

let openPokemonDialog = async (evoUrl = null, url, abUrl = null) => {
  console.log(evoUrl, url, abUrl);
  const pokemonId = extractId(url);
  await loadPokemonDetails(url);
  await evolutionAndAbilityData(evoUrl, abUrl);
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
      const percentage = (Math.min(stat.value, 250) / 250) * 100;
      statsBars[index].style.width = `${percentage}%`;
    }
  });
};
//
let createDialog = (pokemon) => {
  if (!pokemon) return;
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
  document.getElementById(tabName).style.display = "flex";
  if (evt !== null) {
    console.log(evt.currentTarget);
    evt.currentTarget.className += " active";
  }
};

let nextPokemon = async (id) => {
  let newId = id + 1;  
  let lastIndex = pokemonList.length - 1;
  let lastId = pokemonList[lastIndex].id;
  if (newId >= lastId) {
      newId = pokemonList[0].id;
    }
  closePokemonDialog();
  await new Promise(resolve => setTimeout(resolve, 100));
  await nextAndPreviousDialog(newId);
}
let previousPokemon = async (id) => {
  let newId = id - 1;
  let lastIndex = pokemonList.length - 1;
  let lastId = pokemonList[lastIndex].id;
  if (newId < 1) {
      newId = lastId;  
    }
  closePokemonDialog();
  await new Promise(resolve => setTimeout(resolve, 100));
  await nextAndPreviousDialog(newId);
}

let nextAndPreviousDialog = async (id) => {
    const findPokemon = pokemonList.find(p => p.id === id);
    if (!findPokemon) {
      console.error('Pokemon not found for id:', id);
      return;
    }
  const evoUrl = findPokemon.evolutionchainUrl ? findPokemon.evolutionchainUrl : null;
  const url = findPokemon.url ? findPokemon.url : null;
  const abilityUrls = findPokemon.abilities ? findPokemon.abilities.map(ab => ab.url) : null;
  console.log(evoUrl, url, abilityUrls);
  await openPokemonDialog(evoUrl, url, abilityUrls);
}

let searchPokemon = () => {
  let inputField = document.getElementById('input');
  let searchValue = inputField.value;
  let capitalValue = searchValue.replace(/^\w/, (c) => c.toUpperCase());
  if (searchValue.length <= 2) {
      alert("Bitte gib mindestens 3 Buchstaben ein, für eine erfolgreiche Suche.");
  }
  let foundPokemon = pokemonList.filter((pokemon) => {
    if (searchValue.length >= 3 && pokemon.name.includes(capitalValue)) {
    return pokemon.name.includes(capitalValue);
    }
  });  
  if (foundPokemon.length == 0) {
    alert("Keine Übereinstimmung gefunden.");
    foundPokemon = pokemonList;
  }
  console.log(foundPokemon)
  renderCards(foundPokemon);
  inputField.value = "";
}