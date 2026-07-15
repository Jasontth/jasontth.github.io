"use client"

import { useEffect, useState } from "react"
import { X, ArrowRight, Clock, CircleAlert, Loader2, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { FlightLeg } from "@/app/api/flight/route"

type CardProps = {
  id: string
  query: string
  onRemove: (id: string) => void
}

const STATUS_STYLE: Record<
  FlightLeg["statusKind"],
  { dot: string; pill: string; label: string }
> = {
  scheduled: {
    dot: "bg-sky-500",
    pill: "bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-900",
    label: "Scheduled",
  },
  "on-time": {
    dot: "bg-emerald-500",
    pill: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900",
    label: "On time",
  },
  departed: {
    dot: "bg-indigo-500",
    pill: "bg-indigo-50 text-indigo-700 ring-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:ring-indigo-900",
    label: "Departed",
  },
  landed: {
    dot: "bg-slate-500",
    pill: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
    label: "Landed",
  },
  delayed: {
    dot: "bg-amber-500",
    pill: "bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900",
    label: "Delayed",
  },
  cancelled: {
    dot: "bg-rose-500",
    pill: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900",
    label: "Cancelled",
  },
  diverted: {
    dot: "bg-orange-500",
    pill: "bg-orange-50 text-orange-700 ring-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900",
    label: "Diverted",
  },
  unknown: {
    dot: "bg-slate-400",
    pill: "bg-slate-100 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700",
    label: "Unknown",
  },
}

function formatTimeInTz(unix: number | null, timeZone: string) {
  if (!unix) return null
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone,
    }).format(new Date(unix * 1000))
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(unix * 1000))
  }
}

function formatDuration(sec: number | null): string | null {
  if (!sec || sec <= 0) return null
  const h = Math.floor(sec / 3600)
  const m = Math.round((sec % 3600) / 60)
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// Simple client-side queue: spaces out outgoing requests so a burst of new
// cards doesn't trigger upstream rate-limiting. Each request waits a randomized
// delay (base + jitter) after the previous one, so requests never fire in a
// tight, predictable rhythm that looks like a bot to the upstream.
let queueTail: Promise<void> = Promise.resolve()
const REQUEST_BASE_MS = 150
const REQUEST_JITTER_MS = 300

function randomSpacing() {
  return REQUEST_BASE_MS + Math.floor(Math.random() * REQUEST_JITTER_MS)
}

function enqueueFetch(url: string, signal: AbortSignal) {
  const wait = queueTail.then(
    () =>
      new Promise<void>((resolve) => {
        const t = setTimeout(resolve, randomSpacing())
        signal.addEventListener("abort", () => {
          clearTimeout(t)
          resolve()
        })
      }),
  )
  queueTail = wait
  return wait.then(() => fetch(url, { signal }))
}

export function FlightCard({ id, query, onRemove }: CardProps) {
  const [flight, setFlight] = useState<FlightLeg | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadCounter, setReloadCounter] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    setFlight(null)

    enqueueFetch(`/api/flight?flight=${encodeURIComponent(query)}`, controller.signal)
      .then(async (res) => ({ ok: res.ok, data: await res.json() }))
      .then(({ ok, data }) => {
        if (controller.signal.aborted) return
        if (!ok) {
          setError(data?.error || "Couldn't find that flight.")
        } else {
          setFlight(data.flight as FlightLeg)
        }
      })
      .catch((err) => {
        if (controller.signal.aborted) return
        if (err?.name !== "AbortError") {
          setError("Couldn't reach the flight service.")
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => {
      controller.abort()
    }
  }, [query, reloadCounter])

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm ring-1 ring-black/[0.02] transition-shadow hover:shadow-md">
      {/* Top-right controls */}
      <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        <button
          type="button"
          onClick={() => setReloadCounter((c) => c + 1)}
          aria-label="Refresh"
          title="Refresh"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
        </button>
        <button
          type="button"
          onClick={() => onRemove(id)}
          aria-label="Remove"
          title="Remove"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex min-h-[180px] flex-col p-3">
        {loading && <LoadingState query={query} />}
        {!loading && error && <ErrorState query={query} message={error} />}
        {!loading && !error && flight && <FlightDetails flight={flight} />}
      </div>
    </article>
  )
}

function FlightDetails({ flight }: { flight: FlightLeg }) {
  const status = STATUS_STYLE[flight.statusKind]
  const depTz = flight.origin?.timezone ?? "UTC"
  const arrTz = flight.destination?.timezone ?? "UTC"

  const depTime =
    formatTimeInTz(flight.actualDeparture, depTz) ??
    formatTimeInTz(flight.estimatedDeparture, depTz) ??
    formatTimeInTz(flight.scheduledDeparture, depTz)

  const arrTime =
    formatTimeInTz(flight.actualArrival, arrTz) ??
    formatTimeInTz(flight.estimatedArrival, arrTz) ??
    formatTimeInTz(flight.scheduledArrival, arrTz)

  const depScheduledTime = formatTimeInTz(flight.scheduledDeparture, depTz)
  const arrScheduledTime = formatTimeInTz(flight.scheduledArrival, arrTz)

  const depDelayed =
    !!flight.scheduledDeparture &&
    !!(flight.estimatedDeparture || flight.actualDeparture) &&
    Math.abs(
      ((flight.estimatedDeparture ?? flight.actualDeparture)! - flight.scheduledDeparture) / 60,
    ) >= 5

  const arrDelayed =
    !!flight.scheduledArrival &&
    !!(flight.estimatedArrival || flight.actualArrival) &&
    Math.abs(
      ((flight.estimatedArrival ?? flight.actualArrival)! - flight.scheduledArrival) / 60,
    ) >= 5

  const duration = formatDuration(flight.durationSec)

  return (
    <div className="flex flex-1 flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 pr-12">
        <div className="min-w-0">
          <h2 className="font-mono text-base font-bold leading-tight tracking-tight text-foreground">
            {flight.flightNumber}
          </h2>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {flight.airlineName ?? "Unknown airline"}
            {flight.aircraftModel ? ` · ${flight.aircraftModel}` : ""}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset",
            status.pill,
          )}
        >
          <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
          {status.label}
        </span>
      </div>

      {/* Route */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <div className="min-w-0">
          <div className="font-mono text-xl font-bold leading-none text-foreground">
            {flight.origin?.iata ?? "—"}
          </div>
          <div className="mt-1 truncate text-[11px] text-muted-foreground">
            {flight.origin?.city || flight.origin?.name || ""}
          </div>
        </div>
        <div className="flex flex-col items-center text-muted-foreground">
          <ArrowRight className="h-3.5 w-3.5 text-primary" />
          {duration && (
            <span className="mt-0.5 inline-flex items-center gap-0.5 font-mono text-[10px] tabular-nums">
              <Clock className="h-2.5 w-2.5" />
              {duration}
            </span>
          )}
        </div>
        <div className="min-w-0 text-right">
          <div className="font-mono text-xl font-bold leading-none text-foreground">
            {flight.destination?.iata ?? "—"}
          </div>
          <div className="mt-1 truncate text-[11px] text-muted-foreground">
            {flight.destination?.city || flight.destination?.name || ""}
          </div>
        </div>
      </div>

      {/* Times */}
      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border pt-2">
        <TimeBlock
          label="Departs"
          time={depTime}
          scheduled={depScheduledTime}
          tzAbbr={flight.origin?.tzAbbr}
          delayed={depDelayed}
        />
        <TimeBlock
          label="Arrives"
          time={arrTime}
          scheduled={arrScheduledTime}
          tzAbbr={flight.destination?.tzAbbr}
          delayed={arrDelayed}
          align="right"
        />
      </div>
    </div>
  )
}

function TimeBlock({
  label,
  time,
  scheduled,
  tzAbbr,
  delayed,
  align = "left",
}: {
  label: string
  time: string | null
  scheduled: string | null
  tzAbbr?: string
  delayed: boolean
  align?: "left" | "right"
}) {
  return (
    <div className={cn("flex flex-col", align === "right" && "items-end text-right")}>
      <div className="text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span
          className={cn(
            "font-mono text-base font-semibold tabular-nums leading-none",
            delayed ? "text-amber-600 dark:text-amber-400" : "text-foreground",
          )}
        >
          {time ?? "—"}
        </span>
        {tzAbbr && <span className="text-[10px] text-muted-foreground">{tzAbbr}</span>}
      </div>
      {delayed && scheduled && time !== scheduled && (
        <div className="text-[9px] text-muted-foreground">
          sched <span className="font-mono line-through">{scheduled}</span>
        </div>
      )}
    </div>
  )
}

function LoadingState({ query }: { query: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <p className="font-mono text-xs">{query}</p>
    </div>
  )
}

function ErrorState({ query, message }: { query: string; message: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 px-2 text-center">
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <CircleAlert className="h-4 w-4" />
      </div>
      <p className="font-mono text-xs font-semibold text-foreground">{query}</p>
      <p className="text-pretty text-[11px] leading-snug text-muted-foreground">{message}</p>
    </div>
  )
}

