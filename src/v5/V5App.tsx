import { useEffect, useMemo, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import raw from '../data/payouts-dataset.json'
import type { Dataset } from '../lib/types'
import { fmtDate, fmtRange, plural } from '../lib/format'
import { phaseOf } from '../lib/derive'
import { EarningsCard } from './EarningsCard'
import { NightlyRates } from '../v2/components/NightlyRates'
import { BookingStateSwitcher, type DemoState } from '../v2/components/BookingStateSwitcher'
import { Assumptions } from '../components/Assumptions'
import '../v2/v2.css'
import '../v3/v3.css'
import '../v4/v4.css'
import './v5.css'

const ds = raw as unknown as Dataset

/**
 * Option 5. One earnings card with a "You earn | Guest paid" switch, the way Airbnb and VRBO
 * show it. Same ledger shape on both sides so the owner can see exactly where the totals diverge.
 */
const DEFAULT_ID = '15932931'
const DEMO_STATES: DemoState[] = [
  { key: 'pending', label: 'Pending', id: '15932931' },
  { key: 'paid', label: 'Paid', id: '15415011' },
  { key: 'scheduled', label: 'Scheduled', id: '15990957' },
  { key: 'canceled', label: 'Canceled', id: 'Z87337818' },
]

const STATUS: Record<string, string> = {
  in_progress: 'Currently staying',
  upcoming: 'Upcoming stay',
  completed: 'Stay completed',
  canceled: 'Canceled',
  blocked: 'Owner block',
}

function idFromHash(): string | null {
  const m = location.hash.match(/#\/v5\/bookings\/([^/?]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function V5App() {
  const [id, setId] = useState<string>(() => idFromHash() ?? DEFAULT_ID)
  const [showAssumptions, setShowAssumptions] = useState(false)
  const today = ds.meta.todayForExercise

  useEffect(() => {
    const onHash = () => {
      const h = idFromHash()
      if (h && ds.bookings.some((b) => b.id === h)) setId(h)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const select = (next: string) => {
    setId(next)
    history.replaceState(null, '', `#/v5/bookings/${encodeURIComponent(next)}`)
    window.scrollTo({ top: 0 })
  }

  const booking = useMemo(() => ds.bookings.find((b) => b.id === id) ?? ds.bookings[0], [id])
  const blocked = booking.status === 'blocked'
  const phase = phaseOf(booking)
  const g = booking.guest
  const site = booking.bookingSite === 'Evolve' ? 'Evolve direct' : booking.bookingSite

  return (
    <div className="v2 v3 v4 v5">
      <header className="shell">
        <div className="shell-inner">
          <a className="wordmark" href="#/v5" aria-label="Evolve owner portal">
            <img src="/evolve-logo.svg" alt="Evolve" className="wordmark-logo" />
          </a>
          <nav className="shell-nav" aria-label="Primary">
            {['Overview', 'Calendar', 'Bookings', 'Performance', 'Payouts'].map((n) => (
              <a key={n} href="#/v5" className={n === 'Bookings' ? 'is-active' : ''} onClick={(e) => e.preventDefault()}>
                {n}
              </a>
            ))}
          </nav>
          <div className="shell-right">
            <span className="shell-today" title="The exercise treats this as today">
              {fmtDate(today)}
            </span>
            <button className="shell-link" onClick={() => setShowAssumptions(true)}>
              Assumptions
            </button>
            <span className="shell-user">
              <span className="shell-avatar" aria-hidden>
                JA
              </span>
              {ds.owner.displayName}
            </span>
          </div>
        </div>
      </header>

      <main className="page page5">
        <a className="back" href="#/v5" onClick={(e) => e.preventDefault()}>
          ← Bookings
        </a>

        <header className="guest-strip">
          <span className="avatar4" aria-hidden>
            {g ? initials(g.name) : '—'}
          </span>
          <div className="guest-strip-main">
            <div className="guest-strip-row">
              <h1 className="guest-strip-name">{g?.name ?? 'Owner block'}</h1>
              <span className={`bh-status is-${phase}`}>{STATUS[phase]}</span>
            </div>
            <p className="guest-strip-meta">
              {fmtRange(booking.stay.checkIn, booking.stay.checkOut)} · {plural(booking.stay.nights, 'night')}
              {site ? ` · ${site}` : ''} · {ds.listing.name}
              <span className="bh-dim"> · Booking {booking.id}</span>
            </p>
          </div>
          {g ? (
            <div className="guest-strip-actions">
              <button className="btn3 btn3-ghost" title="Message through the booking site">
                <MessageSquare size={14} aria-hidden /> Message guest
              </button>
            </div>
          ) : null}
        </header>

        {blocked ? (
          <section className="tile">
            <h2 className="sec-title">No payout for this block</h2>
            <p className="sec-note">
              You blocked {plural(booking.stay.nights, 'night')}, {fmtRange(booking.stay.checkIn, booking.stay.checkOut)}. Blocked nights aren’t listed for guests, so there is nothing to pay out.
            </p>
          </section>
        ) : (
          <>
            <EarningsCard ds={ds} booking={booking} today={today} />
            <div className="tile-wrap">
              <NightlyRates ds={ds} booking={booking} />
            </div>
          </>
        )}
      </main>

      <BookingStateSwitcher states={DEMO_STATES} current={booking} onSelect={select} />
      {showAssumptions ? <Assumptions onClose={() => setShowAssumptions(false)} /> : null}
    </div>
  )
}
