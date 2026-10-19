"use strict";
(() => {
  const translations = {
    pl: {
    heroDescShort:"Precyzja, rytm i kosmiczny pościg.",
    worldsIntroConcept:"Ten sam cel. Cztery różne doświadczenia — od FLOW AURORA po ekstremalny ARMAGEDDON.",
    easyConcept:"Spokojniejszy rytm, idealny na start. Naucz się precyzji i poczuj przepływ.",
    normalConcept:"Większa dynamika i kosmiczny pościg. Idealny balans wyzwania i płynności.",
    hardConcept:"Maksymalne wyzwanie w mrocznym kosmosie. Tylko dla najbardziej zdeterminowanych.",
    armageddonConcept:"Ekstremalna próba bez taryfy ulgowej. Pękające platformy i kosmiczna otchłań czekają od pierwszego skoku.",
    newMode:"NOWY TRYB",dailyTab:"DAILY",beatWinsTab:"BEAT WINS",dailyDate:"DZIEŃ (UTC)",winsCol:"WYGRANE",
    rankAlertTitle:"NIEZWERYFIKOWANE WYNIKI TESTOWE",
    rankAlertDesc:"To tymczasowy ranking dostępny w fazie testów. Wyniki mogą zostać zresetowane.",
    fullRanking:"ZOBACZ PEŁNY RANKING",collapseRanking:"ZWIŃ RANKING",allPlayers:"WSZYSCY",rankColShort:"#",
      skip:"Przejdź do treści",navGame:"O grze",navModes:"Tryby",navBoard:"Ranking",navContact:"Kontakt",
      heroOverline:"TINY CHAOS GAMES PREZENTUJE",heroTag:"JEDEN SKOK. JEDEN BŁĄD. JESZCZE JEDNA PRÓBA.",
      heroDesc:"Precyzja, rytm i kosmiczny pościg. Niewielki piksel, wielkie wyzwanie.",
      discover:"Poznaj grę",testRanking:"Ranking testowy",playStatus:"ONE MORE PIXEL jest obecnie w testach Google Play.",
      gameEyebrow:"01 / GRA",gameTitle:"Mały piksel. Duża precyzja.",
      gameDesc:"Przytrzymaj, by naładować skok. Puść, żeby wylądować na kolejnej platformie. Szukaj idealnego rytmu i pobij swój rekord.",
      feature1:"Precyzyjne lądowania",feature2:"Gorączka i serie",feature3:"Odłamki i kosmetyka",feature4:"Jeszcze jedna próba",
      worldsEyebrow:"02 / TRYBY GRY",worldsTitle:"CZTERY ŚWIATY. JEDNO WYZWANIE.",
      worldsIntro:"Ten sam cel. Cztery różne atmosfery. Wybierz swój kosmiczny rytm.",
      easyDesc:"Spokojniejszy rytm i turkusowe zorze. Dobry tryb na początek.",
      normalDesc:"Więcej dynamiki, magentowe smugi i rosnąca presja pościgu.",
      hardDesc:"Mroczny kosmos i ognista energia. Dla tych, którzy lubią wyzwania.",
      boardEyebrow:"03 / TESTY ONLINE",boardTitle:"GLOBALNY RANKING — TESTY",
      boardIntro:"Wyniki z testowej wersji ONE MORE PIXEL. Ranking jest niezweryfikowany i nie jest rankingiem oficjalnym.",
      boardHeader:"PUBLICZNY RANKING TESTOWY",rankCol:"MIEJSCE",playerCol:"GRACZ",scoreCol:"WYNIK",
      loadingBoard:"Ładowanie rankingu…",
      boardNote:"Wyniki są niezweryfikowane. Testerzy bez zgody na publikację aliasu są wyświetlani anonimowo. Wynik może zniknąć po usunięciu danych.",
      refresh:"Odśwież ↻",unverified:"TYLKO WYNIKI TESTOWE",
      challengeEyebrow:"04 / WYZWANIA",
      challengeDesc:"Wyślij znajomemu kod wyzwania. Ta sama trasa, te same zasady i tylko trzy próby na pobicie wyniku.",
      challengeNote:"Funkcja testowana wewnątrz gry. Wyzwania nie są uruchamiane z tej strony.",
      studioEyebrow:"05 / O NAS",
      studioDesc:"Małe niezależne studio, które lubi proste pomysły i dopracowaną rozgrywkę. ONE MORE PIXEL to nasz obecny projekt.",
      contact:"Napisz do nas",contactShort:"Kontakt",footerTag:"Małe gry. Duże wyzwania.",
      privacyEn:"Privacy Policy (EN)",privacyPl:"Polityka prywatności (PL)"
    },
    en: {
    heroDescShort:"Precision, rhythm and a cosmic chase.",
    worldsIntroConcept:"One goal. Four different experiences — from FLOW AURORA to the extreme ARMAGEDDON.",
    easyConcept:"A calmer rhythm, great for getting started. Learn precision and find your flow.",
    normalConcept:"More speed and a cosmic chase. A good balance of challenge and flow.",
    hardConcept:"The ultimate challenge in dark space. For the most determined players.",
    armageddonConcept:"An unforgiving cosmic challenge from the first jump. Fracturing platforms and a collapsing void await.",
    newMode:"NEW MODE",dailyTab:"DAILY",beatWinsTab:"BEAT WINS",dailyDate:"DAY (UTC)",winsCol:"WINS",
    rankAlertTitle:"UNVERIFIED TEST SCORES",
    rankAlertDesc:"This is a temporary test leaderboard. Scores may be reset.",
    fullRanking:"SEE FULL LEADERBOARD",collapseRanking:"COLLAPSE LEADERBOARD",allPlayers:"ALL",rankColShort:"#",
      skip:"Skip to content",navGame:"The game",navModes:"Modes",navBoard:"Leaderboard",navContact:"Contact",
      heroOverline:"TINY CHAOS GAMES PRESENTS",heroTag:"ONE JUMP. ONE MISTAKE. ONE MORE TRY.",
      heroDesc:"Precision, rhythm and a cosmic chase. One tiny pixel, one big challenge.",
      discover:"Discover the game",testRanking:"Test leaderboard",playStatus:"ONE MORE PIXEL is currently in Google Play testing.",
      gameEyebrow:"01 / THE GAME",gameTitle:"Small pixel. Big precision.",
      gameDesc:"Hold to charge your jump. Release to land on the next platform. Find the perfect rhythm and beat your best score.",
      feature1:"Perfect landings",feature2:"Fever and streaks",feature3:"Shards and cosmetics",feature4:"One more try",
      worldsEyebrow:"02 / GAME MODES",worldsTitle:"FOUR WORLDS. ONE CHALLENGE.",
      worldsIntro:"The same goal. Four distinct atmospheres. Pick your cosmic rhythm.",
      easyDesc:"Calmer rhythm and turquoise auroras. A good place to start.",
      normalDesc:"More energy, magenta trails and mounting chase pressure.",
      hardDesc:"Dark space and blazing energy. For players who want a challenge.",
      boardEyebrow:"03 / ONLINE TEST",boardTitle:"GLOBAL LEADERBOARD — TEST",
      boardIntro:"Scores from the ONE MORE PIXEL test build. Results are unverified and not an official ranking.",
      boardHeader:"PUBLIC TEST RANKINGS",rankCol:"RANK",playerCol:"PLAYER",scoreCol:"SCORE",
      loadingBoard:"Loading leaderboard…",
      boardNote:"Unverified test scores. Players without public alias consent appear anonymously. Scores can be removed when data is deleted.",
      refresh:"Refresh ↻",unverified:"UNVERIFIED TEST ONLY",
      challengeEyebrow:"04 / CHALLENGES",
      challengeDesc:"Share a challenge code with a friend. Same course, same rules — only three attempts to beat the score.",
      challengeNote:"This feature is being tested inside the game. Challenges cannot be started on this website.",
      studioEyebrow:"05 / STUDIO",
      studioDesc:"We're a small independent studio interested in simple ideas and polished gameplay. ONE MORE PIXEL is our current project.",
      contact:"Say hello",contactShort:"Contact",footerTag:"Small games. Big challenges.",
      privacyEn:"Privacy Policy (EN)",privacyPl:"Privacy Policy (PL)"
    }
  };
  function applyLanguage(lang) {
    if (!translations[lang]) return;
    document.documentElement.lang = lang;
    for (const node of document.querySelectorAll("[data-i18n]")) {
      const translated = translations[lang][node.dataset.i18n];
      if (translated !== undefined) node.textContent = translated;
    }
    document.querySelectorAll("[data-language]").forEach(button => button.setAttribute("aria-pressed",String(button.dataset.language === lang)));
    try { localStorage.setItem("tinychaos-language",lang); } catch (_) {}
    document.dispatchEvent(new CustomEvent("tinychaos:language", { detail: { language: lang } }));
  }
  const saved = (() => {try {return localStorage.getItem("tinychaos-language");} catch (_) {return null;}})();
  const initial = saved === "pl" || saved === "en" ? saved : "pl";
  document.querySelectorAll("[data-language]").forEach(button => button.addEventListener("click",() => applyLanguage(button.dataset.language)));
  document.querySelectorAll("[data-mode-link]").forEach(link => {
    link.addEventListener("click", () => {
      const difficulty = link.dataset.modeLink;
      const tab = Array.from(document.querySelectorAll("[data-ranking-difficulty]")).find(node => node.dataset.rankingDifficulty === difficulty);
      tab?.click();
    });
  });
  applyLanguage(initial);
})();
