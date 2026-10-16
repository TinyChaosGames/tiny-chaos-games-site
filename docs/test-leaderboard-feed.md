# Public test leaderboard feed

The website reads a **separate, public, read-only feed** from:

`GET /api/v1/public/test-leaderboard`

on `one-more-pixel-online-staging.games-tinychaos.workers.dev`.

This route is **proposed and not yet implemented in the Cloudflare Worker**. The website shows a clear unavailable state until the route is live. Do not merge the site PR just to remove the unavailable message.

## Do not touch the protected staging API

The existing `/api/v1/leaderboard` route must continue to require a staging session. Never add staging access tokens, session IDs, provisioning secrets, or player authorization tokens to GitHub Pages, JavaScript, HTML, or public Worker responses. Avoid a general-purpose proxy to the protected staging API.

## Proposed backend behavior

1. Use a **separate publication allowlist** (e.g. D1 table `public_test_leaderboard_approvals`) keyed by exact leaderboard entry/run ID, difficulty and rules version, with operator approval timestamp. Do not publish automatically from all staging records.
2. Require explicit consent before publicly displaying tester aliases and scores (including minors: apply the game's age/guardian policy). Keep the feed unpublished by default. Allow withdrawal and deletion.
3. At request time join only approved, non-deleted players and entries. Keep `UNVERIFIED_TEST_ONLY` rows distinct from `VERIFIED` production results. An admin approval means permission to display a **test** record; it is **not** gameplay verification.
4. Select and sanitize only display rank, public display name, score, difficulty label and publication timestamp. No IDs, IP addresses, access secrets, device IDs, emails, session metadata or raw run data.
5. Rate-limit/cache the public read route; limit each difficulty board to 25 entries and avoid expensive joins per visitor. Use `Access-Control-Allow-Origin: https://tinychaosgames.pl` (and the appropriate `www` origin if used), `Vary: Origin`, and only `GET`/`HEAD` methods. Never grant CORS to the protected staging endpoints.
6. Ensure that the public route handles only GET/HEAD and does not bypass the existing staging protection for any other path. Prefer serving a separately generated approved JSON snapshot (D1 or KV) rather than relaxing `authenticateStaging` for the protected staging API.
7. Only publish after the existing privacy notice and tester consent flow are updated to cover public names and scores.

## Required response schema

HTTP 200, `Content-Type: application/json`:

```json
{
  "visibility": "PUBLIC_APPROVED_TEST_ONLY",
  "published": true,
  "published_at": "2026-10-16T12:00:00Z",
  "boards": [
    {
      "difficulty_id": "example",
      "label": "Example difficulty",
      "entries": [
        { "rank": 1, "display_name": "ConsentingTester", "score": 100 }
      ]
    }
  ]
}
```

The example above documents a schema, **not actual player data**. If the feed is not approved or not enabled, return 404/503 and do not leak staging rows. The website intentionally does not show the schema's example score.

## Before merging

- Implement and test the public feed in the local ONE MORE PIXEL backend project.
- Confirm the existing protected leaderboard still returns 403 without a staging session.
- Confirm unapproved/deleted players never appear in the public feed.
- Confirm the feed exposes no authentication data, and rejects writes.
- Test CORS from `https://tinychaosgames.pl` and verify the EN/PL privacy URLs still work.
- Check mobile rendering, API errors and missing-data state.
