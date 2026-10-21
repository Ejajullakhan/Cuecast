# CueCast delivery checklist

## Conversational viewing assistant

- [ ] The root page presents a polished CueCast dashboard clearly labeled as a Build, Ship, Shape hackathon prototype inspired by Alexa+ resources.
- [ ] A user can type a natural-language viewing request or use a quick prompt and receive a contextual response without external credentials.
- [ ] The assistant can search a realistic seeded entertainment catalog and return titles with genre, rating, runtime, audience and availability metadata.

## Watch-night planning and watchlist

- [ ] The app provides a watch-night planning flow that turns audience, mood and timing cues into a suggested viewing shortlist.
- [ ] A user can add titles from results to a watchlist and view the saved collection inside the app.
- [ ] Title result cards expose synopsis, audience guidance, runtime, genre and related catalog information through a details action.

## Model Context Protocol integration

- [ ] The server exposes a working `POST /mcp` Streamable HTTP JSON-RPC endpoint with `initialize`, `tools/list` and `tools/call` support.
- [ ] The MCP endpoint exposes `search_catalog`, `get_title_details` and `add_to_watchlist` tools with structured results.
- [ ] The UI displays tool-call and tool-result cards with the tool name, inputs, outputs and status so the protocol boundary is visible during a demo.

## Documentation and handoff

- [ ] The in-app Docs view explains the architecture, endpoint, tools, Alexa+ resource mapping, local setup and a step-by-step demo script.
- [ ] The route manifest is served at `/manus-routes.json`, the health endpoint remains available, and the project passes TypeScript checks and production build.
- [ ] The project is not submitted to Devpost until the owner reviews the finished demo and chooses the final submission content.
