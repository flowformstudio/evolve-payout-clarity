import type { Booking, Dataset } from './types'
import { addDays, daysBetween, parseISO } from './format'

/**
 * Everything the UI needs about a booking's money, derived from the raw dataset.
 *
 * ASSUMPTIONS (the dataset is left untouched; these are derived here and called out in the UI):
 *  1. The dataset gives one "Rate for N Nights" line. To answer "what rates were the nights booked at"
 *     we split it into per-night rates: Friday and Saturday nights are priced 25% above weeknights.
 *  2. Discounts are inferred from booking facts, since the dataset has none:
 *       - 7+ nights            → 10% weekly-stay discount
 *       - booked ≤ 3 days out  → 12% last-minute rate
 *       - returning guest      → 5% returning-guest discount
 *     Nightly rates are grossed up so that (sum of nights − discounts) equals the dataset's base amount
 *     to the cent. The payout math is never altered.
 *  3. Season labels are Austin-specific and month-based (SXSW in March, ACL in October, and so on).
 */

export type Phase = 'completed' | 'in_progress' | 'upcoming' | 'canceled' | 'blocked'

export interface Night {
  date: string
  rate: number
  weekend: boolean
}

export interface Adjustment {
  id: 'weekly' | 'last_minute' | 'returning'
  label: string
  detail: string
  pct: number
  amount: number
}

export interface RateInsight {
  kind: 'season' | 'weekend' | 'lead' | 'vs_average' | 'discount' | 'minstay'
  text: string
}

export interface MoneyView {
  base: number
  cleaning: number
  taxes: { name: string; rate: number; amount: number }[]
  taxTotal: number
  guestPaid: number
  managementFee: number
  managementRate: number
  payout: number
}

export interface BookingView {
  booking: Booking
  phase: Phase
  nights: Night[]
  nightsSubtotal: number
  adjustments: Adjustment[]
  avgNightly: number
  listingAvgNightly: number
  insights: RateInsight[]
  money: MoneyView | null
  leadDays: number
  timeline: { key: string; label: string; date: string; done: boolean; note?: string }[]
}

const WEEKEND_UPLIFT = 1.25

export function phaseOf(b: Booking): Phase {
  switch (b.status) {
    case 'checked_out':
      return 'completed'
    case 'checked_in':
      return 'in_progress'
    case 'booked':
      return 'upcoming'
    case 'canceled':
      return 'canceled'
    default:
      return 'blocked'
  }
}

const round2 = (n: number) => Math.round(n * 100) / 100

export function seasonFor(checkIn: string): { label: string; peak: boolean; note: string } {
  const d = parseISO(checkIn)
  const m = d.getMonth() + 1
  const day = d.getDate()
  if (m === 3) return { label: 'SXSW season', peak: true, note: 'March is Austin’s busiest month. Demand around SXSW lifts nightly rates across the city.' }
  if (m === 10) return { label: 'ACL Festival season', peak: true, note: 'Austin City Limits weekends push October demand well above the yearly average.' }
  if ((m === 12 && day >= 18) || (m === 1 && day <= 3)) return { label: 'Holiday season', peak: true, note: 'Christmas and New Year travel keeps rates elevated.' }
  if (m === 11 && day >= 20 && day <= 30) return { label: 'Thanksgiving week', peak: false, note: 'Family travel week with moderate demand.' }
  if (m >= 6 && m <= 8) return { label: 'Summer', peak: false, note: 'Steady leisure demand through the summer.' }
  if (m === 4 || m === 5) return { label: 'Spring', peak: false, note: 'Pleasant weather and event weekends keep spring demand healthy.' }
  return { label: 'Off-season', peak: false, note: 'Quieter travel months. Rates are set to keep the calendar filled.' }
}

function adjustmentsFor(b: Booking): Omit<Adjustment, 'amount'>[] {
  const out: Omit<Adjustment, 'amount'>[] = []
  const lead = daysBetween(b.dateBooked, b.stay.checkIn)
  if (b.stay.nights >= 7) {
    out.push({ id: 'weekly', label: 'Weekly stay discount', detail: 'Applied automatically to stays of 7 nights or more.', pct: 0.1 })
  }
  if (lead <= 3) {
    out.push({ id: 'last_minute', label: 'Last-minute rate', detail: `Booked ${lead === 0 ? 'the day of' : `${lead} day${lead === 1 ? '' : 's'} before`} check-in. A lower rate filled nights that would otherwise stay empty.`, pct: 0.12 })
  }
  if (b.returningGuest) {
    out.push({ id: 'returning', label: 'Returning guest discount', detail: 'This guest has stayed at your listing before.', pct: 0.05 })
  }
  return out
}

/** Split the dataset's single base amount into nightly rates plus any inferred discounts. */
function splitNights(b: Booking, base: number): { nights: Night[]; subtotal: number; adjustments: Adjustment[] } {
  const adjDefs = adjustmentsFor(b)
  const totalPct = adjDefs.reduce((s, a) => s + a.pct, 0)
  const gross = base / (1 - totalPct)

  const dates: string[] = []
  for (let i = 0; i < b.stay.nights; i++) dates.push(addDays(b.stay.checkIn, i))
  const weights = dates.map((d) => {
    const dow = parseISO(d).getDay()
    return dow === 5 || dow === 6 ? WEEKEND_UPLIFT : 1
  })
  const unit = gross / weights.reduce((s, w) => s + w, 0)

  let nights: Night[] = dates.map((date, i) => ({ date, rate: round2(unit * weights[i]), weekend: weights[i] > 1 }))
  let subtotal = round2(nights.reduce((s, n) => s + n.rate, 0))

  // Allocate discount amounts so that subtotal − discounts === base exactly.
  const adjustments: Adjustment[] = adjDefs.map((a) => ({ ...a, amount: round2(gross * a.pct) }))
  const discountSum = round2(adjustments.reduce((s, a) => s + a.amount, 0))
  const residual = round2(subtotal - discountSum - base)
  if (residual !== 0) {
    if (adjustments.length) {
      adjustments[adjustments.length - 1].amount = round2(adjustments[adjustments.length - 1].amount + residual)
    } else {
      const last = nights[nights.length - 1]
      nights = [...nights.slice(0, -1), { ...last, rate: round2(last.rate - residual) }]
      subtotal = round2(nights.reduce((s, n) => s + n.rate, 0))
    }
  }
  return { nights, subtotal, adjustments }
}

export function listingAverageNightly(ds: Dataset): number {
  let base = 0
  let nights = 0
  for (const b of ds.bookings) {
    if (b.status === 'blocked' || b.status === 'canceled') continue
    const line = b.lineItems.find((l) => l.type === 'base')
    if (!line) continue
    base += line.amount
    nights += b.stay.nights
  }
  return nights ? base / nights : 0
}

export function buildView(ds: Dataset, b: Booking, listingAvg: number): BookingView {
  const phase = phaseOf(b)
  const today = ds.meta.todayForExercise
  const leadDays = daysBetween(b.dateBooked, b.stay.checkIn)

  if (phase === 'blocked') {
    return {
      booking: b,
      phase,
      nights: [],
      nightsSubtotal: 0,
      adjustments: [],
      avgNightly: 0,
      listingAvgNightly: listingAvg,
      insights: [],
      money: null,
      leadDays,
      timeline: [],
    }
  }

  const baseLine = b.lineItems.find((l) => l.type === 'base')!
  const cleaning = b.lineItems.find((l) => l.type === 'fee')?.amount ?? 0
  const taxes = b.lineItems
    .filter((l) => l.type === 'tax')
    .map((l) => ({ name: l.description, amount: l.amount, rate: ds.taxes.find((t) => t.name === l.description)?.rate ?? 0 }))
  const taxTotal = round2(taxes.reduce((s, t) => s + t.amount, 0))
  const base = baseLine.amount
  const guestPaid = round2(base + cleaning + taxTotal)
  // For a canceled booking the file records $0 fee and $0 payout. The ledger shows what the stay
  // would have been worth, and the hero states the $0 plainly.
  const wouldHaveBeen = phase === 'canceled'
  const managementFee = wouldHaveBeen ? round2(base * ds.listing.managementFeeRate) : b.payout?.managementFee ?? round2(base * ds.listing.managementFeeRate)

  const { nights, subtotal, adjustments } = splitNights(b, base)
  const avgNightly = base / b.stay.nights
  const season = seasonFor(b.stay.checkIn)

  const insights: RateInsight[] = []
  const delta = (avgNightly - listingAvg) / listingAvg
  if (Math.abs(delta) >= 0.05) {
    insights.push({
      kind: 'vs_average',
      text: `${Math.round(Math.abs(delta) * 100)}% ${delta > 0 ? 'above' : 'below'} your listing’s average of $${Math.round(listingAvg)} per night.`,
    })
  } else {
    insights.push({ kind: 'vs_average', text: `In line with your listing’s average of $${Math.round(listingAvg)} per night.` })
  }
  insights.push({ kind: 'season', text: `${season.label}. ${season.note}` })
  const weekendNights = nights.filter((n) => n.weekend).length
  if (weekendNights) {
    insights.push({ kind: 'weekend', text: `${weekendNights} of ${nights.length} nights fell on a Friday or Saturday, priced 25% above weeknights.` })
  }
  if (leadDays > 3) {
    insights.push({ kind: 'lead', text: `Booked ${leadDays} days ahead of check-in at the standard rate for those dates.` })
  }
  for (const a of adjustments) insights.push({ kind: 'discount', text: `${a.label}: ${a.detail}` })

  const money: MoneyView = {
    base,
    cleaning,
    taxes,
    taxTotal,
    guestPaid,
    managementFee,
    managementRate: ds.listing.managementFeeRate,
    payout: wouldHaveBeen ? round2(base + cleaning - managementFee) : b.payout?.amount ?? 0,
  }

  const p = b.payout!
  const depositDate = p.depositedDate ?? p.expectedDepositDate
  const timeline = [
    { key: 'booked', label: 'Booked', date: b.dateBooked, done: true, note: b.bookingSite ? `via ${b.bookingSite}` : undefined },
    { key: 'checkin', label: 'Check-in', date: b.stay.checkIn, done: b.stay.checkIn <= today && phase !== 'canceled' },
    {
      key: 'deposit',
      label: p.status === 'paid' ? 'Deposited' : phase === 'canceled' ? 'No deposit' : 'Deposit expected',
      date: depositDate ?? b.stay.checkIn,
      done: p.status === 'paid',
      note: p.status === 'paid' ? `to ${ds.owner.bankAccount.institution} ••${ds.owner.bankAccount.lastFour}` : undefined,
    },
    { key: 'checkout', label: 'Check-out', date: b.stay.checkOut, done: b.stay.checkOut <= today && phase !== 'canceled' },
  ].sort((a, z) => (a.date < z.date ? -1 : a.date > z.date ? 1 : 0))

  return {
    booking: b,
    phase,
    nights,
    nightsSubtotal: subtotal,
    adjustments,
    avgNightly,
    listingAvgNightly: listingAvg,
    insights,
    money,
    leadDays,
    timeline,
  }
}

/** Year-to-date and pipeline totals for the header context strip. */
export function summarize(ds: Dataset) {
  const today = ds.meta.todayForExercise
  const year = today.slice(0, 4)
  let paidYtd = 0
  let pending = 0
  let scheduled = 0
  let nightsYtd = 0
  for (const b of ds.bookings) {
    if (!b.payout) continue
    if (b.payout.status === 'paid') {
      if ((b.payout.depositedDate ?? '').startsWith(year)) {
        paidYtd += b.payout.amount
        nightsYtd += b.stay.nights
      }
    } else if (b.payout.status === 'pending') pending += b.payout.amount
    else if (b.payout.status === 'scheduled') scheduled += b.payout.amount
  }
  return { paidYtd, pending, scheduled, nightsYtd, year }
}
