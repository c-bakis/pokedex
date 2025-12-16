<img align="left" src="https://github.com/c-bakis/pokedex/blob/main/public/assets/img/pokeball.png" width="100" alt="logo"/> 
<br/>

# Pokedex

<br>
<p align="center">This is one of the projects I am creating as part of my advanced training at the Developer Akademie. 
I use the PokeAPI to fetch data and use it in this project.
Especially for my son I decided to write this Pokedex in the german language.</p>

<br>
<br clear="left"/>

## Features

<br/>

<p align="center">Get information for all Pokemon.</p>

<p align="center">Click on a Pokemon to see a detailed view, search for Pokemon or sort them by generation</p>

<br/>
  
<img align="left" src="https://github.com/c-bakis/pokedex/blob/main/public/assets/img/main_page.png" alt="pokedex"/>
<br/>
<br clear="left">

<br/>

<img align="center" src="https://github.com/c-bakis/pokedex/blob/main/public/assets/img/menu.png" alt="menu"/>

<img align="center" src="https://github.com/c-bakis/pokedex/blob/main/public/assets/img/dialog.png" alt="detailed view of pokemon"/>

<p></p>
<p></p>
<br clear="right"/> <br clear="left"/>
<br/>

## My Process 

### Built with

 - HTML 5
 - CSS 3
 - Vanilla JavaScript

### Learning experience

Fetch data from the PokeAPI. 

```bash
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
```
Throw an error if the response wasn't successfull, parse the response and catch any errors.

```bash
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
```

Check if a Map has the data safed bevore fetching it and
cache all fetched details in Maps, to prefend multiple requests.
```bash
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
```
<br/>

## Installation

clone repository:
```bash
git clone https://github.com/c-bakis/pokedex.git
```

Navigate to the project repository
```bash
cd pokedex
```


<br/>

## Contributing

You are welcome to contribute to my project by creating an issure or making a pull request

## Author 

my Profile [ch-bakis](https://github.com/c-bakis)

## License

MIT License
