"use strict";
(() => {
  const API = "https://one-more-pixel-online-staging.games-tinychaos.workers.dev/api/v1/test/leaderboard";
  const list = document.getElementById("ranking-entries");
  const status = document.getElementById("ranking-status");
  const refresh = document.getElementById("ranking-refresh");
  const updated = document.getElementById("ranking-updated");
  if (!list || !status || !refresh || !updated) return;

  const number = new Intl.NumberFormat("en-US");
  let active = false;
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
  function safeEntries(payload) {
    if (Array.isArray(payload?.entries)) return payload.entries;
    if (Array.isArray(payload?.leaderboard?.entries)) return payload.leaderboard.entries;
    if (Array.isArray(payload?.data?.entries)) return payload.data.entries;
    return null;
  }
  function render(entries) {
    list.replaceChildren();
    if (!entries.length) {
      message("No public test scores yet.", "Only players who opted in to this test leaderboard appear here. Check back later.");
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
      const position = Number(entry.position ?? entry.rank);
      rank.textContent = "#" + (Number.isSafeInteger(position) && position > 0 ? position : index + 1);
      const alias = document.createElement("span");
      alias.className = "ranking-entry-player";
      const candidate = entry.public_alias ?? entry.player_alias ?? entry.display_name ?? entry.nickname ?? entry.alias ?? entry.name;
      alias.textContent = typeof candidate === "string" && candidate.trim() ? candidate.trim().slice(0, 64) : "Player";
      const points = document.createElement("span");
      points.className = "ranking-entry-score";
      points.textContent = number.format(score);
      row.append(rank, alias, points);
      fragment.append(row);
    });
    if (!fragment.childNodes.length) {
      message("No public test scores yet.", "The API returned no displayable scores.");
      return;
    }
    list.append(fragment);
  }
  async function load() {
    if (active) return;
    active = true;
    refresh.disabled = true;
    status.textContent = "LOADING";
    message("Loading leaderboard…", "Fetching public test results.");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const url = new URL(API);
      url.searchParams.set("difficulty", "EASY");
      url.searchParams.set("limit", "100");
      const response = await fetch(url.toString(), {method: "GET", mode: "cors", credentials: "omit", cache: "no-store", signal: controller.signal, headers: {"Accept": "application/json"}});
      if (!response.ok) throw new Error("HTTP " + response.status);
      const payload = await response.json();
      const entries = safeEntries(payload);
      if (!entries) throw new Error("Unexpected response");
      render(entries);
      status.textContent = "LIVE TEST";
      updated.textContent = "Updated " + new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"});
    } catch (error) {
      status.textContent = "UNAVAILABLE";
      updated.textContent = "Could not refresh";
      message("Leaderboard temporarily unavailable.", "Please try again later. Test scores are not official rankings.");
      console.warn("Public test leaderboard:", error instanceof Error ? error.message : "Request failed");
    } finally {
      clearTimeout(timeout);
      active = false;
      refresh.disabled = false;
    }
  }
  refresh.addEventListener("click", load);
  load();
  window.setInterval(() => { if (!document.hidden) load(); }, 60000);
})();
