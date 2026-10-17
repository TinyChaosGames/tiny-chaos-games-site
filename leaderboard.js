"use strict";
(() => {
  const API = "https://one-more-pixel-online-staging.games-tinychaos.workers.dev/api/v1/test/leaderboard";
  const list = document.getElementById("ranking-entries");
  const status = document.getElementById("ranking-status");
  const refresh = document.getElementById("ranking-refresh");
  const updated = document.getElementById("ranking-updated");
  const tabs = Array.from(document.querySelectorAll("[data-ranking-difficulty]"));
  if (!list || !status || !refresh || !updated || tabs.length !== 3) return;
  const number = new Intl.NumberFormat("en-US");
  let difficulty = "easy", currentController = null, requestId = 0;
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
      message("No test scores yet.", "No active test players have scores in this difficulty.");
      return;
    }
    const fragment = document.createDocumentFragment();
    entries.slice(0, 100).forEach((entry, index) => {
      if (!entry || typeof entry !== "object") return;
      const score = Number(entry.score);
      if (!Number.isSafeInteger(score) || score < 0) return;
      const row = document.createElement("div");
      row.className = "ranking-entry";
      const rank = document.createElement("span");
      rank.className = "ranking-entry-rank";
      const position = Number(entry.position);
      rank.textContent = "#" + (Number.isSafeInteger(position) && position > 0 ? position : index + 1);
      const player = document.createElement("span");
      player.className = "ranking-entry-player";
      const pixelId = entry.pixel_id;
      player.textContent = typeof pixelId === "string" && pixelId.trim() ? pixelId.trim().slice(0, 64) : "TEST PLAYER #" + (index + 1);
      const points = document.createElement("span");
      points.className = "ranking-entry-score";
      points.textContent = number.format(score);
      row.append(rank, player, points);
      fragment.append(row);
    });
    if (!fragment.childNodes.length) message("No displayable scores.", "Please try again later.");
    else list.append(fragment);
  }
  function selectDifficulty(next) {
    if (!["easy", "normal", "hard"].includes(next)) return;
    difficulty = next;
    tabs.forEach(tab => {
      const selected = tab.dataset.rankingDifficulty === difficulty;
      tab.setAttribute("aria-selected", String(selected));
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
    status.textContent = "LOADING";
    updated.textContent = "Loading…";
    message("Loading leaderboard…", "Fetching public test scores.");
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const url = new URL(API);
      url.searchParams.set("difficulty", difficulty);
      url.searchParams.set("limit", "100");
      const response = await fetch(url.toString(), {method: "GET", mode: "cors", credentials: "omit", cache: "no-store", signal: controller.signal, headers: {"Accept": "application/json"}});
      if (!response.ok) throw new Error("HTTP " + response.status);
      const payload = await response.json();
      if (id !== requestId) return;
      const entries = entriesFrom(payload);
      if (!entries) throw new Error("Unexpected response format");
      render(entries);
      status.textContent = "LIVE TEST";
      updated.textContent = "Updated " + new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
    } catch (error) {
      if (id !== requestId) return;
      status.textContent = "UNAVAILABLE";
      updated.textContent = "Could not refresh";
      message("Leaderboard temporarily unavailable.", "Please try again later. These are not official scores.");
      if (!controller.signal.aborted) console.warn("Public leaderboard:", error instanceof Error ? error.message : "Request failed");
    } finally {
      clearTimeout(timeout);
      if (id === requestId) {currentController = null; refresh.disabled = false;}
    }
  }
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => selectDifficulty(tab.dataset.rankingDifficulty));
    tab.addEventListener("keydown", event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (i + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      tabs[next].focus();
      selectDifficulty(tabs[next].dataset.rankingDifficulty);
    });
  });
  refresh.addEventListener("click", load);
  load();
  window.setInterval(() => {if (!document.hidden && !currentController) load();}, 60000);
})();
