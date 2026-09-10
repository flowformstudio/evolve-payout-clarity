import { useMemo } from 'react'
import type { Booking, Dataset } from '../lib/types'
import { addDays, money, parseISO, toISO } from '../lib/format'
import { listRateFor, nightlyRatesFor } from '../v2/prototype-additions'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

/**
 * Compact month view for the payout banner: every day of the check-in month with its price,
 * this booking's nights drawn as a band. Read-only; the full calendar below has the detail.
 */
export function MiniMonth({ ds, booking }: { ds: Dataset; booking: Booking }) {
  const nights = useMemo(() => nightlyRatesFor(booking), [booking])
  const byDate = useMemo(() => new Map(nights.map((n) => [n.date, n])), [nights])
  const ci = parseISO(booking.stay.checkIn)
  const y = ci.getFullYear()
  const m = ci.getMonth()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const lead = new Date(y, m, 1).getDay()
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => toISO(new Date(y, m, i + 1)))]
  while (cells.length % 7) cells.push(null)

  const occupied = useMemo(() => {
    const set = new Map<string, 'other' | 'blocked'>()
    for (const b of ds.bookings) {
      if (b.id === booking.id || b.status === 'canceled') continue
      for (let d = b.stay.checkIn; d < b.stay.checkOut; d = addDays(d, 1)) set.set(d, b.status === 'blocked' ? 'blocked' : 'other')
    }
    return set
  }, [ds, booking.id])

  const base = booking.lineItems.find((l) => l.type === 'base')!.amount
  const today = ds.meta.todayForExercise

  return (
    <div className="mm" aria-label={`${MONTHS[m]} ${y} nightly rates, this booking highlighted`}>
      <div className="mm-head">
        <span className="mm-month">
          {MONTHS[m]} {y}
        </span>
        <span className="mm-sum">
          {nights.length} nights · {money(base)}
        </span>
      </div>
      <div className="mm-grid">
        {DOW.map((d, i) => (
          <span key={i} className="mm-dow">
            {d}
          </span>
        ))}
        {cells.map((date, i) => {
          if (!date) return <span key={`e${i}`} className="mm-cell is-empty" />
          const night = byDate.get(date)
          const occ = occupied.get(date)
          const cls = ['mm-cell']
          if (night) cls.push('is-booked')
          if (night?.discount) cls.push('is-discount')
          if (date === booking.stay.checkIn) cls.push('is-start')
          if (date === addDays(booking.stay.checkOut, -1)) cls.push('is-end')
          if (!night && occ) cls.push(`is-${occ}`)
          if (date === today) cls.push('is-today')
          const rate = night ? night.rate : listRateFor(date)
          return (
            <span key={date} className={cls.join(' ')} title={night ? `${date}: ${money(night.rate)}${night.discount ? `, ${night.discount.label} −${Math.round(night.discount.pct * 100)}%` : ''}` : undefined}>
              <span className="mm-day">{parseISO(date).getDate()}</span>
              <span className="mm-rate">${Math.round(rate)}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
