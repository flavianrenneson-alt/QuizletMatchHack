(async () => {
  // ======= Dictionnaire pré-rempli (ton "term": "définition") =======
  const PREPOP = {
    "geduldig": "patient",
    "dynamisch": "dynamique",
    "nett": "gentil",
    "ruhig": "calme",
    "freundlich": "aimable",
    "hilfsbereit": "serviable",
    "sensibel": "sensible, susceptible",
    "launisch": "lunatique",
    "optimistisch": "optimiste (m/f)",
    "melancholisch": "mélancolique",
    "sportlich": "sportif",
    "ehrlich": "honnête",
    "erzählen": "raconter",
    "verstehen, versteht, verstand, hat verstanden": "comprendre",
    "zusammen": "ensemble",
    "sich langweilen, langweilte sich, hat sich gelangweilt": "s'ennuyer",
    "beide": "les deux",
    "die Geheimnisse": "les secrets",
    "Schach spielen": "jouer aux échecs",
    "die Strasse": "la rue",
    "sich auf jemanden verlassen": "compter sur qqn",
    "wollen": "vouloir",
    "fahren, fährt, fuhr, ist gefahren": "aller en véhicule",
    "studieren (hat studiert)": "faire des études",
    "sich gut verstehen": "bien s'entendre",
    "später": "plus tard"
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const triggerClick = el => {
    try { el.dispatchEvent(new PointerEvent('pointerdown', {bubbles:true})); } catch(e) {}
    try { el.click(); } catch(e) {}
  };

  // normalize : remove accents, parentheses, punctuation (keeps letters/numbers/space/'-)
  const normalize = s => {
    if (!s) return '';
    return String(s)
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')   // remove diacritics
      .replace(/\(.*?\)/g, '')                           // remove parenthesis contents
      .replace(/[^a-z0-9\s'-]/g, ' ')                    // keep basic chars
      .replace(/\s+/g, ' ')
      .trim();
  };

  // split possible alternatives in a key/value: "sensible, susceptible" -> ["sensible","susceptible"]
  const splitAlts = s => (s && String(s).split(/[\/,;|•]/).map(x => x.trim()).filter(Boolean)) || [];

  // --- essayer d'extraire dictionnaire depuis la page si possible (fallback) ---
  function collectTermNodes() {
    let words = Array.from(document.querySelectorAll('.SetPageTerm-wordText'));
    let defs  = Array.from(document.querySelectorAll('.SetPageTerm-definitionText'));
    return { words, defs };
  }
  function buildDictFromPage(wordsNodes, defsNodes) {
    const dict = {};
    const wtexts = wordsNodes.map(n => n && n.textContent ? n.textContent.trim() : '').filter(Boolean);
    const dtexts = defsNodes.map(n => n && n.textContent ? n.textContent.trim() : '').filter(Boolean);
    const n = Math.min(wtexts.length, dtexts.length);
    for (let i = 0; i < n; i++) dict[wtexts[i]] = dtexts[i];
    return dict;
  }

  // récupère les tuiles Match (fallbacks si classes changées)
  function getMatchTiles() {
    let tiles = Array.from(document.querySelectorAll('.MatchModeQuestionGridTile'));
    if (tiles.length === 0) {
      tiles = Array.from(document.querySelectorAll('[role="button"][aria-label], [aria-label]'));
      // on filtre un peu pour garder des éléments visibles et plausibles
      tiles = tiles.filter(el => el.getAttribute && el.getAttribute('aria-label'));
    }
    return tiles;
  }

  // label robuste d'une tuile
  function labelOf(tile) {
    if (!tile) return '';
    return (tile.getAttribute && tile.getAttribute('aria-label')) || tile.textContent || '';
  }

  try {
    console.log('Extraction du dictionnaire depuis la page (si possible)...');
    const { words, defs } = collectTermNodes();
    const pageDict = (words.length && defs.length) ? buildDictFromPage(words, defs) : {};
    console.log('Dictionnaire extrait de la page (exemples):', Object.entries(pageDict).slice(0,6));

    // fusion : PREPOP prend le dessus si même clé (tu voulais ton "term":"def" prioritaire)
    const merged = Object.assign({}, pageDict, PREPOP);
    console.log('Nombre total de paires à tenter :', Object.keys(merged).length);

    // attendre les tuiles du Match
    let tiles = [];
    const start = Date.now();
    while (Date.now() - start < 20000) {
      tiles = getMatchTiles();
      if (tiles.length >= 2) break;
      await sleep(300);
    }
    if (tiles.length < 2) throw new Error('Impossible de trouver les tuiles du jeu Match (vérifie que tu es en mode Match).');

    // construire map normalisée -> [tuile, tuile, ...]
    const tileMap = {};
    tiles.forEach(t => {
      const n = normalize(labelOf(t));
      if (!tileMap[n]) tileMap[n] = [];
      tileMap[n].push(t);
    });

    // fonction utilitaire : prendre une tuile depuis la map (shift)
    const takeTile = (norm) => {
      if (!tileMap[norm] || tileMap[norm].length === 0) return null;
      return tileMap[norm].shift();
    };

    // itérer sur les paires
    for (const [rawWord, rawDef] of Object.entries(merged)) {
      // essayer variantes du mot (ex: "verstehen, versteht, ..." -> plusieurs tentatives)
      const wordAlts = splitAlts(rawWord);
      const defAlts = splitAlts(rawDef);

      let firstTile = null;
      // 1) chercher correspondance exacte normalisée sur les variantes du mot
      for (const w of wordAlts) {
        const wn = normalize(w);
        if (!wn) continue;
        if (tileMap[wn] && tileMap[wn].length > 0) {
          firstTile = takeTile(wn);
          break;
        }
      }
      // 2) tentative tolérante (inclusion)
      if (!firstTile) {
        const target = normalize(rawWord);
        for (const key of Object.keys(tileMap)) {
          if (tileMap[key].length > 0 && (key.includes(target) || target.includes(key))) {
            firstTile = takeTile(key);
            break;
          }
        }
      }

      if (!firstTile) {
        console.warn('Aucune tuile trouvée pour le mot :', rawWord);
        continue; // passe à la paire suivante
      }

      triggerClick(firstTile);
      await sleep(130);

      // trouver tuile de la définition
      let secondTile = null;
      for (const d of defAlts) {
        const dn = normalize(d);
        if (!dn) continue;
        if (tileMap[dn] && tileMap[dn].length > 0) {
          secondTile = takeTile(dn);
          break;
        }
      }
      if (!secondTile) {
        const targetD = normalize(rawDef);
        for (const key of Object.keys(tileMap)) {
          if (tileMap[key].length > 0 && (key.includes(targetD) || targetD.includes(key))) {
            secondTile = takeTile(key);
            break;
          }
        }
      }
      // fallback : prendre n'importe quelle tuile restante
      if (!secondTile) {
        for (const key of Object.keys(tileMap)) {
          if (tileMap[key].length > 0) { secondTile = takeTile(key); break; }
        }
      }

      if (!secondTile) {
        console.warn('Aucune tuile restante pour la définition de:', rawWord, 'attendue:', rawDef);
        continue;
      }

      triggerClick(secondTile);
      await sleep(220);
      console.log('Pairée :', rawWord, '->', rawDef);
    }

    console.log('Terminé : script a essayé toutes les paires du dictionnaire pré-rempli + page.');
  } catch (e) {
    console.error('Erreur:', e && e.message ? e.message : e);
  }
})();
