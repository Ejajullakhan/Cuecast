# CueCast — conversational movie discovery with MCP

CueCast is a hackathon prototype for the Amazon Developer Build, Ship, Shape hackathon (Alexa+ track). It helps people turn a natural-language viewing request into a shortlist, inspect title details, and save a pick to a watchlist. Its central demonstration is a visible, inspectable Model Context Protocol (MCP) tool boundary.

## What works in this prototype

- A responsive dashboard with conversational prompts, title cards, details, a watchlist, and a short architecture walkthrough.
- An Express MCP endpoint at `POST /mcp` with JSON-RPC methods `initialize`, `tools/list`, and `tools/call`.
- Three tools: `search_catalog`, `get_title_details`, and `add_to_watchlist`.
- Search that ranks relevant demo-catalog entries, respects audience/runtime filters, and reports no matches rather than substituting unrelated default titles.
- A visible activity rail that shows tool inputs, outputs, status, and duration.
- A health endpoint at `GET /api/health`.

## Important prototype limitations

- The six-title catalog is seeded demo data, not a live streaming-provider catalogue. Provider labels and fictional sample titles are for demonstrating the workflow; do not present them as verified real-world availability.
- The watchlist is in memory and resets when the server restarts. It is not a cross-user or persistent account feature.
- This prototype does not connect to a production Alexa+ service. It demonstrates an Alexa+-style experience and an MCP integration boundary.

## Run locally

Requirements: Node.js compatible with the project toolchain and pnpm.

```bash
pnpm install --frozen-lockfile
pnpm check
pnpm test
pnpm build
pnpm start
```

The app's default server port is `3000`. Check `GET /api/health` and make a JSON-RPC `initialize` request to `POST /mcp` before recording a demo.

## Three-minute judging demo

1. Ask: **“Find a funny family film under two hours.”** Show the returned titles and the `search_catalog` trace.
2. Open a result, review its details, then add it to the watchlist. Show the `add_to_watchlist` trace and the updated shelf.
3. Ask for a genre or constraint that is not represented (for example, “horror slasher zombies”). Show that CueCast honestly reports no catalog match instead of returning unrelated titles.
4. Open **How it works** and explain how the UI calls the three MCP tools through `POST /mcp`.

## Suggested Devpost submission copy

**Project name:** CueCast

**Tagline:** Your viewing co-pilot, powered by MCP.

**Elevator pitch:** CueCast is a conversational entertainment assistant that turns “what should we watch?” into a grounded shortlist, title details, and a saved watchlist. It demonstrates an inspectable MCP integration through three tools—catalog search, title details, and watchlist actions—so the experience is more than a chat mockup.

**Problem:** Choosing something to watch often turns into endless scrolling. Generic recommendations also ignore who is watching, how much time is available, and what the group wants tonight.

**Solution:** CueCast accepts natural-language viewing requests, applies audience and runtime constraints, shows relevant sample-catalog matches, and lets the viewer save a choice. Its MCP activity rail makes each tool call and structured result visible for inspection.

**How it was built:** React + TypeScript frontend, Express + TypeScript server, and a JSON-RPC MCP endpoint exposing `search_catalog`, `get_title_details`, and `add_to_watchlist`. The current catalog and watchlist are deliberately self-contained demo data.

**What makes it different:** It pairs a polished viewing workflow with an observable tool boundary. Judges can see the input, structured result, and action behind the conversational interface, including honest no-match behavior.

**Known limitations / next steps:** Expand the catalogue using verified metadata, connect live provider availability, persist watchlists, and add an actual Alexa+ integration if the track environment permits it.

## Before submitting

- [ ] Deploy a public HTTPS build and open it in a private/incognito window.
- [ ] Confirm `/api/health` returns `{"status":"ok"}`.
- [ ] Confirm `POST /mcp` handles `initialize`, `tools/list`, search, details, and watchlist calls.
- [ ] Run the four automated search tests, TypeScript check, and production build.
- [ ] Add the live demo URL, a short demo video/screenshots, and the repository link to Devpost.
- [ ] Verify the chosen hackathon track and required fields on the official submission page.
- [ ] Submit before the deadline and save the confirmation page.


## Search behavior and demo-data limitation

Search uses keyword and synonym matching over six seeded demo titles, including title, genre, synopsis, audience, provider, and rating metadata. It returns a maximum of four ranked matches and returns an explicit no-match response instead of repeating unrelated default titles. This is not a live streaming-catalog search or a semantic AI retrieval system; queries outside the seeded catalogue may correctly return no results.
