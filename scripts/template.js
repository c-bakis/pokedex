
let renderPokemonCard = (pokemon) => {
    console.log('Rendering card for:', pokemon);
    return `
        <div class="pokemon-card">
            <h3>${pokemon.name}</h3>
            <img src="${pokemon.url}" alt="${pokemon.name} image">
        </div>
    `;
}