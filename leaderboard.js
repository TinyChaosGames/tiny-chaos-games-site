"use strict";
/*
 * Public, read-only preview. No staging tokens or player credentials.
 * Enable only after the curated endpoint is deployed and reviewed.
 * Endpoint contract: { visibility: "PUBLIC_SELECTED_TEST", entries: [
 *   { rank: 1, display_name: "Player", score: 1200 }
 * ] }.
 */
(() => {
  const PUBLIC_FEED_URL = ""; // Set to the HTTPS public curated-feed endpoint after deployment.
  const MAX_ROWS = 25;
  const entriesElement = document.getElementById("test-ranking-entries");
  const stateElement = document.getElementById("test-ranking-state");
  const refreshButton = document.getElementById("test-ranking-refresh");
  if (!entriesElement || !stateElement || !refreshButton) return;

  function message(heading, detail) {
    entriesElement.hidden = true;
    entriesElement.replaceChildren();
    stateElement.hidden = false;
    stateElement.replaceChildren();
    const title = document.createElement("h3");
    const description = document.createElement("p");
    title.textContent = heading;
    description.textContent = detail;
    stateElement.append(title, description);
  }

  async function loadScores() {
    if (!PUBLIC_FEED_URL) {
      message("Test leaderboard is not available yet.", "Selected test results will appear here after the public read-only feed is enabled.");
      return;
    }
    refreshButton.hidden = false;
    refreshButton.disabled = true;
    message("Loading selected test scores…", "Please wait.");
    try {
      const response = await fetch(PUBLIC_FEED_URL, {
        method: "GET", mode: "cors", credentials: "omit", cache: "no-store",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("Feed unavailable");
      const data = await response.json();
      if (!data || data.visibility !== "PUBLIC_SELECTED_TEST" || !Array.isArray(data.entries)) throw new Error("Unexpected feed");
      entriesElement.replaceChildren();
      const uniqueRanks = new Set();
      for (const entry of data.entries.slice(0, MAX_ROWS)) {
        if (!entry || !Number.isSafeInteger(entry.rank) || entry.rank < 1 || uniqueRanks.has(entry.rank)) continue;
        if (typeof entry.display_name !== "string" || !entry.display_name.trim()) continue;
        if (typeof entry.score !== "number" || !Number.isSafeInteger(entry.score) || entry.score < 0) continue;
        uniqueRanks.add(entry.rank);
        const item = document.createElement("li");
        item.className = "ranking-entry";
        const rank = document.createElement("span"); rank.className = "ranking-rank"; rank.textContent = "#" + entry.rank;
        const name = document.createElement("strong"); name.textContent = entry.display_name.slice(0, 40);
        const score = document.createElement("span"); score.className = "ranking-score"; score.textContent = entry.score.toLocaleString("en-US");
        item.append(rank, name, score);
        entriesElement.append(item);
      }
      if (!entriesElement.children.length) {
        message("No test scores published yet.", "Only results approved for display will be listed here.");
      } else {
        stateElement.hidden = true;
        entriesElement.hidden = false;
      }
    } catch (_) {
      message("Test leaderboard is temporarily unavailable.", "Please try again later.");
    } finally {
      refreshButton.disabled = false;
    }
  }

  refreshButton.addEventListener("click", loadScores);
  loadScores();
})();
