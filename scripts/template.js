let renderPokemonCard = (pokemon) => {
  return `
                 <div class="pokemon-card hover type-${
                   pokemon.class
                 }" id="pokemon-${pokemon.id}" 
                        onclick="openPokemonDialog(${
                          pokemon.id
                        })" role="button" tabindex="0">
                    <div class="pokemon-name-number">
                        <h3>
                            <span class="pokemon-number">#${pokemon.id}</span>
                            <span class="pokemon-name">${pokemon.name}</span>
                        </h3>
                    </div>
                    <img src="${pokemon.image}" alt="${
    pokemon.name
  } image" class="pokemon-image img-${pokemon.class}" 
                            width="140" height="140" loading="lazy">
                    <div class="pokemon-types">${insertTypes(
                      pokemon.types
                    )}</div>
                 </div>
    `;
};

let reloadbutton = () => {
  pokemonContainer.innerHTML = `<div class="reload-button-container">
        <p class="reload-text">Beim Laden der Daten ist ein Fehler aufgetreten. 
        Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es 
        erneut.</p>
        <button class="reload-button load-cards-btn" onclick="loadPokemon()">Neu laden</button>
        </div>`;
};

let pokemonDialog = (pokemon) => {
  return `

        <div class="inner-dialog">
           <div class="dialog-header type-${pokemon.class}">
            <h2>${pokemon.name} <span class="pokemon-number">#${pokemon.id}</span></h2>
            <button class="close-btn type-${
              pokemon.class
            }" onclick="closePokemonDialog()">&#10005;</button>
        </div>
        <div class="dialog-body-content">
            <div class="left-inner-dialog">  
                <div class="dialog-body">
                    <img src="${pokemon.image}" alt="${
    pokemon.name
  } image" class="dialog-pokemon-image 
                            img-${pokemon.class}" loading="lazy">
                    <div class="dialog-pokemon-types">${insertTypes(
                      pokemon.types
                    )}</div>
                </div>
            </div>
                
            <div class="right-inner-dialog">
                <div class="dialog-tabs">
                    <button class="dialog-tab-button active" onclick="openTab(event, 'about')">Info</button>
                    <button class="dialog-tab-button" onclick="openTab(event, 'ability')">Fähigkeiten</button>
                    <button class="dialog-tab-button" onclick="openTab(event, 'stats')">Basis Werte</button>
                    <button class="dialog-tab-button" onclick="openTab(event, 'evolution')">Entwicklung</button>
                    <button class="dialog-tab-button" onclick="openTab(event, 'moves')">Attacken</button>
                </div>
                <div class="dialog-tab-content">
                    <div id="about" class="dialog-tab-pane active">
                        <div class="height-and-weight">
                            <p><strong>Größe:</strong> ${pokemon.height} m</p>
                            <p><strong>Gewicht:</strong> ${
                              pokemon.weight
                            } kg</p>
                        </div>  
                            <p class="description"><strong>Beschreibung: </strong></p>
                            <p>${pokemon.description}</p>
                            <p class="abilities"><strong>Fähigkeiten:</strong></p>
                            <p>${insertAbilitiesInfo(
                              pokemon.abilities_info,
                              "names_only"
                            )}</p>
                    </div>
        
         <div id="ability" class="dialog-tab-pane">
            <div class="abilities-info">
                ${insertAbilitiesInfo(pokemon.abilities_info, "with_effects")}
            </div>

        </div>
        
         <div id="stats" class="dialog-tab-pane">
            <table>
                <tbody>
                    <tr>
                        <td>HP</td>
                        <td>${pokemon.stats[0].value}</td>
                        <td class="stats-bar"><span class="stats-bar-fill"></span></td>
                    </tr>
                    <tr>
                        <td>Attack</td>
                        <td>${pokemon.stats[1].value}</td>
                        <td class="stats-bar"><span class="stats-bar-fill"></td>
                    </tr>
                    <tr>
                        <td>Defense</td>
                        <td>${pokemon.stats[2].value}</td>
                        <td class="stats-bar"><span class="stats-bar-fill"></td>
                    </tr>
                    <tr>
                        <td>Spec.-Attack</td>
                        <td>${pokemon.stats[3].value}</td>
                        <td class="stats-bar"><span class="stats-bar-fill"></td>
                    </tr>
                    <tr>
                        <td>Spec.-Defense</td>
                        <td>${pokemon.stats[4].value}</td>
                        <td class="stats-bar"><span class="stats-bar-fill"></td>
                    </tr>
                    <tr>
                        <td>Speed</td>
                        <td>${pokemon.stats[5].value}</td>
                        <td class="stats-bar"><span class="stats-bar-fill"></td>
                    </tr>
                </tbody>
            </table>
        </div>
         <div id="evolution" class="dialog-tab-pane">
            ${insertEvolutions(pokemon.evolutions)}
        </div>
        </div>
        </div>
        </div>
         
    `;
};

let templateEvolutions = (ev) => {
    return `
                <div class="pokemon-evolutions">
                 <p>${ev.name}</p>
                 <p>${ev.id}</p>
             </div>
             <div class="pokemon-evolutions">
                <img href="${ev.image}" class="evolution-sprite" 
                    alt="${ev.name} image">
             </div>
    `;
}

