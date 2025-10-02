
// Scroll down the page to make sure all the words are loaded.
window.scrollTo(0, document.body.scrollHeight)

// Store words and their definitions.
var wordsDefsDict = {
    // "geduldig": "patient","dynamisch": "dynamique","nett": "gentil","ruhig": "calme","freundlich": "aimable","hilfsbereit": "serviable","sensibel": "sensible, susceptible","launisch": "lunatique","optimistisch": "optimiste (m/f)","melancholisch": "mélancolique","sportlich": "sportif","ehrlich": "honnête","erzählen": "raconter","verstehen, versteht, verstand, hat verstanden": "comprendre","zusammen": "ensemble","sich langweilen, langweilte sich, hat sich gelangweilt": "s'ennuyer","beide": "les deux","die Geheimnisse": "les secrets","Schach spielen": "jouer aux échecs","die Strasse": "la rue","sich auf jemanden verlassen": "compter sur qqn","wollen": "vouloir","fahren, fährt, fuhr, ist gefahren": "aller en véhicule","studieren (hat studiert)": "faire des études","sich gut verstehen": "bien s'entendre","später": "plus tard"
  
};


// Fetch words and their definitions, and add them to dictionnary.
function makeDictionary() {

    const words = Array.from(document.querySelectorAll('.SetPageTerm-wordText'));
    const definitions = Array.from(document.querySelectorAll('.SetPageTerm-definitionText'));

    words.forEach((word, index) => {
        const definition = definitions[index];

        //console.log(word.firstChild.innerHTML, definition.firstChild.innerHTML);

        wordsDefsDict[word.firstChild.innerHTML] = definition.firstChild.innerHTML;
    });
}

// Appel de la fonction.
makeDictionary();


var windowObjectReference = null;
var windowFeatures = "left=150,top=150,width=400,height=400";

// Open same window smaller for the game.
if (windowObjectReference == null || windowObjectReference.closed) {
    windowObjectReference = window.open(window.location.href, "quizletHack", windowFeatures);
}


setTimeout(function() {
    // Fetch game modes buttons.
    var gamesTiles = Array.from(windowObjectReference.document.querySelectorAll('.StudyModesNavItem'));

    // Add click listener to the tile of the "Match" game, then click on it.
    gamesTiles.forEach((tile) => {
        if (tile.children[1].firstChild.firstChild.firstChild.innerHTML === "Associer") {

            // Assert the button is receiving click by translating click to js event used by quizlet on their buttons.
            tile.addEventListener('click', () => {
                tile.dispatchEvent(new PointerEvent("pointerdown"));
            });

            tile.click();
        }
    })

}, 2000);


setTimeout(function() {
    // Fetch buttons that start the game.
    var startButtons = Array.from(windowObjectReference.document.querySelectorAll('.UIButton-wrapper'));

    startButtons.forEach((btn) => {
        //console.log(btn.parentNode);

        // Start game.
        btn.parentNode.click();

        //console.log("start match game");
    })

}, 5000);


setTimeout(function() {

    // Get tiles. (div with event listener on)
    var tiles = Array.from(windowObjectReference.document.querySelectorAll('.MatchModeQuestionGridTile'));

    // Add click listener to the tiles, to translate virtual click to js event.
    tiles.forEach((tile) => {
        tile.addEventListener('click', () => {
            tile.dispatchEvent(new PointerEvent("pointerdown"));
        });
    })

    // Match each tile.
    tiles.forEach((tile) => {
        var firstTileWithContent = tile.firstChild.firstChild;

        for (var key in wordsDefsDict) {
            // Return the value for the current key.
            var value = wordsDefsDict[key];

            // Find word for text in tile.
            if (firstTileWithContent.getAttribute('aria-label') === key) {
                //console.log("First click: " + key);
                tile.click();

                // Find corresponding tile.
                tiles.forEach((secondTile) => {
                    var secondTileWithContent = secondTile.firstChild.firstChild;

                    if (secondTileWithContent.getAttribute('aria-label') === value) {
                        //console.log("Second click: " + value);
                        secondTile.click();

                        // Wait security.
                        setTimeout(function() {
                            //console.log('after');
                        }, 500);
                    }
                })

                break;
            }
        }
    })


}, 5500);

