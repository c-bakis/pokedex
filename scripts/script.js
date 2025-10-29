

    let pokemonContainer = document.getElementById('pokemon-cards-container');
    let pokemonList = [];
    let nextURL = null;

    async function loadPokemon() {
        let response = await fetch('https://pokeapi.co/api/v2/pokemon?limit=40&offset=0');
        let data = await response.json();
        nextURL = data.next;
        pokemonContainer.innerHTML = '';
        await renderAllPokemon(data.results);
    }

    async function loadMorePokemon() {
        if (!nextURL) return;
        let response = await fetch(nextURL);
        let data = await response.json();
        nextURL = data.next;
        await renderAllPokemon(data.results);
    }

    async function loadPokemonDetails(pokemon) {
        let response = await fetch(pokemon.url);
        let data = await response.json();
        let pokemonData = {
            id: data.id,
            name: data.name,
            image: data.sprites.front_default,
            types: data.types.map(typeInfo => typeInfo.type.name)
        };
        return pokemonData;
    }

    let sortPokemonList = () => {
        pokemonList.sort((a, b) => a.id - b.id);
        return pokemonList;
    }

    let renderAllPokemon = async (pokemons) => {
        const results = await Promise.all(pokemons.map(pokemon => loadPokemonDetails(pokemon)));
        pokemonList = results;

        sortPokemonList();
        pokemonList.forEach(pokemon => {
            pokemonContainer.innerHTML += renderPokemonCard(pokemon);
        });
    }