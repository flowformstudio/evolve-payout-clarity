import { useEffect, useMemo, useState } from 'react'
import { Download, MessageCircleQuestion } from 'lucide-react'
import raw from '../data/payouts-dataset.json'
import type { Dataset } from '../lib/types'
import { fmtDate, fmtRange, plural } from '../lib/format'
import { BookingHeader } from './components/BookingHeader'
import { PayoutHero } from './components/PayoutHero'
import { PayoutBreakdown } from './components/PayoutBreakdown'
import { NightlyRates } from './components/NightlyRates'
import { GuestCharges } from './components/GuestCharges'
import { BookingStateSwitcher, type DemoState } from './components/BookingStateSwitcher'
import { Assumptions } from '../components/Assumptions'
import './v2.css'

const ds = raw as unknown as Dataset

/**
 * Option 2. One focused booking-detail page organised around the owner's questions:
 * What am I getting → When → How was it calculated → What was booked → What did the guest pay.
 * The JSON structure does not dictate the page structure.
 */

// Default: Adaeze Okafor, currently staying, payout pending. Representative states for the demo control.
const DEFAULT_ID = '15932931'
const DEMO_STATES: DemoState[] = [
  { key: 'pending', label: 'Pending', id: '15932931' },
  { key: 'paid', label: 'Paid', id: '15415011' },
  { key: 'scheduled', label: 'Scheduled', id: '15990957' },
  { key: 'canceled', label: 'Canceled', id: 'Z87337818' },
]

function idFromHash(): string | null {
  const m = location.hash.match(/#\/v2\/bookings\/([^/?]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export default function V2App() {
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
    history.replaceState(null, '', `#/v2/bookings/${encodeURIComponent(next)}`)
    window.scrollTo({ top: 0 })
  }

  const booking = useMemo(() => ds.bookings.find((b) => b.id === id) ?? ds.bookings[0], [id])
  const blocked = booking.status === 'blocked'

  return (
    <div className="v2">
      <header className="shell">
        <div className="shell-inner">
          <a className="wordmark" href="#/v2" aria-label="Evolve owner portal">
            <img src="/evolve-logo.svg" alt="Evolve" className="wordmark-logo" />
          </a>
          <nav className="shell-nav" aria-label="Primary">
            {['Overview', 'Calendar', 'Bookings', 'Performance', 'Payouts'].map((n) => (
              <a key={n} href="#/v2" className={n === 'Bookings' ? 'is-active' : ''} onClick={(e) => e.preventDefault()}>
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

      <main className="page">
        <a className="back" href="#/v2" onClick={(e) => e.preventDefault()}>
          ← Bookings
        </a>
        <BookingHeader ds={ds} booking={booking} />

        {blocked ? (
          <section className="sec">
            <h2 className="sec-title">No payout for this block</h2>
            <p className="sec-note">
              You blocked {plural(booking.stay.nights, 'night')}, {fmtRange(booking.stay.checkIn, booking.stay.checkOut)}. Blocked nights aren’t listed for guests, so there is nothing to pay out.
            </p>
          </section>
        ) : (
          <>
            <PayoutHero ds={ds} booking={booking} today={today} />
            <PayoutBreakdown ds={ds} booking={booking} />
            <NightlyRates ds={ds} booking={booking} />
            <GuestCharges ds={ds} booking={booking} />
            <section className="sec sec-help">
              <div>
                <h2 className="sec-title">Need help with this booking?</h2>
                <p className="sec-note">If a number doesn’t match what you expected, tell us which line and we’ll look into it.</p>
              </div>
              <div className="help-actions">
                <button className="btn2">
                  <MessageCircleQuestion size={15} aria-hidden /> Something looks off
                </button>
                <button className="btn2 btn2-ghost">
                  <Download size={15} aria-hidden /> Download statement
                </button>
              </div>
            </section>
          </>
        )}
      </main>

      <BookingStateSwitcher states={DEMO_STATES} current={booking} onSelect={select} />
      {showAssumptions ? <Assumptions onClose={() => setShowAssumptions(false)} /> : null}
    </div>
  )
}
