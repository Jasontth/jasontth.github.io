"use client"

import { useState, type FormEvent, type KeyboardEvent } from "react"
import { Plus, Trash2, Plane, ListPlus } from "lucide-react"
import { FlightCard } from "@/components/flight-card"

type Card = { id: string; query: string }

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)

// Splits a candidate flight string into airline prefix + digits + optional suffix letter.
// Prefix shapes match real airline designators: 2-3 letters (UA, BAW), or 2-char
// mixed letter+digit (B6, 9W, 5J). Digits are 1-4 long.
const FLIGHT_PARTS_RE = /^([A-Z]{2,3}|[A-Z]\d|\d[A-Z])(\d{1,4})([A-Z]?)$/

// Tokens that look like an airline code on their own ("UA", "BA", "BAW", "B6", "9W").
const AIRLINE_RE = /^([A-Z]{2,3}|[A-Z]\d|\d[A-Z])$/

// Tokens that look like a bare flight number ("123", "0111", "2490A").
const NUMBER_RE = /^\d{1,4}[A-Z]?$/

// Normalize a candidate flight string by stripping leading zeros from the
// numeric portion so that "5J0111" -> "5J111", "UA0123" -> "UA123".
// Returns null if the input doesn't look like a flight number.
function normalizeFlight(raw: string): string | null {
  const m = raw.match(FLIGHT_PARTS_RE)
  if (!m) return null
  const [, prefix, digits, suffix] = m
  const trimmed = digits.replace(/^0+/, "") || "0"
  return `${prefix}${trimmed}${suffix}`
}

function parseList(raw: string): string[] {
  // Split on commas, semicolons, slashes, hyphens, pipes, and any whitespace.
  const tokens = raw
    .toUpperCase()
    .split(/[\s,;|/\\\-]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  // Walk tokens and merge "<airline> <number>" pairs (e.g. "CX 255" -> "CX255").
  const merged: string[] = []
  for (let i = 0; i < tokens.length; i++) {
    const cur = tokens[i]
    const next = tokens[i + 1]
    if (AIRLINE_RE.test(cur) && next && NUMBER_RE.test(next)) {
      merged.push(cur + next)
      i++ // consume next
    } else {
      merged.push(cur)
    }
  }

  const normalized = merged
    .map(normalizeFlight)
    .filter((s): s is string => s !== null)

  return Array.from(new Set(normalized))
}

export default function Page() {
  const [cards, setCards] = useState<Card[]>([])
  const [input, setInput] = useState("")

  const flights = parseList(input)

  function addFlights(e?: FormEvent) {
    e?.preventDefault()
    if (flights.length === 0) return
    setCards((c) => {
      const existing = new Set(c.map((x) => x.query))
      const additions = flights
        .filter((q) => !existing.has(q))
        .map((q) => ({ id: newId(), query: q }))
      return [...c, ...additions]
    })
    setInput("")
  }

  function clearAll() {
    setCards([])
  }

  function removeCard(id: string) {
    setCards((c) => c.filter((x) => x.id !== id))
  }

  function handleInputKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault()
      addFlights()
    }
  }

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <header className="shrink-0 border-b border-border bg-card/70 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Plane className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-semibold tracking-tight text-foreground">Skygrid</h1>
              <p className="text-[11px] text-muted-foreground">
                {cards.length === 0 ? "Track flights at a glance" : `${cards.length} flight${cards.length === 1 ? "" : "s"} tracked`}
              </p>
            </div>
          </div>

          {/* Bulk input */}
          <form
            onSubmit={addFlights}
            className="flex flex-1 items-center gap-2"
            role="search"
            aria-label="Add flights"
          >
            <div className="relative flex-1">
              <ListPlus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder="Add flights — e.g. UA123, BA 286 LH400 CX 255"
                spellCheck={false}
                autoComplete="off"
                className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-24 text-sm font-medium uppercase tracking-wide text-foreground placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/20"
                aria-label="Flight numbers"
              />
              {flights.length > 0 && (
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-secondary px-2 py-0.5 font-mono text-[10px] font-semibold text-secondary-foreground">
                  +{flights.length}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={flights.length === 0}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Add</span>
            </button>
            <button
              type="button"
              onClick={clearAll}
              disabled={cards.length === 0}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Clear all flights"
              title="Clear all"
            >
              <Trash2 className="h-4 w-4" />
              <span className="hidden md:inline">Clear</span>
            </button>
          </form>
        </div>
      </header>

      {/* Grid (only this scrolls) */}
      <section className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6">
          {cards.length === 0 ? (
            <EmptyState onSeed={(qs) => setInput(qs)} />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {cards.map((card) => (
                <FlightCard
                  key={card.id}
                  id={card.id}
                  query={card.query}
                  onRemove={removeCard}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function EmptyState({ onSeed }: { onSeed: (qs: string) => void }) {
  const samples = ["UA123", "BA286", "LH400", "AF11", "EK202"]
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-primary">
        <Plane className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">No flights yet</p>
        <p className="text-pretty text-xs text-muted-foreground">
          Type or paste flight numbers above — separated by commas or spaces, with or without a
          space between the airline code and number (e.g. CX 255).
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {samples.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSeed(s)}
            className="rounded-full border border-border bg-background px-2.5 py-1 font-mono text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-secondary"
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onSeed(samples.join(", "))}
          className="rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Try all
        </button>
      </div>
    </div>
  )
}
