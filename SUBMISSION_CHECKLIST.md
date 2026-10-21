# CueCast — submission-day checklist

## Do these before the deadline

1. **Public demo URL:** deploy the reviewed project to a public HTTPS host and test the URL in an incognito/private browser. This has not been deployed from this workspace because the available Vercel connection returned no teams/projects and package installation is blocked by unavailable npm registry access.
2. **Smoke test:** `GET /api/health` should return `{"status":"ok"}`. `POST /mcp` should respond to JSON-RPC `initialize` and `tools/list`.
3. **Demo the full loop:** search a family-friendly title, inspect its details, add it to the watchlist, then ask for an unsupported genre to show honest no-match behavior.
4. **Record proof:** capture a 2–3 minute screen recording with narration and take 2–3 screenshots. Keep the public demo link visible in the recording.
5. **Devpost fields:** use the project description, problem, solution, tech stack, differentiation, and limitations in `README.md`. Add the live URL, repository URL, video, and screenshots.
6. **Final review:** confirm the selected hackathon/track, required fields, rules, and deadline on the official submission page; click Submit and save the confirmation page.

## Copy-ready short description

CueCast is a conversational entertainment assistant that turns “what should we watch?” into a grounded shortlist, title details, and a saved watchlist. It demonstrates an inspectable Model Context Protocol (MCP) integration with tools for catalog search, title details, and watchlist actions. The activity rail exposes each tool call and structured result, making the tool boundary easy to understand and verify.

## Honest limitations to disclose

The six-title catalogue is seeded demo data rather than a live provider catalogue, and the watchlist is in-memory. This is an Alexa+-style hackathon prototype, not a production Alexa+ integration.
