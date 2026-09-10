import { useEffect, useMemo, useState } from 'react'
import raw from '../data/payouts-dataset.json'
import type { Dataset } from '../lib/types'
import { fmtDate, fmtRange, plural } from '../lib/format'
import { GuestTile } from './GuestTile'
import { PayoutTile } from './PayoutTile'
import { PayoutBreakdown } from '../v2/components/PayoutBreakdown'
import { NightlyRates } from '../v2/components/NightlyRates'
import { GuestCharges } from '../v2/components/GuestCharges'
import { BookingStateSwitcher, type DemoState } from '../v2/components/BookingStateSwitcher'
import { Assumptions } from '../components/Assumptions'
import '../v2/v2.css'
import './v3.css'

const ds = raw as unknown as Dataset

/**
 * Option 3. Tiles. Guest on the left, payout big on the right with a compact nightly strip,
 * then the calculation and the guest-paid flow, then the full calendar. Same data, fewer words.
 */
const DEFAULT_ID = '15932931'
const DEMO_STATES: DemoState[] = [
  { key: 'pending', label: 'Pending', id: '15932931' },
  { key: 'paid', label: 'Paid', id: '15415011' },
  { key: 'scheduled', label: 'Scheduled', id: '15990957' },
  { key: 'canceled', label: 'Canceled', id: 'Z87337818' },
]

function idFromHash(): string | null {
  const m = location.hash.match(/#\/v3\/bookings\/([^/?]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export default function V3App() {
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
    history.replaceState(null, '', `#/v3/bookings/${encodeURIComponent(next)}`)
    window.scrollTo({ top: 0 })
  }

  const booking = useMemo(() => ds.bookings.find((b) => b.id === id) ?? ds.bookings[0], [id])
  const blocked = booking.status === 'blocked'

  return (
    <div className="v2 v3">
      <header className="shell">
        <div className="shell-inner">
          <a className="wordmark" href="#/v3" aria-label="Evolve owner portal">
            <span className="wordmark-dot" aria-hidden />
            Evolve
          </a>
          <nav className="shell-nav" aria-label="Primary">
            {['Overview', 'Calendar', 'Bookings', 'Performance', 'Payouts'].map((n) => (
              <a key={n} href="#/v3" className={n === 'Bookings' ? 'is-active' : ''} onClick={(e) => e.preventDefault()}>
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

      <main className="page page3">
        <a className="back" href="#/v3" onClick={(e) => e.preventDefault()}>
          ← Bookings
        </a>

        {blocked ? (
          <section className="tile">
            <h2 className="sec-title">No payout for this block</h2>
            <p className="sec-note">
              You blocked {plural(booking.stay.nights, 'night')}, {fmtRange(booking.stay.checkIn, booking.stay.checkOut)}. Blocked nights aren’t listed for guests, so there is nothing to pay out.
            </p>
          </section>
        ) : (
          <div className="tiles">
            <PayoutTile ds={ds} booking={booking} today={today} />
            <GuestTile ds={ds} booking={booking} />
            <div className="tile-wrap">
              <PayoutBreakdown ds={ds} booking={booking} />
            </div>
            <div className="tile-wrap">
              <GuestCharges ds={ds} booking={booking} />
            </div>
            <div className="tile-wrap tile-full">
              <NightlyRates ds={ds} booking={booking} />
            </div>
          </div>
        )}
      </main>

      <BookingStateSwitcher states={DEMO_STATES} current={booking} onSelect={select} />
      {showAssumptions ? <Assumptions onClose={() => setShowAssumptions(false)} /> : null}
    </div>
  )
}
