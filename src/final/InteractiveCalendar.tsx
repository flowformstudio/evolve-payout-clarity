import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { Booking, Dataset } from '../lib/types'
import { addDays, money, parseISO, toISO } from '../lib/format'
import { seasonFor } from '../lib/derive'
import { Info } from '../v2/components/Info'
import { isWeekendNight, listRateFor, nightlyRatesFor, type NightRate } from '../v2/prototype-additions'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const DOW_LONG = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type Occ = { kind: 'other' | 'blocked'; guest?: string; rate?: number; discount?: NightRate['discount'] }

interface DayInfo {
  date: string
  night: NightRate | null
  nightIndex: number
  occ: Occ | null
  rate: number
  listRate: number
  isCheckout: boolean
  isToday: boolean
}

/**
 * Month calendar with the price under every date. Hover previews, click pins a card that
 * explains why that night costs what it costs. Keyboard: arrow keys move, Enter pins, Esc closes.
 */
export function InteractiveCalendar({ ds, booking }: { ds: Dataset; booking: Booking }) {
  const nights = useMemo(() => nightlyRatesFor(booking), [booking])
  const byDate = useMemo(() => new Map(nights.map((n) => [n.date, n])), [nights])
  const ci = parseISO(booking.stay.checkIn)
  const [month, setMonth] = useState({ y: ci.getFullYear(), m: ci.getMonth() })
  const [hover, setHover] = useState<string | null>(null)
  // `?pin=YYYY-MM-DD` opens a day card on load (used for design captures).
  const [pinned, setPinned] = useState<string | null>(() => new URLSearchParams(location.search).get('pin'))
  const gridRef = useRef<HTMLDivElement>(null)
  const today = ds.meta.todayForExercise

  const lastBooking = useRef(booking.id)
  useEffect(() => {
    if (lastBooking.current === booking.id) return // first mount (also under StrictMode's double run): keep a URL-pinned card
    lastBooking.current = booking.id
    setMonth({ y: ci.getFullYear(), m: ci.getMonth() })
    setPinned(null)
    setHover(null)
  }, [booking.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const occupancy = useMemo(() => {
    const map = new Map<string, Occ>()
    for (const b of ds.bookings) {
      if (b.id === booking.id || b.status === 'canceled') continue
      if (b.status === 'blocked') {
        for (let d = b.stay.checkIn; d < b.stay.checkOut; d = addDays(d, 1)) map.set(d, { kind: 'blocked' })
      } else {
        for (const n of nightlyRatesFor(b)) map.set(n.date, { kind: 'other', guest: b.guest?.name ?? 'a guest', rate: n.rate, discount: n.discount })
      }
    }
    return map
  }, [ds, booking.id])

  const { y, m } = month
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const lead = new Date(y, m, 1).getDay()
  const cells: (DayInfo | null)[] = [...Array(lead).fill(null)]
  for (let i = 1; i <= daysInMonth; i++) {
    const date = toISO(new Date(y, m, i))
    const night = byDate.get(date) ?? null
    const occ = occupancy.get(date) ?? null
    const rate = night ? night.rate : occ?.kind === 'other' ? occ.rate! : listRateFor(date)
    cells.push({
      date,
      night,
      nightIndex: night ? Math.round((parseISO(date).getTime() - ci.getTime()) / 86400000) + 1 : 0,
      occ,
      rate,
      listRate: night ? night.listRate : rate,
      isCheckout: date === booking.stay.checkOut,
      isToday: date === today,
    })
  }
  while (cells.length % 7) cells.push(null)

  const active = pinned ?? hover
  const activeInfo = cells.find((c) => c && c.date === active) ?? null
  const activeIndex = cells.findIndex((c) => c && c.date === active)
  const [pos, setPos] = useState<{ left: number; top: number; above: boolean } | null>(null)
  useLayoutEffect(() => {
    if (!active || !gridRef.current) { setPos(null); return }
    const host = gridRef.current
    const cell = host.querySelector<HTMLElement>(`[data-date="${active}"]`)
    if (!cell) { setPos(null); return }
    const h = host.getBoundingClientRect(), r = cell.getBoundingClientRect()
    const col = activeIndex % 7, row = Math.floor(activeIndex / 7), rows = cells.length / 7
    const CARD = 272
    const left = col >= 4 ? r.right - h.left - CARD : r.left - h.left
    const above = row >= rows - 2
    setPos({ left: Math.max(0, Math.min(left, h.width - CARD)), top: above ? r.top - h.top - 8 : r.bottom - h.top + 8, above })
  }, [active, activeIndex, cells.length, month])

  useEffect(() => {
    if (!pinned) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPinned(null)
    const onDoc = (e: MouseEvent) => {
      if (!gridRef.current?.contains(e.target as Node)) setPinned(null)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDoc)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDoc)
    }
  }, [pinned])

  const onKeyNav = (e: React.KeyboardEvent, idx: number) => {
    const delta = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 7, ArrowUp: -7 }[e.key]
    if (delta === undefined) return
    e.preventDefault()
    let j = idx + delta
    while (j >= 0 && j < cells.length && !cells[j]) j += Math.sign(delta)
    const target = gridRef.current?.querySelectorAll<HTMLButtonElement>('button.fc-day')[cells.slice(0, j).filter(Boolean).length]
    target?.focus()
  }

  return (
    <div className="fc" ref={gridRef}>
      <div className="fc-head">
        <span className="fc-month">
          {MONTHS[m]} {y}
          <Info label="What the calendar colors mean">
            <span className="fc-legend-title">What the colors mean</span>
            <span className="fc-legend-row">
              <i className="fc-lg is-booked" /> This booking’s nights
            </span>
            <span className="fc-legend-row">
              <i className="fc-lg is-open" /> Open, listed at that price
            </span>
            <span className="fc-legend-row">
              <i className="fc-lg is-other" /> Booked by another guest
            </span>
            <span className="fc-legend-row">
              <i className="fc-lg is-blocked" /> Blocked by you
            </span>
            <span className="fc-legend-row">
              <i className="fc-lg is-today" /> Today
            </span>
            <span className="fc-legend-foot">Hover a date for the reason behind its price. Click to keep the card open.</span>
          </Info>
        </span>
        <span className="fc-nav">
          {month.y !== ci.getFullYear() || month.m !== ci.getMonth() ? (
            <button className="fc-navbtn fc-back" onClick={() => setMonth({ y: ci.getFullYear(), m: ci.getMonth() })}>
              This booking
            </button>
          ) : null}
          <button className="fc-navbtn" aria-label="Previous month" onClick={() => setMonth(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}>
            <ChevronLeft size={16} />
          </button>
          <button className="fc-navbtn" aria-label="Next month" onClick={() => setMonth(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))}>
            <ChevronRight size={16} />
          </button>
        </span>
      </div>

      <div className="fc-grid" role="grid" aria-label={`${MONTHS[m]} ${y} nightly rates`}>
        {DOW.map((d, i) => (
          <span key={i} className="fc-dow" role="columnheader">
            {d}
          </span>
        ))}
        {cells.map((c, i) => {
          if (!c) return <span key={`e${i}`} className="fc-cell is-empty" aria-hidden />
          const cls = ['fc-day']
          if (c.night) cls.push('is-booked')
          if (c.night?.discount) cls.push('is-discount')
          if (c.date === booking.stay.checkIn) cls.push('is-start')
          if (c.date === addDays(booking.stay.checkOut, -1)) cls.push('is-end')
          if (!c.night && c.occ) cls.push(`is-${c.occ.kind}`)
          if (c.isToday) cls.push('is-today')
          if (c.date === active) cls.push('is-active')
          if (c.date === pinned) cls.push('is-pinned')
          return (
            <button
              key={c.date}
              type="button"
              className={cls.join(' ')}
              data-date={c.date}
              role="gridcell"
              aria-pressed={c.date === pinned}
              aria-label={ariaFor(c, booking)}
              onMouseEnter={() => setHover(c.date)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(c.date)}
              onBlur={() => setHover(null)}
              onClick={() => setPinned((p) => (p === c.date ? null : c.date))}
              onKeyDown={(e) => onKeyNav(e, i)}
            >
              <span className="fc-num">{parseISO(c.date).getDate()}</span>
              <span className="fc-rate">
                {c.night?.discount ? <s>{Math.round(c.listRate)}</s> : null}${Math.round(c.rate)}
              </span>
            </button>
          )
        })}
      </div>

      {activeInfo && pos ? (
        <DayCard info={activeInfo} booking={booking} ds={ds} pos={pos} pinned={pinned === activeInfo.date} onClose={() => setPinned(null)} />
      ) : null}

    </div>
  )
}

function ariaFor(c: DayInfo, booking: Booking) {
  const d = parseISO(c.date)
  const day = `${DOW_LONG[d.getDay()]} ${MONTHS[d.getMonth()]} ${d.getDate()}`
  if (c.night) return `${day}, ${money(c.rate)}, this booking night ${c.nightIndex} of ${booking.stay.nights}${c.night.discount ? `, ${c.night.discount.label} discount` : ''}`
  if (c.occ?.kind === 'blocked') return `${day}, blocked by you, list price ${money(c.rate)}`
  if (c.occ?.kind === 'other') return `${day}, booked by ${c.occ.guest}, ${money(c.rate)}`
  return `${day}, open, list price ${money(c.rate)}`
}

interface CardProps {
  info: DayInfo
  booking: Booking
  ds: Dataset
  pos: { left: number; top: number; above: boolean }
  pinned: boolean
  onClose: () => void
}

/** The explanation card. Same shape for every kind of day so the owner learns it once. */
function DayCard({ info, booking, ds, pos, pinned, onClose }: CardProps) {
  const d = parseISO(info.date)
  const dow = DOW_LONG[d.getDay()]
  const season = seasonFor(info.date)
  const weekend = isWeekendNight(info.date)
  const feeRate = ds.listing.managementFeeRate
  const disc = info.night?.discount ?? info.occ?.discount ?? null

  let kind: { label: string; tone: string }
  if (info.night) kind = { label: `This booking · Night ${info.nightIndex} of ${booking.stay.nights}`, tone: 'booked' }
  else if (info.occ?.kind === 'blocked') kind = { label: 'Blocked by you', tone: 'blocked' }
  else if (info.occ?.kind === 'other') kind = { label: `Booked by ${info.occ.guest}`, tone: 'other' }
  else if (info.isCheckout) kind = { label: 'Check-out day · open for a new guest', tone: 'open' }
  else kind = { label: 'Open · list price', tone: 'open' }

  const style = { left: pos.left, top: pos.top, transform: pos.above ? 'translateY(-100%)' : undefined } as React.CSSProperties

  return (
    <div className={`fc-card tone-${kind.tone} ${pinned ? 'is-pinned' : ''}`} style={style} role="dialog" aria-label={`Rate details for ${dow}, ${MONTHS[d.getMonth()]} ${d.getDate()}`}>
      <div className="fc-card-head">
        <div>
          <div className="fc-card-date">
            {dow}, {MONTHS[d.getMonth()]} {d.getDate()}
          </div>
          <div className={`fc-card-kind`}>{kind.label}</div>
        </div>
        {pinned ? (
          <button className="fc-card-close" onClick={onClose} aria-label="Close">
            <X size={14} />
          </button>
        ) : null}
      </div>

      <div className="fc-card-price">
        {disc ? <s>{money(info.listRate)}</s> : null}
        <strong>{money(info.rate)}</strong>
        <span className="fc-card-per">per night</span>
      </div>

      <dl className="fc-card-rows">
        <div>
          <dt>Rate type</dt>
          <dd>{weekend ? 'Weekend rate' : 'Weekday rate'}</dd>
        </div>
        <div>
          <dt>Season</dt>
          <dd>{season.label}</dd>
        </div>
        {disc ? (
          <div className="is-discount">
            <dt>Discount</dt>
            <dd>
              {disc.label} −{Math.round(disc.pct * 100)}% <span className="fc-dim">(−{money(info.listRate - info.rate)})</span>
            </dd>
          </div>
        ) : null}
        {info.night ? (
          <div className="is-you">
            <dt>Your share</dt>
            <dd>
              {money(info.rate * (1 - feeRate))} <span className="fc-dim">after {Math.round(feeRate * 100)}% fee</span>
            </dd>
          </div>
        ) : null}
      </dl>

    </div>
  )
}
