"use strict";
(() => {
  // Public staging leaderboard: only position, public/anonymous pixel_id and score.
  const API = "https://one-more-pixel-online-staging.games-tinychaos.workers.dev/api/v1/test/leaderboard";
  const list = document.getElementById("ranking-entries");
  const status = document.getElementById("ranking-status");
  const refresh = document.getElementById("ranking-refresh");
  const updated = document.getElementById("ranking-updated");
  const tabs = Array.from(document.querySelectorAll("[data-ranking-difficulty]"));
  if (!list || !status || !refresh || !updated || tabs.length !== 3) return;

  const copy = {
    pl: {loading:"ŁADOWANIE",loadingHeading:"Ładowanie rankingu…",loadingBody:"Pobieranie wyników testowych.",
      empty:"Brak wyników testowych.",emptyBody:"W tym trybie nie ma jeszcze wyników aktywnych testerów.",
      noDisplay:"Brak wyników do wyświetlenia.",tryLater:"Spróbuj ponownie później.",
      unavailable:"NIEDOSTĘPNY",unavailableHeading:"Ranking chwilowo niedostępny.",
      unavailableBody:"Spróbuj ponownie później. To nie są oficjalne wyniki.",couldNotRefresh:"Nie udało się odświeżyć",
      live:"TEST NA ŻYWO",updated:"Aktualizacja",anonymous:"TEST PLAYER #"},
    en: {loading:"LOADING",loadingHeading:"Loading leaderboard…",loadingBody:"Fetching public test scores.",
      empty:"No test scores yet.",emptyBody:"No active test players have scores in this difficulty.",
      noDisplay:"No displayable scores.",tryLater:"Please try again later.",
      unavailable:"UNAVAILABLE",unavailableHeading:"Leaderboard temporarily unavailable.",
      unavailableBody:"Please try again later. These are not official scores.",couldNotRefresh:"Could not refresh",
      live:"LIVE TEST",updated:"Updated",anonymous:"TEST PLAYER #"}
  };
  const number = new Intl.NumberFormat("en-US");
  let difficulty = "easy", currentController = null, requestId = 0, lastState = "loading", lastEntries = [], lastUpdated = null;
  let lang = document.documentElement.lang === "en" ? "en" : "pl";
  const t = key => copy[lang][key];
  function message(title, description) {
    list.replaceChildren();
    const wrap = document.createElement("div");
    wrap.className = "ranking-placeholder";
    const heading = document.createElement("h3");
    heading.textContent = title;
    const paragraph = document.createElement("p");
    paragraph.textContent = description;
    wrap.append(heading, paragraph);
    list.append(wrap);
  }
  function entriesFrom(payload) {
    if (Array.isArray(payload?.entries)) return payload.entries;
    if (Array.isArray(payload?.leaderboard?.entries)) return payload.leaderboard.entries;
    if (Array.isArray(payload?.data?.entries)) return payload.data.entries;
    return null;
  }
  function render(entries) {
    list.replaceChildren();
    if (!entries.length) {
      message(t("empty"), t("emptyBody"));
      return;
    }
    const fragment = document.createDocumentFragment();
    entries.slice(0, 100).forEach((entry,index) => {
      if (!entry || typeof entry !== "object") return;
      const score = Number(entry.score);
      if (!Number.isSafeInteger(score) || score < 0) return;
      const row = document.createElement("div"); row.className = "ranking-entry";
      const rank = document.createElement("span"); rank.className = "ranking-entry-rank";
      const position = Number(entry.position);
      rank.textContent = "#" + (Number.isSafeInteger(position) && position > 0 ? position : index + 1);
      const player = document.createElement("span"); player.className = "ranking-entry-player";
      const pixelId = entry.pixel_id;
      player.textContent = typeof pixelId === "string" && pixelId.trim() ? pixelId.trim().slice(0,64) : t("anonymous") + (index + 1);
      const points = document.createElement("span"); points.className = "ranking-entry-score";
      points.textContent = number.format(score);
      row.append(rank,player,points);
      fragment.append(row);
    });
    if (!fragment.childNodes.length) message(t("noDisplay"),t("tryLater"));
    else list.append(fragment);
  }
  function paintState() {
    if (lastState === "loading") {
      status.textContent = t("loading");updated.textContent = t("loadingHeading");
      message(t("loadingHeading"),t("loadingBody"));
    } else if (lastState === "unavailable") {
      status.textContent = t("unavailable");updated.textContent = t("couldNotRefresh");
      message(t("unavailableHeading"),t("unavailableBody"));
    } else {
      status.textContent = t("live");
      updated.textContent = t("updated") + " " + (lastUpdated || new Date()).toLocaleTimeString(lang === "pl" ? "pl-PL":"en-US",{hour:"2-digit",minute:"2-digit"});
      render(lastEntries);
    }
  }
  function selectDifficulty(next) {
    if (!["easy","normal","hard"].includes(next)) return;
    difficulty = next;
    tabs.forEach(tab => {
      const selected = tab.dataset.rankingDifficulty === difficulty;
      tab.setAttribute("aria-selected",String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    load();
  }
  async function load() {
    currentController?.abort();
    const controller = new AbortController();
    currentController = controller;
    const id = ++requestId;
    refresh.disabled = true;
    lastState = "loading"; paintState();
    const timeout = setTimeout(() => controller.abort(),10000);
    try {
      const url = new URL(API);
      url.searchParams.set("difficulty",difficulty);
      url.searchParams.set("limit","100");
      const response = await fetch(url.toString(),{method:"GET",mode:"cors",credentials:"omit",cache:"no-store",signal:controller.signal,headers:{"Accept":"application/json"}});
      if (!response.ok) throw new Error("HTTP " + response.status);
      const payload = await response.json();
      if (id !== requestId) return;
      const entries = entriesFrom(payload);
      if (!entries) throw new Error("Unexpected response format");
      lastEntries = entries;lastUpdated = new Date();lastState = "ready";paintState();
    } catch (error) {
      if (id !== requestId) return;
      lastState = "unavailable";paintState();
      if (!controller.signal.aborted) console.warn("Public leaderboard:",error instanceof Error ? error.message : "Request failed");
    } finally {
      clearTimeout(timeout);
      if (id === requestId) {currentController = null;refresh.disabled = false;}
    }
  }
  tabs.forEach((tab,i) => {
    tab.addEventListener("click",() => selectDifficulty(tab.dataset.rankingDifficulty));
    tab.addEventListener("keydown", event => {
      if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (i + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();selectDifficulty(tabs[next].dataset.rankingDifficulty);
    });
  });
  refresh.addEventListener("click",load);
  document.addEventListener("tinychaos:language", event => {
    lang = event.detail?.language === "en" ? "en" : "pl";
    if (!currentController) paintState();
  });
  load();
  window.setInterval(() => {if (!document.hidden && !currentController) load();},60000);
})();
