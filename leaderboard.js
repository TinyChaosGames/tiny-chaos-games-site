"use strict";
(() => {
  // Build039: read-only PUBLIC TEST endpoints. Daily and wins are separate rankings,
  // never compared against normal difficulty scores.
  const ROOT = "https://one-more-pixel-online-staging.games-tinychaos.workers.dev/api/v1/test";
  const modes = ["easy", "normal", "hard", "armageddon"];
  const categories = ["all", ...modes, "daily", "wins"];
  const list = document.getElementById("ranking-entries");
  const status = document.getElementById("ranking-status");
  const refresh = document.getElementById("ranking-refresh");
  const updated = document.getElementById("ranking-updated");
  const expand = document.getElementById("ranking-expand");
  const dateFilter = document.getElementById("ranking-date-filter");
  const dateInput = document.getElementById("ranking-date");
  const valueHeading = document.getElementById("ranking-value-heading");
  const tabs = [...document.querySelectorAll("[data-ranking-difficulty]")];
  if (!list || !status || !refresh || !updated || !expand || !dateFilter || !dateInput || !valueHeading || tabs.length !== categories.length) return;

  const labels = {
    pl: {
      loading: "ŁADOWANIE", loadingTitle: "Ładowanie rankingu…", loadingBody: "Pobieranie wyników testowych.",
      emptyTitle: "Brak wyników testowych.", emptyBody: "Nie ma jeszcze aktywnych wyników w tej kategorii.",
      badTitle: "Brak poprawnych wyników.", badBody: "Spróbuj ponownie później.",
      unavailable: "NIEDOSTĘPNY", unavailableTitle: "Ranking chwilowo niedostępny.",
      unavailableBody: "Spróbuj ponownie później. To nie są oficjalne wyniki.",
      retry: "Nie udało się odświeżyć", live: "TEST NA ŻYWO", updated: "Aktualizacja",
      anonymous: "TEST PLAYER #", full: "ZOBACZ PEŁNY RANKING", collapse: "ZWIŃ RANKING",
      mixed: "Oddzielne klasyfikacje dla czterech trybów. Daily i Beat Wins mają własne zakładki.",
      scoreHeader: "WYNIK", winsHeader: "WYGRANE"
    },
    en: {
      loading: "LOADING", loadingTitle: "Loading leaderboard…", loadingBody: "Fetching public test scores.",
      emptyTitle: "No test scores yet.", emptyBody: "No active scores in this category.",
      badTitle: "No displayable scores.", badBody: "Please try again later.",
      unavailable: "UNAVAILABLE", unavailableTitle: "Leaderboard temporarily unavailable.",
      unavailableBody: "Please try again later. These are not official scores.",
      retry: "Could not refresh", live: "LIVE TEST", updated: "Updated",
      anonymous: "TEST PLAYER #", full: "SEE FULL LEADERBOARD", collapse: "COLLAPSE LEADERBOARD",
      mixed: "Four separate mode rankings. Daily and Beat Wins are in their own tabs.",
      scoreHeader: "SCORE", winsHeader: "WINS"
    }
  };
  let lang = document.documentElement.lang === "en" ? "en" : "pl";
  let selected = "all";
  let expanded = false;
  let controller = null;
  let requestId = 0;
  let state = "loading";
  let records = Object.create(null);
  let updatedAt = null;
  const t = key => labels[lang][key];
  const utcToday = () => new Date().toISOString().slice(0, 10);
  dateInput.value = utcToday();
  dateInput.max = utcToday();

  function placeholder(title, description) {
    list.replaceChildren();
    const box = document.createElement("div");
    box.className = "ranking-placeholder";
    const h = document.createElement("h3");
    h.textContent = title;
    const p = document.createElement("p");
    p.textContent = description;
    box.append(h, p);
    list.append(box);
  }
  function entriesFrom(payload) {
    if (Array.isArray(payload?.entries)) return payload.entries;
    if (Array.isArray(payload?.leaderboard?.entries)) return payload.leaderboard.entries;
    if (Array.isArray(payload?.data?.entries)) return payload.data.entries;
    return null;
  }
  function appendRow(target, entry, index, category) {
    if (!entry || typeof entry !== "object") return;
    const score = Number(category === "wins" ? entry.wins : entry.score);
    if (!Number.isSafeInteger(score) || score < 0) return;
    const reportedRank = Number(entry.rank ?? entry.position);
    const rank = Number.isSafeInteger(reportedRank) && reportedRank > 0 ? reportedRank : index + 1;
    const row = document.createElement("div");
    row.className = "ranking-entry";
    const number = document.createElement("span");
    number.className = "ranking-entry-rank";
    number.textContent = "#" + rank;
    const player = document.createElement("span");
    player.className = "ranking-entry-player";
    const alias = entry.display_name ?? entry.pixel_id;
    player.textContent = typeof alias === "string" && alias.trim() ? alias.trim().slice(0, 64) : t("anonymous") + (index + 1);
    const points = document.createElement("span");
    points.className = "ranking-entry-score";
    points.textContent = new Intl.NumberFormat(lang === "pl" ? "pl-PL" : "en-US").format(score);
    row.append(number, player, points);
    target.append(row);
  }
  function render() {
    list.replaceChildren();
    const fragment = document.createDocumentFragment();
    if (selected === "all") {
      const info = document.createElement("div");
      info.className = "ranking-group-note";
      info.textContent = t("mixed");
      fragment.append(info);
      for (const mode of modes) {
        const rows = records[mode] || [];
        const heading = document.createElement("div");
        heading.className = "ranking-group-label";
        heading.textContent = mode.toUpperCase();
        fragment.append(heading);
        rows.slice(0, expanded ? 100 : 2).forEach((entry, index) => appendRow(fragment, entry, index, mode));
        if (!rows.length) {
          const empty = document.createElement("div");
          empty.className = "ranking-group-empty";
          empty.textContent = t("emptyTitle");
          fragment.append(empty);
        }
      }
    } else {
      const rows = records[selected] || [];
      rows.slice(0, expanded ? 100 : 5).forEach((entry, index) => appendRow(fragment, entry, index, selected));
    }
    if (fragment.childNodes.length) list.append(fragment);
    else placeholder(t("emptyTitle"), t("emptyBody"));
  }
  function paint() {
    const wins = selected === "wins";
    dateFilter.hidden = selected !== "daily";
    valueHeading.dataset.i18n = wins ? "winsCol" : "scoreCol";
    valueHeading.textContent = wins ? t("winsHeader") : t("scoreHeader");
    expand.textContent = expanded ? t("collapse") : t("full");
    expand.setAttribute("aria-expanded", String(expanded));
    expand.dataset.i18n = expanded ? "collapseRanking" : "fullRanking";
    if (state === "loading") {
      status.textContent = t("loading");
      updated.textContent = t("loadingTitle");
      placeholder(t("loadingTitle"), t("loadingBody"));
    } else if (state === "error") {
      status.textContent = t("unavailable");
      updated.textContent = t("retry");
      placeholder(t("unavailableTitle"), t("unavailableBody"));
    } else {
      status.textContent = t("live");
      updated.textContent = t("updated") + " " + (updatedAt || new Date()).toLocaleTimeString(lang === "pl" ? "pl-PL" : "en-US", {hour: "2-digit", minute: "2-digit"});
      render();
    }
  }
  async function fetchCategory(category, signal) {
    let path;
    if (modes.includes(category)) path = "/leaderboard";
    else if (category === "daily") path = "/daily/leaderboard";
    else if (category === "wins") path = "/beat-my-pixel/wins/leaderboard";
    else throw new Error("Unknown leaderboard category");
    const url = new URL(ROOT + path);
    url.searchParams.set("limit", "100");
    if (modes.includes(category)) url.searchParams.set("difficulty", category);
    if (category === "daily") url.searchParams.set("date", dateInput.value);
    const response = await fetch(url.toString(), {
      method: "GET", mode: "cors", credentials: "omit",
      cache: "no-store", signal, headers: {"Accept": "application/json"}
    });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const payload = await response.json();
    if (payload?.production_eligible === true || (payload?.verification_status && payload.verification_status !== "UNVERIFIED_TEST_ONLY"))
      throw new Error("Unexpected verification status");
    const rows = entriesFrom(payload);
    if (!rows) throw new Error("Unexpected response format");
    return rows;
  }
  async function load() {
    controller?.abort();
    const own = new AbortController();
    controller = own;
    const id = ++requestId;
    state = "loading";
    refresh.disabled = true;
    paint();
    const timeout = setTimeout(() => own.abort(), 10000);
    try {
      const requested = selected === "all" ? modes : [selected];
      const results = await Promise.all(requested.map(category => fetchCategory(category, own.signal)));
      if (id !== requestId) return;
      requested.forEach((category, index) => { records[category] = results[index]; });
      state = "ready";
      updatedAt = new Date();
      paint();
    } catch (error) {
      if (id !== requestId) return;
      state = "error";
      paint();
      if (!own.signal.aborted) console.warn("Public test leaderboard:", error instanceof Error ? error.message : "Request failed");
    } finally {
      clearTimeout(timeout);
      if (id === requestId) {
        controller = null;
        refresh.disabled = false;
      }
    }
  }
  function selectCategory(category) {
    if (!categories.includes(category)) return;
    selected = category;
    expanded = false;
    for (const tab of tabs) {
      const active = tab.dataset.rankingDifficulty === category;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    }
    load();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => selectCategory(tab.dataset.rankingDifficulty));
    tab.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 :
        (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      selectCategory(tabs[next].dataset.rankingDifficulty);
    });
  });
  dateInput.addEventListener("change", () => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateInput.value) || dateInput.value > utcToday()) {
      dateInput.value = utcToday();
    }
    if (selected === "daily") load();
  });
  refresh.addEventListener("click", () => {
    dateInput.max = utcToday();
    load();
  });
  expand.addEventListener("click", () => {
    expanded = !expanded;
    paint();
    if (expanded) list.scrollTop = 0;
  });
  document.addEventListener("tinychaos:language", event => {
    lang = event.detail?.language === "en" ? "en" : "pl";
    paint();
  });
  load();
  window.setInterval(() => {
    if (!document.hidden && !controller) {
      dateInput.max = utcToday();
      load();
    }
  }, 60000);
})();
