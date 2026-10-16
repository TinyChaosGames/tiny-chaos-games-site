"use strict";
/* This page reads an explicitly approved, public test-only feed.
 * No staging session credentials or player tokens belong in this file.
 */
(() => {
  const URL = "https://one-more-pixel-online-staging.games-tinychaos.workers.dev/api/v1/public/test-leaderboard";
  const status = document.getElementById("ranking-status");
  const entries = document.getElementById("ranking-entries");
  const select = document.getElementById("ranking-mode");
  const refresh = document.getElementById("ranking-refresh");
  const updated = document.getElementById("ranking-updated");
  if (!status || !entries || !select || !refresh || !updated) return;

  let boards = [];
  let lastUpdated = "";
  let requestId = 0;

  function message(title, detail) {
    status.hidden = false;
    status.replaceChildren();
    const icon = document.createElement("span");
    icon.className = "empty-trophy";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "♛";
    const heading = document.createElement("h3");
    heading.textContent = title;
    const paragraph = document.createElement("p");
    paragraph.textContent = detail;
    status.append(icon, heading, paragraph);
    entries.hidden = true;
    entries.replaceChildren();
  }

  function validRow(row) {
    return row && Number.isInteger(row.rank) && row.rank >= 1 &&
      typeof row.display_name === "string" && row.display_name.trim().length > 0 &&
      row.display_name.length <= 48 && Number.isSafeInteger(row.score) && row.score >= 0;
  }

  function displayBoard() {
    const board = boards.find(b => b.difficulty_id === select.value);
    entries.replaceChildren();
    if (!board || !board.entries.length) {
      message("No approved scores yet.", "This difficulty has no results selected for public display.");
      return;
    }
    status.hidden = true;
    for (const row of board.entries.slice(0, 25)) {
      const li = document.createElement("li");
      const rank = document.createElement("span");
      rank.className = "rank-number";
      rank.textContent = "#" + row.rank;
      const name = document.createElement("span");
      name.className = "player-name";
      name.textContent = row.display_name;
      const score = document.createElement("span");
      score.className = "score-number";
      score.textContent = row.score.toLocaleString("en-US");
      li.append(rank, name, score);
      entries.append(li);
    }
    entries.hidden = false;
    updated.textContent = lastUpdated ? "Published " + lastUpdated : "Approved test results";
  }

  async function load() {
    const ownRequest = ++requestId;
    refresh.disabled = true;
    updated.textContent = "Loading…";
    try {
      const response = await fetch(URL, {
        method: "GET",
        mode: "cors",
        credentials: "omit",
        cache: "no-store",
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("Feed unavailable");
      const payload = await response.json();
      if (ownRequest !== requestId) return;
      // Reject staging-private or unreviewed responses even if a route is misconfigured.
      if (!payload || payload.visibility !== "PUBLIC_APPROVED_TEST_ONLY" ||
          payload.published !== true || !Array.isArray(payload.boards)) {
        throw new Error("Feed not approved");
      }
      const nextBoards = payload.boards.filter(board =>
        board && typeof board.difficulty_id === "string" &&
        /^[a-z0-9_-]{1,32}$/.test(board.difficulty_id) &&
        typeof board.label === "string" && board.label.length <= 40 &&
        Array.isArray(board.entries) && board.entries.length <= 25 &&
        board.entries.every(validRow)
      ).slice(0, 12);
      boards = nextBoards;
      const current = select.value;
      select.replaceChildren();
      for (const board of boards) {
        const option = document.createElement("option");
        option.value = board.difficulty_id;
        option.textContent = board.label;
        select.append(option);
      }
      select.disabled = !boards.length;
      if (!boards.length) {
        message("No approved scores yet.", "Test results will appear once they have been selected for public display.");
        updated.textContent = "Waiting for approved data";
      } else {
        if (boards.some(b => b.difficulty_id === current)) select.value = current;
        lastUpdated = typeof payload.published_at === "string" && /^\\d{4}-\\d{2}-\\d{2}T/.test(payload.published_at)
          ? payload.published_at.slice(0, 10) : "";
        displayBoard();
      }
    } catch (_) {
      if (ownRequest !== requestId) return;
      boards = [];
      select.disabled = true;
      select.replaceChildren();
      const option = document.createElement("option");
      option.textContent = "Not available";
      select.append(option);
      message("Test ranking is not public yet.", "Approved results are not available right now. Try again later.");
      updated.textContent = "Feed offline or not published";
    } finally {
      if (ownRequest === requestId) refresh.disabled = false;
    }
  }

  refresh.addEventListener("click", load);
  select.addEventListener("change", displayBoard);
  load();
})();
