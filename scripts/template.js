
let renderPokemonCard = (pokemon) => {
    return `
                 <div class="pokemon-card type-${pokemon.class}">
                    <div class="pokemon-name-number">
                        <h3>
                            <span class="pokemon-number">#${pokemon.id}</span>
                            <span class="pokemon-name">${pokemon.name}</span>
                        </h3>
                    </div>
                    <img src="${pokemon.image}" alt="${pokemon.name} image" class="pokemon-image img-${pokemon.class}" width="140" height="140" loading="lazy">
                    <div class="pokemon-types">${insertTypes(pokemon.types)}</div>
                 </div>
    `;
}