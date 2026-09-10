/**
 * PROTOTYPE-ONLY DATA. Nothing in this file exists in payouts-dataset.json.
 *
 * The dataset gives each booking a single "Rate for N Nights" line and no discounts.
 * To demonstrate how Evolve could explain *why* a booked rate became what it became,
 * this file adds:
 *
 *   1. A listing rate calendar: a list price for any date, from a simple seasonal model
 *      for Austin (SXSW in March, holidays, summer) with Friday/Saturday nights 25% above.
 *   2. Per-night rates for a booking, derived from that calendar and scaled so they sum
 *      EXACTLY to the dataset's base amount. The dataset's numbers are never changed.
 *   3. Two example night-level discounts:
 *        - Midweek discount: 10% off Tuesday and Wednesday nights on stays of 5+ nights.
 *        - Weekly discount:  10% off every night on stays of 7+ nights.
 *
 * Call this out in the presentation as prototype-added, not source data.
 */
import type { Booking } from '../lib/types'
import { addDays, parseISO } from '../lib/format'

export interface NightRate {
  date: string
  /** What the night actually earned, after any discount. Sums to the dataset base. */
  rate: number
  /** The list price before discount. Equals `rate` when no discount applied. */
  listRate: number
  weekend: boolean
  discount: { label: string; pct: number } | null
}

const round2 = (n: number) => Math.round(n * 100) / 100
const WEEKEND_UPLIFT = 1.25

/** Seasonal weeknight list price for the listing (prototype model). */
function seasonBase(date: string): number {
  const d = parseISO(date)
  const m = d.getMonth() + 1
  const day = d.getDate()
  if (m === 3) return 168 // SXSW / spring festival season
  if (m === 10) return 158 // ACL Festival
  if ((m === 12 && day >= 18) || (m === 1 && day <= 3)) return 145 // holidays
  if (m >= 6 && m <= 8) return 132 // summer
  if (m === 4 || m === 5 || m === 9) return 121 // spring / early fall
  if (m === 11 && day >= 20) return 118 // Thanksgiving week
  return 104 // off-season
}

export function isWeekendNight(date: string): boolean {
  const dow = parseISO(date).getDay()
  return dow === 5 || dow === 6
}

/** List price shown on calendar days that are not part of the selected booking. */
export function listRateFor(date: string): number {
  return round2(seasonBase(date) * (isWeekendNight(date) ? WEEKEND_UPLIFT : 1))
}

function discountFor(b: Booking, date: string): { label: string; pct: number } | null {
  const dow = parseISO(date).getDay()
  if (b.stay.nights >= 7) return { label: 'Weekly stay', pct: 0.1 }
  if (b.stay.nights >= 5 && (dow === 2 || dow === 3)) return { label: 'Midweek', pct: 0.1 }
  return null
}

/** Per-night rates for a booking, scaled so that Σ rate === dataset base amount. */
export function nightlyRatesFor(b: Booking): NightRate[] {
  const baseLine = b.lineItems.find((l) => l.type === 'base')
  if (!baseLine) return []
  const base = baseLine.amount

  const nights = Array.from({ length: b.stay.nights }, (_, i) => addDays(b.stay.checkIn, i))
  // Relative weights: weekend uplift and per-night discounts, before scaling to the dataset.
  const weights = nights.map((date) => {
    const w = isWeekendNight(date) ? WEEKEND_UPLIFT : 1
    const d = discountFor(b, date)
    return { date, list: w, net: w * (1 - (d?.pct ?? 0)), discount: d }
  })
  const unit = base / weights.reduce((s, x) => s + x.net, 0)

  const out: NightRate[] = weights.map((x) => ({
    date: x.date,
    rate: round2(unit * x.net),
    listRate: round2(unit * x.list),
    weekend: x.list > 1,
    discount: x.discount,
  }))
  // Put the rounding residual on the last night so the sum is exact.
  const sum = round2(out.reduce((s, n) => s + n.rate, 0))
  const residual = round2(base - sum)
  if (residual !== 0) {
    const last = out[out.length - 1]
    last.rate = round2(last.rate + residual)
    if (!last.discount) last.listRate = last.rate
  }
  return out
}
