import { useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Booking, Dataset } from '../../lib/types'
import { addDays, money, parseISO, toISO } from '../../lib/format'
import { listRateFor, nightlyRatesFor, type NightRate } from '../prototype-additions'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/**
 * Collapsed: "6 nights · $732.14 stay revenue · $122.02 avg/night" + "View nightly rates".
 * Expanded: a month calendar with the price under each date, this booking's nights highlighted,
 * discounted nights marked. Rates on non-booking days come from the prototype rate model.
 */
export function NightlyRates({ ds, booking }: { ds: Dataset; booking: Booking }) {
  const [open, setOpen] = useState(false)
  const nights = useMemo(() => nightlyRatesFor(booking), [booking])
  const base = booking.lineItems.find((l) => l.type === 'base')!.amount
  const avg = base / booking.stay.nights
  const byDate = useMemo(() => new Map(nights.map((n) => [n.date, n])), [nights])

  const ci = parseISO(booking.stay.checkIn)
  const [month, setMonth] = useState({ y: ci.getFullYear(), m: ci.getMonth() })

  const discountKinds = Array.from(new Set(nights.filter((n) => n.discount).map((n) => n.discount!.label)))
  const weekendCount = nights.filter((n) => n.weekend).length

  return (
    <section className="sec" aria-labelledby="nr-title">
      <div className="sec-head">
        <div>
          <h2 className="sec-title" id="nr-title">
            What was booked
          </h2>
          <p className="sec-summary">
            {booking.stay.nights} nights · <strong>{money(base)}</strong> stay revenue · <span className="avg">{money(avg)} avg/night</span>
          </p>
        </div>
        <button className="disclose" aria-expanded={open} aria-controls="nr-body" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide nightly rates' : 'View nightly rates'}
          <ChevronDown size={15} className={`chev ${open ? 'is-open' : ''}`} aria-hidden />
        </button>
      </div>

      {open ? (
        <div id="nr-body" className="nr-body">
          <Calendar
            y={month.y}
            m={month.m}
            onPrev={() => setMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}
            onNext={() => setMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))}
            byDate={byDate}
            booking={booking}
            ds={ds}
          />

          <div className="nr-legend" aria-hidden>
            <span>
              <i className="lg lg-booked" /> This booking
            </span>
            <span>
              <i className="lg lg-discount" /> Discounted night
            </span>
            <span>
              <i className="lg lg-other" /> Other bookings
            </span>
            <span>
              <i className="lg lg-blocked" /> Blocked
            </span>
          </div>

          <ul className="nr-why">
            {weekendCount ? (
              <li>
                {weekendCount === 1 ? 'One night' : `${weekendCount} nights`} fell on a Friday or Saturday. Weekend nights are priced above weeknights.
              </li>
            ) : null}
            {discountKinds.includes('Midweek') ? (
              <li>Tuesday and Wednesday nights carry a 10% midweek discount on stays of 5 nights or more. It fills the nights that are hardest to sell.</li>
            ) : null}
            {discountKinds.includes('Weekly') ? <li>Stays of 7 nights or more get 10% off every night.</li> : null}
            <li className="nr-proto">
              Prototype note: nightly rates and discounts are illustrative. The dataset holds one total per booking; these nights sum to it exactly.
            </li>
          </ul>

          <table className="nr-table">
            <caption className="sr-only">Nightly rates for this booking</caption>
            <tbody>
              {nights.map((n) => (
                <tr key={n.date} className={n.discount ? 'is-discount' : ''}>
                  <td className="nr-date">{fmtNight(n.date)}</td>
                  <td className="nr-kind">
                    {n.weekend ? 'Weekend rate' : 'Weekday rate'}
                    {n.discount ? ` · ${n.discount.label} −${Math.round(n.discount.pct * 100)}%` : ''}
                  </td>
                  <td className="nr-amt">
                    {n.discount ? <s>{money(n.listRate)}</s> : null} {money(n.rate)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row" colSpan={2}>
                  Stay revenue
                </th>
                <td className="nr-amt">{money(base)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      ) : null}
    </section>
  )
}

function fmtNight(iso: string) {
  const d = parseISO(iso)
  return `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]}, ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`
}

interface CalProps {
  y: number
  m: number
  onPrev: () => void
  onNext: () => void
  byDate: Map<string, NightRate>
  booking: Booking
  ds: Dataset
}

function Calendar({ y, m, onPrev, onNext, byDate, booking, ds }: CalProps) {
  const first = new Date(y, m, 1)
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const lead = first.getDay()
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(y, m, i + 1)))]
  while (cells.length % 7) cells.push(null)

  // Which dates belong to other bookings or owner blocks (nights, i.e. check-in ≤ d < check-out).
  const occupancy = useMemo(() => {
    const map = new Map<string, { kind: 'other' | 'blocked'; rate?: number; guest?: string }>()
    for (const b of ds.bookings) {
      if (b.id === booking.id || b.status === 'canceled') continue
      if (b.status === 'blocked') {
        for (let d = b.stay.checkIn; d < b.stay.checkOut; d = addDays(d, 1)) map.set(d, { kind: 'blocked' })
      } else {
        for (const n of nightlyRatesFor(b)) map.set(n.date, { kind: 'other', rate: n.rate, guest: b.guest?.name ?? 'guest' })
      }
    }
    return map
  }, [ds, booking.id])

  const today = ds.meta.todayForExercise

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="cal-nav" onClick={onPrev} aria-label="Previous month">
          <ChevronLeft size={16} />
        </button>
        <span className="cal-month">
          {MONTHS[m]} {y}
        </span>
        <button className="cal-nav" onClick={onNext} aria-label="Next month">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="cal-grid" role="grid">
        {DOW.map((d) => (
          <div key={d} className="cal-dow" role="columnheader">
            {d}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} className="cal-cell is-empty" />
          const night = byDate.get(date)
          const occ = occupancy.get(date)?.kind
          const other = occupancy.get(date)
          const isCheckout = date === booking.stay.checkOut
          const cls = ['cal-cell']
          if (night) cls.push('is-booked')
          if (night?.discount) cls.push('is-discount')
          if (date === booking.stay.checkIn) cls.push('is-start')
          if (date === addDays(booking.stay.checkOut, -1)) cls.push('is-end')
          if (isCheckout) cls.push('is-checkout')
          if (occ === 'other') cls.push('is-other')
          if (occ === 'blocked') cls.push('is-blocked')
          if (date === today) cls.push('is-today')
          const label = night
            ? `${date}: ${money(night.rate)}${night.discount ? `, ${night.discount.label} discount` : ''}, this booking`
            : occ === 'blocked'
              ? `${date}: blocked by you`
              : occ === 'other'
                ? `${date}: booked by ${other!.guest}, ${money(other!.rate!)}`
                : `${date}: list rate ${money(listRateFor(date))}`
          return (
            <div key={date} className={cls.join(' ')} role="gridcell" aria-label={label} title={label}>
              <span className="cal-day">{parseISO(date).getDate()}</span>
              {night ? (
                <span className="cal-rate">
                  {night.discount ? <s>{Math.round(night.listRate)}</s> : null}${Math.round(night.rate)}
                </span>
              ) : occ === 'blocked' ? (
                <span className="cal-rate cal-muted">—</span>
              ) : occ === 'other' ? (
                <span className="cal-rate cal-muted">${Math.round(other!.rate!)}</span>
              ) : (
                <span className="cal-rate cal-muted">${Math.round(listRateFor(date))}</span>
              )}
              {night?.discount ? <span className="cal-tag">−{Math.round(night.discount.pct * 100)}%</span> : null}
              {isCheckout && !night ? <span className="cal-tag cal-tag-out">Check-out</span> : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}
