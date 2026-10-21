import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  Command,
  Database,
  Film,
  Library,
  ListPlus,
  Loader2,
  MessageCircle,
  Radio,
  Search,
  Send,
  Sparkles,
  Terminal,
  Users,
  WandSparkles,
  X,
} from "lucide-react";

type Title = {
  id: string;
  title: string;
  year: number;
  runtime: number;
  rating: string;
  audience: string;
  genres: string[];
  provider: string;
  accent: string;
  synopsis: string;
  note: string;
};

type Message = {
  id: number;
  role: "user" | "assistant";
  text: string;
  titles?: Title[];
};

type Trace = {
  id: number;
  tool: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: "running" | "complete" | "error";
  duration?: number;
};

type McpToolResult = {
  matches?: Title[];
  watchlist?: Title[];
  title?: string;
  success?: boolean;
};

const starterPrompts = [
  {
    label: "Find a family film",
    value: "Find a funny family film under two hours",
  },
  {
    label: "Plan a cozy night",
    value: "Plan a cozy watch night for the family",
  },
  {
    label: "Something magical",
    value: "Show me a magical adventure for tonight",
  },
];

const fallbackWatchlist: Title[] = [];

function prettyToolName(name: string) {
  return name.replaceAll("_", " ");
}

function Poster({
  title,
  compact = false,
}: {
  title: Title;
  compact?: boolean;
}) {
  return (
    <div
      className={`poster relative overflow-hidden rounded-[1.2rem] bg-gradient-to-br ${title.accent} ${compact ? "h-24 w-20" : "h-52 w-full"}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.38),transparent_32%),linear-gradient(160deg,transparent_55%,rgba(5,16,28,0.62))]" />
      <div className="absolute left-3 top-3 flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.22em] text-white/75">
        <span className="h-1.5 w-1.5 rounded-full bg-white/80" /> {title.rating}
      </div>
      <div
        className={`absolute inset-x-3 bottom-3 ${compact ? "text-[12px]" : "text-[18px]"} font-semibold leading-[0.95] tracking-[-0.04em] text-white`}
      >
        {title.title}
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-ink/10 bg-white/60 px-3 py-2">
      <Icon size={14} className="text-coral" />
      <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/45">
        {label}
      </span>
      <span className="text-xs font-semibold text-ink">{value}</span>
    </div>
  );
}

export default function Home() {
  const [activeView, setActiveView] = useState<"home" | "watchlist" | "docs">(
    "home"
  );
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      text: "Tell me the shape of the night. I can find something for the whole room, build a watch plan, or keep a title close for later.",
    },
  ]);
  const [traces, setTraces] = useState<Trace[]>([]);
  const [watchlist, setWatchlist] = useState<Title[]>(fallbackWatchlist);
  const [selectedTitle, setSelectedTitle] = useState<Title | null>(null);

  const latestTrace = traces[0];
  const currentTitles = useMemo(() => {
    const all = messages.flatMap(message => message.titles ?? []);
    return Array.from(new Map(all.map(title => [title.id, title])).values());
  }, [messages]);

  async function invokeTool(tool: string, args: Record<string, unknown>) {
    const traceId = Date.now();
    const started = performance.now();
    setTraces(previous => [
      { id: traceId, tool, input: args, status: "running" },
      ...previous,
    ]);

    try {
      const response = await fetch("/mcp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, text/event-stream",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: traceId,
          method: "tools/call",
          params: { name: tool, arguments: args },
        }),
      });
      const payload = await response.json();
      const result = payload.result as
        | {
            structuredContent?: McpToolResult;
            isError?: boolean;
            content?: Array<{ text?: string }>;
          }
        | undefined;
      if (!response.ok || result?.isError)
        throw new Error(result?.content?.[0]?.text ?? "MCP tool call failed");
      const output = result?.structuredContent ?? {};
      setTraces(previous =>
        previous.map(trace =>
          trace.id === traceId
            ? {
                ...trace,
                output,
                status: "complete",
                duration: Math.round(performance.now() - started),
              }
            : trace
        )
      );
      return output;
    } catch (error) {
      setTraces(previous =>
        previous.map(trace =>
          trace.id === traceId
            ? {
                ...trace,
                output:
                  error instanceof Error ? error.message : "Unknown error",
                status: "error",
                duration: Math.round(performance.now() - started),
              }
            : trace
        )
      );
      throw error;
    }
  }

  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    const request = input.trim();
    if (!request || isThinking) return;
    setInput("");
    setMessages(previous => [
      ...previous,
      { id: Date.now(), role: "user", text: request },
    ]);
    setIsThinking(true);

    const lowered = request.toLowerCase();
    const isPlan =
      lowered.includes("plan") ||
      lowered.includes("watch night") ||
      lowered.includes("movie night");
    const audience =
      lowered.includes("family") || lowered.includes("kids")
        ? "family"
        : undefined;
    const runtimeMatch = lowered.match(
      /(?:under|less than|maximum of|max)\s*(\d+|one|two|three)\s*(minutes?|mins?|hours?|hrs?)/
    );
    const runtimeNumber = runtimeMatch
      ? ({ one: 1, two: 2, three: 3 }[runtimeMatch[1]] ?? Number(runtimeMatch[1]))
      : undefined;
    const maxRuntime = runtimeMatch
      ? runtimeNumber! * (/hours?|hrs?/.test(runtimeMatch[2]) ? 60 : 1)
      : lowered.includes("short")
        ? 100
        : undefined;

    try {
      const result = await invokeTool("search_catalog", {
        // Always search the viewer's actual request; do not replace it with a
        // hard-coded query just because they mentioned tonight or planning.
        query: request,
        ...(audience ? { audience } : {}),
        ...(maxRuntime ? { maxRuntime } : {}),
      });
      const titles = result.matches ?? [];
      const text = !titles.length
        ? "I couldn’t find a match in this small demo catalog. Try a genre such as comedy, fantasy, animation, mystery, or sci-fi, or remove a viewing constraint."
        : isPlan
          ? `Here’s a watch-night shortlist: start with ${titles[0].title}${titles[1] ? `, and keep ${titles[1].title} as a backup` : ""}. Check the details and audience rating before you settle in.`
          : `I found ${titles.length} ${titles.length === 1 ? "possible fit" : "possible fits"}. ${titles[0].title} is my strongest match because ${titles[0].note.toLowerCase()}`;
      setMessages(previous => [
        ...previous,
        { id: Date.now() + 1, role: "assistant", text, titles },
      ]);
    } catch {
      setMessages(previous => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "The demo endpoint needs a moment to wake up. Try that prompt once more.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  async function addToWatchlist(title: Title) {
    try {
      const result = await invokeTool("add_to_watchlist", { id: title.id });
      const saved = result.watchlist ?? [];
      setWatchlist(saved);
    } catch {
      // The trace already surfaces the error state.
    }
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-10">
          <button
            onClick={() => setActiveView("home")}
            className="group flex items-center gap-3 text-left"
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-paper shadow-[0_6px_18px_rgba(13,27,42,0.18)]">
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-coral" />
              <Radio size={17} />
            </span>
            <span>
              <span className="block font-display text-xl font-bold tracking-[-0.04em]">
                CueCast
              </span>
              <span className="block text-[9px] font-bold uppercase tracking-[0.22em] text-ink/45">
                A calmer way to choose
              </span>
            </span>
          </button>
          <nav className="hidden items-center gap-1 md:flex">
            {[
              { id: "home" as const, label: "Assistant", icon: MessageCircle },
              {
                id: "watchlist" as const,
                label: `Watchlist${watchlist.length ? ` · ${watchlist.length}` : ""}`,
                icon: Library,
              },
              { id: "docs" as const, label: "How it works", icon: BookOpen },
            ].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`nav-link ${activeView === item.id ? "nav-link-active" : ""}`}
                >
                  <Icon size={15} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-3 py-2 sm:flex">
              <span className="h-2 w-2 animate-pulse rounded-full bg-mint" />
              <span className="text-[10px] font-bold uppercase tracking-[0.17em] text-ink/65">
                MCP online
              </span>
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white text-ink/60">
              <Command size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-5 pb-16 pt-8 lg:px-10 lg:pt-12">
        {activeView === "home" && (
          <>
            <section className="mb-10 grid items-end gap-8 lg:grid-cols-[1.3fr_0.7fr]">
              <div>
                <div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
                  <Sparkles size={13} /> Build, Ship, Shape · Alexa+ prototype
                </div>
                <h1 className="max-w-3xl font-display text-[clamp(3.6rem,8vw,7.5rem)] font-bold leading-[0.88] tracking-[-0.075em]">
                  The night
                  <br />
                  <em className="font-normal text-coral">has a plan.</em>
                </h1>
                <p className="mt-7 max-w-xl text-base leading-7 text-ink/60">
                  CueCast turns a vague “what should we watch?” into a
                  considered plan. Ask naturally, see the tools working, and
                  spend less time scrolling past the good stuff.
                </p>
              </div>
              <div className="border-l border-ink/15 pl-6 lg:mb-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">
                  Tonight, in context
                </p>
                <p className="mt-3 font-display text-2xl leading-tight tracking-[-0.04em]">
                  A family room, a little energy, and 110 minutes to spare.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <StatPill icon={Users} label="Room" value="Family" />
                  <StatPill icon={Clock3} label="Window" value="110 min" />
                </div>
              </div>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="min-w-0 rounded-[1.75rem] border border-ink/10 bg-white/65 p-4 shadow-[0_24px_80px_rgba(13,27,42,0.06)] sm:p-7">
                <div className="mb-7 flex items-center justify-between border-b border-ink/10 pb-5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">
                      Conversation
                    </p>
                    <h2 className="mt-1 font-display text-2xl font-bold tracking-[-0.04em]">
                      Your viewing co-pilot
                    </h2>
                  </div>
                  <div className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/40 sm:flex">
                    <span className="h-2 w-2 rounded-full bg-coral" />{" "}
                    context-aware
                  </div>
                </div>

                <div className="space-y-6">
                  {messages.map(message => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-ink text-paper">
                          <WandSparkles size={15} />
                        </span>
                      )}
                      <div
                        className={`max-w-[90%] ${message.role === "user" ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${message.role === "user" ? "rounded-br-sm bg-ink text-paper" : "rounded-tl-sm bg-paper text-ink/75"}`}
                        >
                          {message.text}
                        </div>
                        {message.titles && message.titles.length > 0 && (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {message.titles.map(title => (
                              <article
                                key={title.id}
                                className="group rounded-2xl border border-ink/10 bg-white p-2.5 transition hover:-translate-y-0.5 hover:border-coral/45 hover:shadow-lg"
                              >
                                <button
                                  onClick={() => setSelectedTitle(title)}
                                  className="block w-full text-left"
                                >
                                  <Poster title={title} />
                                </button>
                                <div className="px-1 pb-1 pt-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <h3 className="font-display text-lg font-bold tracking-[-0.04em]">
                                        {title.title}
                                      </h3>
                                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/40">
                                        {title.year} · {title.runtime} min ·{" "}
                                        {title.provider}
                                      </p>
                                    </div>
                                    <span className="rounded-full bg-paper px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-ink/50">
                                      {title.rating}
                                    </span>
                                  </div>
                                  <p className="mt-3 text-xs leading-5 text-ink/60">
                                    {title.note}
                                  </p>
                                  <button
                                    onClick={() => addToWatchlist(title)}
                                    className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-coral transition hover:text-ink"
                                  >
                                    <ListPlus size={13} /> Add to watchlist
                                  </button>
                                </div>
                              </article>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {isThinking && (
                    <div className="flex items-center gap-3 text-sm text-ink/50">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-coral/10 text-coral">
                        <Loader2 size={15} className="animate-spin" />
                      </span>{" "}
                      CueCast is checking the catalog…
                    </div>
                  )}
                </div>

                <div className="mt-8 flex flex-wrap gap-2 border-t border-ink/10 pt-5">
                  {starterPrompts.map(prompt => (
                    <button
                      key={prompt.label}
                      onClick={() => setInput(prompt.value)}
                      className="quick-prompt"
                    >
                      {prompt.label}
                      <ArrowUpRight size={13} />
                    </button>
                  ))}
                </div>
                <form
                  onSubmit={handleSubmit}
                  className="mt-4 flex items-center gap-2 rounded-2xl border border-ink/15 bg-paper p-2 pl-4 transition focus-within:border-coral focus-within:ring-4 focus-within:ring-coral/10"
                >
                  <Search size={17} className="shrink-0 text-ink/35" />
                  <input
                    value={input}
                    onChange={event => setInput(event.target.value)}
                    placeholder="Ask for a mood, a runtime, or a room…"
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm text-ink outline-none placeholder:text-ink/35"
                  />
                  <button
                    disabled={!input.trim() || isThinking}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-coral text-white transition hover:bg-ink disabled:cursor-not-allowed disabled:bg-ink/15"
                  >
                    <Send size={16} />
                  </button>
                </form>
              </div>

              <aside className="space-y-6">
                <div className="rounded-[1.75rem] bg-ink p-5 text-paper shadow-[0_24px_80px_rgba(13,27,42,0.14)] sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Terminal size={15} className="text-coral" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-paper/55">
                        MCP activity
                      </span>
                    </div>
                    <span className="rounded-full border border-mint/30 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-mint">
                      live trace
                    </span>
                  </div>
                  {latestTrace ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-mono text-sm text-paper">
                            {prettyToolName(latestTrace.tool)}
                          </p>
                          <p className="mt-1 text-xs text-paper/45">
                            Streamable HTTP · JSON-RPC
                          </p>
                        </div>
                        <span
                          className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] ${latestTrace.status === "error" ? "text-coral" : "text-mint"}`}
                        >
                          {latestTrace.status === "running" ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : latestTrace.status === "error" ? (
                            <X size={12} />
                          ) : (
                            <Check size={12} />
                          )}
                          {latestTrace.status}
                        </span>
                      </div>
                      <div className="rounded-xl bg-white/5 p-3 font-mono text-[10px] leading-5 text-paper/55">
                        <p className="mb-1 text-paper/35">INPUT</p>
                        {JSON.stringify(latestTrace.input, null, 2)}
                      </div>
                      {latestTrace.output ? (
                        <div className="rounded-xl bg-white/5 p-3 font-mono text-[10px] leading-5 text-mint/80">
                          <p className="mb-1 text-mint/50">
                            OUTPUT · {latestTrace.duration}ms
                          </p>
                          {JSON.stringify(latestTrace.output, null, 2).slice(
                            0,
                            280
                          )}
                          {JSON.stringify(latestTrace.output, null, 2).length >
                          280
                            ? "…"
                            : ""}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/15 p-5">
                      <Circle size={17} className="mb-4 text-paper/30" />
                      <p className="text-sm leading-6 text-paper/70">
                        Your next request will leave a visible trail here. No
                        black box, just a small protocol doing useful work.
                      </p>
                    </div>
                  )}
                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-paper/35">
                    <span>3 tools exposed</span>
                    <span>/mcp</span>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-ink/10 bg-white/65 p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink/40">
                        Saved for later
                      </p>
                      <h2 className="mt-1 font-display text-2xl font-bold tracking-[-0.04em]">
                        Watchlist
                      </h2>
                    </div>
                    <button
                      onClick={() => setActiveView("watchlist")}
                      className="rounded-full p-2 text-ink/45 transition hover:bg-paper hover:text-ink"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                  {watchlist.length ? (
                    <div className="space-y-3">
                      {watchlist.slice(0, 3).map(title => (
                        <button
                          key={title.id}
                          onClick={() => setSelectedTitle(title)}
                          className="flex w-full items-center gap-3 rounded-xl text-left transition hover:bg-paper"
                        >
                          <Poster title={title} compact />
                          <span className="min-w-0">
                            <span className="block truncate font-display text-base font-bold tracking-[-0.03em]">
                              {title.title}
                            </span>
                            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.13em] text-ink/40">
                              {title.runtime} min · {title.provider}
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-ink/55">
                      Titles you save during the conversation will gather here.
                    </p>
                  )}
                  <button
                    onClick={() => setActiveView("watchlist")}
                    className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-coral"
                  >
                    Open full watchlist <ArrowUpRight size={13} />
                  </button>
                </div>
              </aside>
            </section>
          </>
        )}

        {activeView === "watchlist" && (
          <section className="mx-auto max-w-5xl">
            <div className="mb-10 flex items-end justify-between gap-5">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
                  Your shelf
                </p>
                <h1 className="font-display text-6xl font-bold leading-none tracking-[-0.075em]">
                  Saved for
                  <br />
                  <em className="font-normal text-coral">the right night.</em>
                </h1>
              </div>
              <button
                onClick={() => setActiveView("home")}
                className="hidden items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/50 sm:flex"
              >
                <MessageCircle size={15} /> Back to assistant
              </button>
            </div>
            {watchlist.length ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {watchlist.map(title => (
                  <article
                    key={title.id}
                    className="rounded-2xl border border-ink/10 bg-white/70 p-3"
                  >
                    <Poster title={title} />
                    <div className="px-1 pb-2 pt-4">
                      <h2 className="font-display text-2xl font-bold tracking-[-0.05em]">
                        {title.title}
                      </h2>
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/40">
                        {title.year} · {title.runtime} min · {title.provider}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-ink/60">
                        {title.synopsis}
                      </p>
                      <button
                        onClick={() => setSelectedTitle(title)}
                        className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-coral"
                      >
                        View details <ChevronRight size={13} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="rounded-[1.75rem] border border-dashed border-ink/20 bg-white/50 p-10 text-center">
                <Library className="mx-auto mb-4 text-coral" />
                <h2 className="font-display text-2xl font-bold">
                  Nothing saved yet.
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/55">
                  Ask CueCast for something to watch, then tap “Add to
                  watchlist” on a result.
                </p>
                <button
                  onClick={() => setActiveView("home")}
                  className="mt-6 rounded-full bg-coral px-5 py-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white"
                >
                  Find something
                </button>
              </div>
            )}
          </section>
        )}

        {activeView === "docs" && (
          <section className="mx-auto max-w-5xl">
            <div className="mb-10">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-coral">
                The build notes
              </p>
              <h1 className="max-w-3xl font-display text-6xl font-bold leading-[0.9] tracking-[-0.075em]">
                Useful magic,
                <br />
                <em className="font-normal text-coral">with receipts.</em>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-ink/60">
                CueCast is a small, self-contained prototype for the Alexa+
                track. The point is not to hide the integration; it is to make
                the handoff between a human request and a tool obvious enough to
                trust.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="doc-card md:col-span-2">
                <div className="doc-icon">
                  <Radio size={18} />
                </div>
                <div>
                  <p className="eyebrow">Architecture</p>
                  <h2 className="doc-heading">
                    A conversational front door to real MCP tools.
                  </h2>
                  <p className="doc-copy">
                    The browser sends JSON-RPC requests to{" "}
                    <code>POST /mcp</code> using Streamable HTTP semantics. The
                    Express handler exposes three tools over one stable
                    boundary: <code>search_catalog</code>,{" "}
                    <code>get_title_details</code>, and{" "}
                    <code>add_to_watchlist</code>. The right-hand activity rail
                    renders the same input and structured output returned by the
                    endpoint.
                  </p>
                </div>
              </div>
              <div className="doc-card">
                <div className="doc-icon">
                  <Film size={18} />
                </div>
                <div>
                  <p className="eyebrow">Alexa+ mapping</p>
                  <h2 className="doc-heading">
                    Natural language, grounded actions.
                  </h2>
                  <p className="doc-copy">
                    The Alexa+ resource asks for a working MCP integration that
                    can simulate an assistant experience. CueCast applies that
                    idea to entertainment: a request becomes catalog search, a
                    title becomes a detail lookup, and a decision becomes a
                    saved watchlist action.
                  </p>
                </div>
              </div>
              <div className="doc-card">
                <div className="doc-icon">
                  <Database size={18} />
                </div>
                <div>
                  <p className="eyebrow">Demo data</p>
                  <h2 className="doc-heading">No keys. No waiting room.</h2>
                  <p className="doc-copy">
                    The catalog is seeded in the server and the watchlist lives
                    in memory for the demo session. That keeps the project
                    judge-friendly and makes the protocol behavior easy to
                    inspect without external accounts or paid APIs.
                  </p>
                </div>
              </div>
              <div className="doc-card md:col-span-2">
                <div className="doc-icon">
                  <BookOpen size={18} />
                </div>
                <div>
                  <p className="eyebrow">Three-minute demo</p>
                  <h2 className="doc-heading">
                    Show the journey, not just the screen.
                  </h2>
                  <ol className="mt-4 space-y-3 text-sm leading-6 text-ink/65">
                    <li>
                      <span className="step-number">01</span> Start with “Find a
                      funny family film” and point to the `search_catalog`
                      trace.
                    </li>
                    <li>
                      <span className="step-number">02</span> Save a result. The
                      tool card changes to `add_to_watchlist` and the shelf
                      updates.
                    </li>
                    <li>
                      <span className="step-number">03</span> Ask for a cozy
                      watch night. CueCast uses the same tool boundary to return
                      a small, contextual plan.
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="mx-auto flex max-w-[1440px] flex-col gap-3 border-t border-ink/10 px-5 py-7 text-[10px] font-bold uppercase tracking-[0.16em] text-ink/35 sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <span>Made for Build, Ship, Shape · Amazon Developer Hackathon</span>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-coral" /> CueCast
          · Conversational discovery, powered by MCP
        </span>
      </footer>

      {selectedTitle && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/35 p-3 backdrop-blur-sm sm:items-center">
          <div className="relative w-full max-w-lg rounded-[1.75rem] bg-paper p-5 shadow-2xl sm:p-7">
            <button
              onClick={() => setSelectedTitle(null)}
              className="absolute right-4 top-4 rounded-full p-2 text-ink/45 hover:bg-white"
            >
              <X size={18} />
            </button>
            <div className="grid gap-5 sm:grid-cols-[150px_1fr]">
              <Poster title={selectedTitle} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-coral">
                  {selectedTitle.provider} · {selectedTitle.year}
                </p>
                <h2 className="mt-2 font-display text-4xl font-bold leading-none tracking-[-0.06em]">
                  {selectedTitle.title}
                </h2>
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-ink/45">
                  <span>{selectedTitle.runtime} min</span>
                  <span>·</span>
                  <span>{selectedTitle.rating}</span>
                  <span>·</span>
                  <span>{selectedTitle.audience}</span>
                </div>
              </div>
            </div>
            <p className="mt-6 text-sm leading-7 text-ink/65">
              {selectedTitle.synopsis}
            </p>
            <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/70 p-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-ink/40">
                  CueCast says
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {selectedTitle.note}
                </p>
              </div>
              <button
                onClick={() => {
                  void addToWatchlist(selectedTitle);
                  setSelectedTitle(null);
                }}
                className="rounded-full bg-coral px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.13em] text-white"
              >
                Save title
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
