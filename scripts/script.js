
const pokemonCache = new Map();
const pokemonSpeciesCache = new Map();
const evolutionCache = new Map();
const abilityCache = new Map();
const dialog = document.getElementById("dialogContent");
const dialogSection = document.getElementById("dialog");
const loadMoreCardsButton = document.getElementById("loadMoreCards");
const _spinnerState = { count: 0 };
const pokemonContainer = document.getElementById("pokemon-cards-container");
const scrollElement = document.getElementById("body");

let scrollOffset;
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

function showToast(message, type = 'info', duration = 2000) {
  const container = document.getElementById('toast-container');
  if (!container) {
    console.warn('Toast container not found');
    return;
  }
  
  const toast = toastTemplate(message, type);
  container.innerHTML = toast;
  void toast.offsetWidth;
  toast.classList.add('show');
  const hide = () => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  };
  setTimeout(hide, duration);
  return {
    dismiss: hide,
  };
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

let insertAbilities = (abilities) => {
  return abilities
    .map((ab) => `<span class="ability-name">${ab.name}</span>`)
    .join(", ");
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

let createDialog = async (pokemon) => {
  if (!pokemon) return;
  dialog.innerHTML = "";
  const html = await pokemonDialog(pokemon);
  dialog.innerHTML += html;
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
  openTargetTab(tabName, evt);
}
let openTargetTab = (tabName, evt) => {
  const targetTab = document.getElementById(tabName);
  if (targetTab) {
    targetTab.style.display = "flex";
  } else {
    console.error("Tab not found:", tabName);
  }
  if (evt !== null) {
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
  await openPokemonDialog(evoUrl, url, abilityUrls);
}

let searchPokemon = () => {
  let inputField = document.getElementById('input');
  let searchValue = inputField.value;
  let capitalValue = searchValue.replace(/^\w/, (c) => c.toUpperCase());
  if (searchValue.length <= 2) {
    showInlineMessage("Bitte gib mindestens 3 Buchstaben ein, für eine erfolgreiche Suche.", 'warn', 3500);
    return;
  }
  let foundPokemon = pokemonList.filter((pokemon) => {
    if (searchValue.length >= 3 && pokemon.name.includes(capitalValue)) {
    return pokemon.name.includes(capitalValue);
    }
  });  
  if (foundPokemon.length == 0) {
    showInlineMessage("Keine Übereinstimmung gefunden.", 'info', 3000);
    foundPokemon = pokemonList;
  }
  renderCards(foundPokemon);
  inputField.value = "";
}

function showInlineMessage(message, type = 'info', duration = 4000) {
  const container = document.getElementById('search-messages');
  if (!container) return;
  container.innerHTML = `<div class="inline-msg ${type}">${message}</div>`;
  setTimeout(() => {
    container.innerHTML = '';
  }, duration);
}