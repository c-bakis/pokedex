<img align="left" src="https://github.com/c-bakis/pokedex/blob/main/assets/img/pokeball.png" width="100" alt="logo"/> 
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
  
<img align="left" src="https://github.com/c-bakis/pokedex/blob/main/assets/img/main_page.png" alt="pokedex"/>
<br/>
<br clear="left">

<br/>

<img align="center" src="https://github.com/c-bakis/pokedex/blob/main/assets/img/menu.png" alt="menu"/>

<img align="center" src="https://github.com/c-bakis/pokedex/blob/main/assets/img/dialog.png" alt="detailed view of pokemon"/>

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
  currentOffset = 0;
  console.log(currentOffset);
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
}
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

Cache all fetched details in Maps, to prefend multiple requests.
```bash
async function loadPokemonDetails(pokemon) {
  if (pokemonCache.has(pokemon.url)) {
    return pokemonCache.get(pokemon.url);
  }
```
### What I am currently working on

- search option for Pokemon names or indexes
- evolution chain on the detailed view

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
