
let renderPokemonCard = (pokemon) => {
    return `
                 <div class="pokemon-card hover type-${pokemon.class}" id="pokemon-${pokemon.id}" onclick="openPokemonDialog(${pokemon.id})">
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

let pokemonDialog = (pokemon) => {
    return  `
        

        <div class="inner-dialog">
           <div class="dialog-header type-${pokemon.class}">
            <h2>${pokemon.name} <span class="pokemon-number">#${pokemon.id}</span></h2>
            <button class="close-btn type-${pokemon.class}" onclick="closePokemonDialog()">&#10005;</button>
        </div>
        <div class="dialog-body-content">
            <div class="left-inner-dialog">  
                <div class="dialog-body">
                    <img src="${pokemon.image}" alt="${pokemon.name} image" class="dialog-pokemon-image img-${pokemon.class}" width="200" height="200" loading="lazy">
                    <div class="dialog-pokemon-types">${insertTypes(pokemon.types)}</div>
                </div>
            </div>

            <div class="right-inner-dialog">
                <div class="dialog-tabs">
                    <button class="dialog-tab-button active" onclick="openTab(event, 'about')">About</button>
                    <button class="dialog-tab-button" onclick="openTab(event, 'stats')">Base Stats</button>
                    <button class="dialog-tab-button" onclick="openTab(event, 'moves')">Moves</button>
                </div>
                <div class="dialog-tab-content">
                </div>
            </div>
        </div>
        </div>
    `;
}