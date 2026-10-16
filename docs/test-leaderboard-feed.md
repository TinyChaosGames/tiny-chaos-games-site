# Selected test leaderboard feed

The website runs on GitHub Pages and **must not** contain staging session tokens, admin secrets, tester bearer tokens or D1 credentials.

## Intended read-only feed

Deploy a separate public HTTPS endpoint, for example `GET https://api.tinychaosgames.pl/api/v1/public/test-leaderboard`. This is an **example route, not a live endpoint**. The route must not reuse the protected staging API or make `/api/v1/leaderboard` public.

Return a small, curated, cached JSON payload:

```json
{
  "visibility": "PUBLIC_SELECTED_TEST",
  "entries": [
    { "rank": 1, "display_name": "Example nickname", "score": 1234 }
  ]
}
```

Example data above is contract documentation, **not a real ranking**.

## Backend rules

1. Separate publishing from raw test leaderboard storage: a server-controlled allowlist / approved snapshot. **Default: no published rows.** Only publish selected run IDs or an explicitly reviewed snapshot; do not auto-publish all staging runs.
2. Require suitable consent before displaying a tester's chosen public alias; avoid personal details and any identifying access/session IDs. Respect removal/revocation requests.
3. Keep `authenticateStaging`, staging session issuance and revocation unchanged. This public route must be implemented as isolated read-only logic; it must not allow writes or leak staging credentials.
4. If creating a separate public Worker, grant it access only to the curated snapshot/store, not the raw staging database. Restrict CORS to `https://tinychaosgames.pl` and optionally `https://www.tinychaosgames.pl`. CORS is not an authorization mechanism.
5. Rate limit, cache and size-limit the feed; return only rank, public alias and score; no player IDs, session info, tokens, IP addresses, integrity metadata or raw replay data.
6. Mark all responses `visibility: "PUBLIC_SELECTED_TEST"` and clearly label the web UI as **unverified test data**. Never relabel `UNVERIFIED_TEST_ONLY` runs as `VERIFIED`.
7. Test empty state, revocation, CORS, invalid JSON, worker downtime and small/mobile screens; review the privacy policy before public exposure.

## Website activation

Once the feed exists, replace `PUBLIC_FEED_URL = ""` in `leaderboard.js` with the verified HTTPS feed URL. Test on a branch before merging into `main`. The current version intentionally fails closed and does **not** attempt to contact protected staging.
