

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

    async function loadAllPokemon() {
        let url = `https://pokeapi.co/api/v2/pokemon?limit=1025&offset=${pokemonList.length}`;
        let response = await fetch(url);
        let data = await response.json();
        pokemonContainer.innerHTML = '';
        await renderAllPokemon(data.results);
    } 

    async function loadGenerationOfPokemon(firstId, lastId) {
        const limit = lastId - firstId;
        let url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${firstId}`;
        let response = await fetch(url);
        let data = await response.json();
        nextURL = data.next;
        pokemonContainer.innerHTML = '';
        await renderAllPokemon(data.results);
    }

    async function loadPokemonDetails(pokemon) {
        let response = await fetch(pokemon.url);
        let data = await response.json();
        let pokemonData = {
            id: data.id,
            name: data.name,
            image: data.sprites.other.dream_world.front_default ? data.sprites.other.dream_world.front_default : data.sprites.front_default,
            types: findTypes(data),
            class: data.types[0].type.name,
            }
             return pokemonData;   
    };
    
    let sortPokemonList = () => {
        pokemonList.sort((a, b) => a.id - b.id);
        return pokemonList;
    }

    let renderAllPokemon = async (pokemons) => {
        const results = await Promise.all(pokemons.map(pokemon => loadPokemonDetails(pokemon)));
        pokemonList = pokemonList.concat(results);

        sortPokemonList();
        const html = pokemonList.map(pokemon => renderPokemonCard(pokemon)).join('');
        pokemonContainer.innerHTML = html;
    }

    let findTypes = (data) => {
        const typeIds = data.types.map(typeInfo => {
            const parts = typeInfo.type.url.split('/').filter(Boolean);
            return parts[parts.length - 1];
        });
        return typeIds.map(id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-ix/scarlet-violet/${id}.png`);
    }

    let insertTypes = (types) => {
        return types.map(typeUrl => `<img src="${typeUrl}" class="pokemon-type-image">`).join('');
    }

    let sortGeneration = (numofGeneration) => {
    pokemonList = [];
    pokemonContainer.innerHTML = '';
    switch(numofGeneration) {
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
            loadGenerationOfPokemon(905, 1010);
            break;
        default:
            console.log('Unknown generation');
            loadPokemon(); 
            break;
    }
}