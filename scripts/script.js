

    let pokemonContainer = document.getElementById('pokemon-cards-container');
    let pokemonList = [];

    async function loadPokemon() {
        let response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=30&offset=0');
        let data = await response.json();
        pokemonList = data.results.map(pokemon => ({
            name: pokemon.name,
            url: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getPokemonIdFromUrl(pokemon.url)}.png`
        }));
        pokemonContainer.innerHTML = '';
        pokemonList.forEach(pokemon => {
            pokemonContainer.innerHTML += renderPokemonCard(pokemon);
        });
    }

    function getPokemonIdFromUrl(url) {
      // z.B. "https://pokeapi.co/api/v2/pokemon/25/" -> "25"
      const parts = url.split('/').filter(Boolean); // entfernt leere Segmente
      return parts[parts.length - 1]; // letzte Komponente ist die ID
    }