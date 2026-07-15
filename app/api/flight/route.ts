import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AirportNode = {
  name?: string | null
  code?: { iata?: string | null; icao?: string | null }
  position?: {
    latitude?: number | null
    longitude?: number | null
    country?: { name?: string | null; code?: string | null }
    region?: { city?: string | null }
  }
  timezone?: { name?: string | null; offset?: number | null; abbr?: string | null }
}

type Fr24Item = {
  identification?: {
    number?: { default?: string | null; alternative?: string | null }
    callsign?: string | null
  }
  status?: {
    text?: string | null
    generic?: { status?: { text?: string | null; color?: string | null; type?: string | null } }
  }
  aircraft?: {
    model?: { code?: string | null; text?: string | null }
    registration?: string | null
  }
  airline?: {
    name?: string | null
    short?: string | null
    code?: { iata?: string | null; icao?: string | null }
  } | null
  airport?: { origin?: AirportNode | null; destination?: AirportNode | null }
  time?: {
    scheduled?: { departure?: number | null; arrival?: number | null }
    real?: { departure?: number | null; arrival?: number | null }
    estimated?: { departure?: number | null; arrival?: number | null }
    other?: { duration?: number | null; updated?: number | null; eta?: number | null }
  }
}

export type Airport = {
  iata: string
  icao: string
  name: string
  city: string
  country: string
  countryCode: string
  timezone: string
  tzAbbr: string
}

export type FlightLeg = {
  flightNumber: string
  callsign: string | null
  airlineName: string | null
  airlineIata: string | null
  airlineIcao: string | null
  status: string
  statusKind:
    | "scheduled"
    | "on-time"
    | "departed"
    | "landed"
    | "delayed"
    | "cancelled"
    | "diverted"
    | "unknown"
  origin: Airport | null
  destination: Airport | null
  scheduledDeparture: number | null
  scheduledArrival: number | null
  estimatedDeparture: number | null
  estimatedArrival: number | null
  actualDeparture: number | null
  actualArrival: number | null
  durationSec: number | null
  aircraftModel: string | null
  aircraftRegistration: string | null
}

function readAirport(node: AirportNode | null | undefined): Airport | null {
  if (!node || !node.code?.iata) return null
  return {
    iata: node.code.iata,
    icao: node.code.icao ?? "",
    name: node.name ?? "",
    city: node.position?.region?.city ?? "",
    country: node.position?.country?.name ?? "",
    countryCode: node.position?.country?.code ?? "",
    timezone: node.timezone?.name ?? "UTC",
    tzAbbr: node.timezone?.abbr ?? "",
  }
}

function classifyStatus(
  text: string | null | undefined,
  times: {
    scheduledDeparture: number | null
    scheduledArrival: number | null
    estimatedDeparture: number | null
    estimatedArrival: number | null
    actualDeparture: number | null
    actualArrival: number | null
  },
): FlightLeg["statusKind"] {
  const t = (text ?? "").toLowerCase()
  if (t.includes("cancel")) return "cancelled"
  if (t.includes("divert")) return "diverted"

  const {
    scheduledDeparture: sd,
    scheduledArrival: sa,
    estimatedDeparture: ed,
    estimatedArrival: ea,
    actualDeparture: ad,
    actualArrival: aa,
  } = times

  if (aa) return "landed"

  const DELAY_MIN = 15

  const depRef = ed ?? ad ?? null
  const depDelayMin = sd && depRef ? (depRef - sd) / 60 : 0
  const arrRef = ea ?? aa ?? null
  const arrDelayMin = sa && arrRef ? (arrRef - sa) / 60 : 0

  if (ad) {
    if (arrDelayMin >= DELAY_MIN || depDelayMin >= DELAY_MIN) return "delayed"
    return "departed"
  }

  if (t.includes("delay") || depDelayMin >= DELAY_MIN) return "delayed"

  if (t.includes("on time")) return "on-time"
  if (sd) {
    if (ed && Math.abs(ed - sd) < 5 * 60) return "on-time"
    return "scheduled"
  }

  if (t.includes("scheduled")) return "scheduled"
  return "unknown"
}

function pickBestLeg(items: Fr24Item[]): Fr24Item | null {
  if (!items.length) return null
  const now = Math.floor(Date.now() / 1000)
  const scored = items
    .map((item) => {
      const sd = item.time?.scheduled?.departure ?? null
      const sa = item.time?.scheduled?.arrival ?? null
      const hasRoute = !!(item.airport?.origin?.code?.iata && item.airport?.destination?.code?.iata)
      const status = (item.status?.text ?? "").toLowerCase()
      let score = 0
      if (hasRoute) score += 1000
      if (sd && sa && sd <= now && sa >= now) score += 600
      if (sd && sd > now) score += 500 - Math.min(500, Math.floor((sd - now) / 3600))
      if (sa && sa < now) score += 200 - Math.min(200, Math.floor((now - sa) / 3600))
      if (status.includes("scheduled")) score += 80
      if (status.includes("estimated") || status.includes("en route")) score += 70
      return { item, score }
    })
    .sort((a, b) => b.score - a.score)
  return scored[0]?.item ?? null
}

function normalize(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, "")
}

function buildLeg(item: Fr24Item, fallbackFlight: string): FlightLeg {
  const times = {
    scheduledDeparture: item.time?.scheduled?.departure ?? null,
    scheduledArrival: item.time?.scheduled?.arrival ?? null,
    estimatedDeparture: item.time?.estimated?.departure ?? null,
    estimatedArrival: item.time?.estimated?.arrival ?? null,
    actualDeparture: item.time?.real?.departure ?? null,
    actualArrival: item.time?.real?.arrival ?? null,
  }
  return {
    flightNumber: item.identification?.number?.default ?? fallbackFlight,
    callsign: item.identification?.callsign ?? null,
    airlineName: item.airline?.name ?? null,
    airlineIata: item.airline?.code?.iata ?? null,
    airlineIcao: item.airline?.code?.icao ?? null,
    status: item.status?.text ?? "Unknown",
    statusKind: classifyStatus(item.status?.text, times),
    origin: readAirport(item.airport?.origin),
    destination: readAirport(item.airport?.destination),
    ...times,
    durationSec: item.time?.other?.duration ?? null,
    aircraftModel: item.aircraft?.model?.code ?? item.aircraft?.model?.text ?? null,
    aircraftRegistration: item.aircraft?.registration ?? null,
  }
}

// In-memory caches (per server instance).
type CacheEntry = { leg: FlightLeg; fetchedAt: number }
const FRESH_TTL_MS = 60_000 // serve cached data without hitting upstream
const STALE_TTL_MS = 30 * 60_000 // serve stale on upstream failure / rate limit
const cache = new Map<string, CacheEntry>()
const inflight = new Map<string, Promise<FlightLeg | null>>()

const UPSTREAM = "https://api.flightradar24.com/common/v1/flight/list.json"

async function fetchFromUpstream(flight: string, retries = 1): Promise<{
  leg: FlightLeg | null
  status: number
}> {
  const url = `${UPSTREAM}?query=${encodeURIComponent(flight)}&fetchBy=flight&page=1&limit=10`
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "application/json,text/plain,*/*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://www.flightradar24.com/",
      Origin: "https://www.flightradar24.com",
    },
    signal: AbortSignal.timeout(9000),
    cache: "no-store",
  })

  if (res.status === 429 && retries > 0) {
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 600))
    return fetchFromUpstream(flight, retries - 1)
  }

  if (!res.ok) return { leg: null, status: res.status }

  const json = (await res.json()) as { result?: { response?: { data?: Fr24Item[] } } }
  const items = json.result?.response?.data ?? []
  if (!items.length) return { leg: null, status: 404 }

  const item = pickBestLeg(items)
  if (!item) return { leg: null, status: 404 }

  return { leg: buildLeg(item, flight), status: 200 }
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const flightRaw = url.searchParams.get("flight") ?? ""
  const flight = normalize(flightRaw)

  if (!flight || flight.length < 3) {
    return NextResponse.json(
      { error: "Please enter a valid flight number, like UA123, BA286, or LH400." },
      { status: 400 },
    )
  }

  const now = Date.now()
  const cached = cache.get(flight)

  // Serve fresh cache straight away.
  if (cached && now - cached.fetchedAt < FRESH_TTL_MS) {
    return NextResponse.json({ flight: cached.leg, fetchedAt: cached.fetchedAt, cached: true })
  }

  // Dedupe concurrent requests for the same flight.
  let task = inflight.get(flight)
  if (!task) {
    task = (async () => {
      try {
        const { leg, status } = await fetchFromUpstream(flight)
        if (leg) {
          cache.set(flight, { leg, fetchedAt: Date.now() })
          return leg
        }
        // Non-success: throw a typed error with status info.
        const err = new Error(String(status)) as Error & { upstreamStatus?: number }
        err.upstreamStatus = status
        throw err
      } finally {
        inflight.delete(flight)
      }
    })()
    inflight.set(flight, task)
  }

  try {
    const leg = await task
    if (!leg) {
      return NextResponse.json({ error: `No flight found for "${flight}".` }, { status: 404 })
    }
    return NextResponse.json({ flight: leg, fetchedAt: Date.now() })
  } catch (err) {
    const upstreamStatus =
      err instanceof Error && "upstreamStatus" in err
        ? (err as Error & { upstreamStatus?: number }).upstreamStatus
        : undefined

    // On upstream failure, fall back to stale cache if we have any.
    if (cached && now - cached.fetchedAt < STALE_TTL_MS) {
      return NextResponse.json({
        flight: cached.leg,
        fetchedAt: cached.fetchedAt,
        cached: true,
        stale: true,
      })
    }

    if (upstreamStatus === 404) {
      return NextResponse.json(
        {
          error: `No flight found for "${flight}". Double-check the flight number (e.g. UA123, BA286).`,
        },
        { status: 404 },
      )
    }

    if (upstreamStatus === 429) {
      return NextResponse.json(
        {
          error:
            "Too many requests right now. The flight service is throttling us — please wait a few seconds and refresh.",
        },
        { status: 429 },
      )
    }

    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "The flight service took too long to respond. Please try again."
        : `The flight service returned ${upstreamStatus ?? "an error"}. Please try again shortly.`
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
