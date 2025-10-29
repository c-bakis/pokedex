
let renderPokemonCard = (pokemon) => {
    console.log('Rendering card for:', pokemon);
    return `
                 <div class="pokemon-card">
                    <div class="pokemon-name-number">
                        <h3>
                            <span class="pokemon-number">#${pokemon.id}</span>
                        <span class="pokemon-name">${pokemon.name}</span>
                    </h3>
                    <img src="${pokemon.image}" alt="${pokemon.name} image" class="pokemon-image">
                    <div class="pokemon-types">${pokemon.types}</div>
                    </div>
                 </div>
    `;
}