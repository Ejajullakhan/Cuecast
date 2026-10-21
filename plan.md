# CueCast implementation plan

## Product scope

CueCast is a self-contained hackathon prototype inspired by the Alexa+ track in the Build, Ship, Shape resources. It demonstrates how a conversational assistant can coordinate entertainment discovery and watch-night planning through real Model Context Protocol tools. The app will run without external credentials, using a seeded catalog and in-memory watchlist so a judge can demo the experience immediately.

## Architecture

- **Frontend:** React + TypeScript + Tailwind in `client/src/pages/Home.tsx`, with a single responsive dashboard route.
- **MCP boundary:** Express route `POST /mcp` implements JSON-RPC methods `initialize`, `tools/list`, and `tools/call` using Streamable HTTP semantics. Tools are `search_catalog`, `get_title_details`, and `add_to_watchlist`.
- **Demo data:** A typed seeded entertainment catalog and an in-memory watchlist in `server/mcp.ts`. The browser calls the MCP endpoint directly, so the visible tool trace reflects real request/response traffic rather than mocked UI state.
- **Routing metadata:** `client/public/manus-routes.json` declares the root route for preview and publishing.
- **Deployment:** Keep the initialized server resource, use the existing port 3000 and `/api/health` endpoint, and checkpoint the source after validation.

## Visual direction

### Style options

- **Cinematic command center** — 0.07 probability; dark, dramatic, and data-dense like a premium streaming control room.
- **Editorial warm minimalism** — 0.05 probability; paper-like neutrals, coral accents, and confident magazine typography.
- **Playful neon arcade** — 0.03 probability; high saturation, glow effects, and game-like controls.

### Chosen style: Editorial warm minimalism

- **Design Movement:** Contemporary editorial product design with the calm precision of a premium streaming service and the tactile warmth of a printed weekend guide.
- **Core Principles:** Intent first; show the assistant’s reasoning; use generous negative space; make every tool call legible.
- **Color Philosophy:** A warm ivory canvas makes the experience feel human and domestic; ink navy grounds the interface; coral marks active intent; mint and blue appear only as status signals.
- **Layout Paradigm:** Asymmetric command rail: a wide conversational workspace anchors the left, while a narrower “context rail” holds live MCP activity and the watchlist.
- **Signature Elements:** Oversized serif-style display headings; small uppercase metadata labels; poster cards built from bold color fields and tiny eyebrow labels rather than stock imagery.
- **Interaction Philosophy:** Every action gives an immediate, human-readable response and a visible protocol trace. Quick prompts lower the cost of the first interaction.
- **Animation:** Use short ease-out fades and subtle card lifts only for new results; no looping decoration or distracting motion.
- **Typography System:** Use Georgia for display statements and a clean system sans stack for interface copy. Large headlines are tight and editorial; labels are compact and uppercase with tracking.
- **Brand Essence:** A calm co-pilot for choosing what to watch, for people who want less scrolling and more shared time. Personality: considered, warm, capable.
- **Brand Voice:** Headlines sound quietly confident (“The night has a plan.”). CTAs sound specific (“Build a watch night”, “Add to watchlist”), never generic (“Get started”).
- **Wordmark & Logo:** The CueCast wordmark uses a small coral broadcast dot nested into the first C, paired with a tiny “MCP / READY” status marker.
- **Signature Brand Color:** Signal coral `#E9694F`, used only for primary intent and selected actions.

## Project structure

- `client/src/pages/Home.tsx`: responsive product shell, chat flow, catalog cards, watchlist and documentation view.
- `client/src/index.css`: design tokens, layout primitives, responsive breakpoints and motion.
- `server/mcp.ts`: catalog, tool definitions and Streamable HTTP JSON-RPC handler.
- `server/_core/index.ts`: registers `/mcp` alongside health and tRPC routes.
- `client/public/manus-routes.json`: route manifest.
- `TODO.md`: outcome-based delivery checklist.

## Demo path

1. Open the app and show the MCP ONLINE status.
2. Click “Find a family film” to trigger `search_catalog` and show the live trace.
3. Add one result to the watchlist, demonstrating `add_to_watchlist`.
4. Click “Plan a cozy watch night” to show contextual recommendations.
5. Open the Docs view and point to the endpoint, tool list and Alexa+ resource mapping.
