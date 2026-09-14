import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, ChevronDown, Ellipsis, LoaderCircle, MessageSquare } from 'lucide-react'
import raw from '../data/payouts-dataset.json'
import type { Booking, Dataset } from '../lib/types'
import { fmtDate, money, plural } from '../lib/format'
import { phaseOf } from '../lib/derive'
import { Info } from '../v2/components/Info'
import { BookingStateSwitcher, type DemoState } from '../v2/components/BookingStateSwitcher'
import { Assumptions } from '../components/Assumptions'
import { CalendarLegend, InteractiveCalendar } from './InteractiveCalendar'
import '../v2/v2.css'
import '../v3/v3.css'
import './final.css'

const ds = raw as unknown as Dataset

/**
 * FINAL. Payout first, centered and calm. Then, side by side, how the payout was calculated and
 * what the guest booked, with an interactive month calendar that explains every night's price.
 */
const DEFAULT_ID = '15932931'
const PERSONA = { name: 'Adaeze Okafor', photo: '/img/avatar-adaeze.png' }
const DEMO_STATES: DemoState[] = [
  { key: 'pending', label: 'Pending', id: '15932931' },
  { key: 'paid', label: 'Paid', id: '15415011' },
  { key: 'scheduled', label: 'Scheduled', id: '15990957' },
  { key: 'canceled', label: 'Canceled', id: 'Z87337818' },
]
const STATUS: Record<string, string> = { in_progress: 'Currently staying', upcoming: 'Upcoming stay', completed: 'Stay completed', canceled: 'Canceled', blocked: 'Owner block' }
const round2 = (n: number) => Math.round(n * 100) / 100

function idFromHash(): string | null {
  const m = location.hash.match(/#\/final\/bookings\/([^/?]+)/)
  return m ? decodeURIComponent(m[1]) : null
}

export default function FinalApp() {
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
    history.replaceState(null, '', `#/final/bookings/${encodeURIComponent(next)}`)
    window.scrollTo({ top: 0 })
  }

  const booking = useMemo(() => ds.bookings.find((b) => b.id === id) ?? ds.bookings[0], [id])
  const blocked = booking.status === 'blocked'
  const phase = phaseOf(booking)
  // One persona across the demo states, so the page reads as the same guest at different points in time.
  const g = booking.guest ? PERSONA : null

  return (
    <div className="v2 v3 fin">
      <header className="shell">
        <div className="shell-inner">
          <a className="wordmark" href="#/final" aria-label="Evolve owner portal">
            <img src="/evolve-logo.svg" alt="Evolve" className="wordmark-logo" />
          </a>
          <nav className="shell-nav" aria-label="Primary">
            {['Overview', 'Calendar', 'Bookings', 'Performance', 'Payouts'].map((n) => (
              <a key={n} href="#/final" className={n === 'Bookings' ? 'is-active' : ''} onClick={(e) => e.preventDefault()}>
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
              <ChevronDown size={14} className="fin-caret" aria-hidden />
            </span>
          </div>
        </div>
      </header>

      <main className="page fin-page">
        <a className="fin-back" href="#/final" onClick={(e) => e.preventDefault()}>
          <ArrowLeft size={15} aria-hidden /> Back to bookings
        </a>

        <header className="fin-guest">
          {g ? (
            <img className="fin-avatar fin-avatar-photo" src={g.photo} alt="" />
          ) : (
            <span className="fin-avatar" aria-hidden>
              —
            </span>
          )}
          <div className="fin-guest-main">
            <div className="fin-guest-row">
              <h1 className="fin-guest-name">{g?.name ?? 'Owner block'}</h1>
              <span className={`bh-status is-${phase}`}>{STATUS[phase]}</span>
            </div>
            <p className="fin-guest-meta">
              <span className="fin-property">{ds.listing.name}</span>
              {booking.bookingSite ? (
                <>
                  <span className="fin-sep" aria-hidden>
                    |
                  </span>
                  <span className="fin-channel">
                    {booking.bookingSite === 'Airbnb' ? (
                      <img className="fin-channel-logo" src="/img/channel-airbnb.png" alt="" />
                    ) : (
                      <i className={`fin-channel-dot is-${booking.bookingSite.toLowerCase().replace('.', '')}`} aria-hidden />
                    )}
                    {booking.bookingSite === 'Evolve' ? 'Evolve direct' : booking.bookingSite}
                  </span>
                </>
              ) : null}
              <span className="fin-sep" aria-hidden>
                |
              </span>
              <span className="fin-dim">Booking: {booking.id}</span>
            </p>
          </div>
          {g ? (
            <div className="fin-guest-actions">
              <button className="btn3 btn3-ghost fin-btn" title="Message through the booking site">
                <MessageSquare size={15} aria-hidden /> Message guest
              </button>
              <button className="btn3 btn3-ghost fin-btn fin-btn-icon" aria-label="More actions">
                <Ellipsis size={16} aria-hidden />
              </button>
            </div>
          ) : null}
        </header>

        {blocked ? (
          <section className="tile">
            <h2 className="sec-title">No payout for this block</h2>
            <p className="sec-note">
              You blocked {plural(booking.stay.nights, 'night')}. Blocked nights aren’t listed for guests, so there is nothing to pay out.
            </p>
          </section>
        ) : (
          <>
            <PayoutHero ds={ds} booking={booking} today={today} />
            <div className="fin-cols">
              <PayoutBreakdown ds={ds} booking={booking} />
              <GuestBookingInfo ds={ds} booking={booking} />
            </div>
          </>
        )}
      </main>

      <BookingStateSwitcher states={DEMO_STATES} current={booking} onSelect={select} />
      {showAssumptions ? <Assumptions onClose={() => setShowAssumptions(false)} /> : null}
    </div>
  )
}

/* ---------------- Hero ---------------- */

function PayoutHero({ ds, booking, today }: { ds: Dataset; booking: Booking; today: string }) {
  const p = booking.payout!
  const bank = `${ds.owner.bankAccount.institution} •••• ${ds.owner.bankAccount.lastFour}`
  const s = booking.stay
  const checkedIn = s.checkIn <= today && booking.status !== 'booked'
  const paid = p.status === 'paid'
  const canceled = p.status === 'canceled'

  type Step = { label: string; date?: string; state: 'done' | 'current' | 'todo' }
  const steps: Step[] = canceled
    ? [
        { label: 'Booking confirmed', date: booking.dateBooked, state: 'done' },
        { label: 'Canceled before check-in', state: 'current' },
        { label: 'No payout', state: 'todo' },
      ]
    : [
        { label: 'Booking confirmed', date: booking.dateBooked, state: 'done' },
        { label: checkedIn ? 'Guest checked in' : 'Guest checks in', date: s.checkIn, state: checkedIn ? 'done' : 'current' },
        { label: 'Payout processing', state: paid ? 'done' : checkedIn ? 'current' : 'todo' },
        { label: paid ? 'Deposited' : 'Deposit expected', date: (paid ? p.depositedDate : p.expectedDepositDate) ?? undefined, state: paid ? 'done' : 'todo' },
      ]

  return (
    <section className={`fin-hero is-${p.status}`} aria-labelledby="fin-hero-title">
      <div className="fin-hero-label" id="fin-hero-title">
        Your payout
      </div>
      <div className="fin-hero-amount">{money(p.amount)}</div>
      <div className="fin-hero-when">
        {paid ? (
          <>
            <span className="fin-when-text">Deposited {fmtDate(p.depositedDate!)}</span>
            <span className="fin-chip is-paid">
              <Check size={13} aria-hidden /> Paid
            </span>
          </>
        ) : p.status === 'pending' ? (
          <>
            <span className="fin-when-text">Expected {fmtDate(p.expectedDepositDate!)}</span>
            <span className="fin-chip is-pending">
              <LoaderCircle size={13} className="fin-spin" aria-hidden /> Processing
            </span>
          </>
        ) : p.status === 'scheduled' ? (
          <>
            <span className="fin-when-text">Expected {fmtDate(p.expectedDepositDate!)}</span>
            <span className="fin-chip is-scheduled">Scheduled</span>
          </>
        ) : (
          <>
            <span className="fin-when-text">Canceled</span>
            <span className="fin-chip is-canceled">$0 payout</span>
          </>
        )}
      </div>
      <div className="fin-hero-bank">
        {canceled ? (
          'The guest was refunded and no management fee was charged.'
        ) : (
          <>
            {paid ? 'Deposited to' : 'Will be deposited to'} <strong>{bank}</strong>
            <Info label="About the deposit">
              Payouts go to the bank account on file, {bank}. Evolve processes the transaction about 2 business days after the guest checks in, and it usually lands in your account 5 to 9 business days after check-in. Change the account under Settings → Payouts.
            </Info>
          </>
        )}
      </div>

      <ol className="fin-steps" aria-label="Payout progress">
        {steps.map((st, i) => (
          <li key={i} className={`fin-step is-${st.state}`}>
            <span className="fin-step-track" aria-hidden />
            <span className="fin-step-dot" aria-hidden>
              {st.state === 'done' ? <Check size={12} strokeWidth={3} /> : null}
            </span>
            <span className="fin-step-date">{st.date ? fmtDate(st.date, false) : ' '}</span>
            <span className="fin-step-label">{st.label}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

/* ---------------- Breakdown ---------------- */

function PayoutBreakdown({ ds, booking }: { ds: Dataset; booking: Booking }) {
  const base = booking.lineItems.find((l) => l.type === 'base')!.amount
  const cleaning = booking.lineItems.find((l) => l.type === 'fee')?.amount ?? 0
  const canceled = booking.payout!.status === 'canceled'
  const fee = canceled ? 0 : booking.payout!.managementFee
  const ratePct = Math.round(ds.listing.managementFeeRate * 100)
  return (
    <section className="tile fin-tile" aria-labelledby="pb-title">
      <h2 className="fin-h2" id="pb-title">
        Payout breakdown
      </h2>
      <dl className="fin-ledger">
        <div className="fin-row">
          <dt>
            Stay revenue
            <small>
              {booking.stay.nights} nights · {money(base / booking.stay.nights)} avg/night
            </small>
          </dt>
          <dd>{money(base)}</dd>
        </div>
        <div className="fin-row">
          <dt>
            Cleaning fee
            <small>One-time cleaning fee, passes through to you in full</small>
          </dt>
          <dd>+ {money(cleaning)}</dd>
        </div>
        <div className="fin-row is-fee">
          <dt>
            <span className="fin-fee-label">
              Evolve management fee <span className="fin-dim">({ratePct}% of stay revenue)</span>
            </span>
            <small>Service fee for management and support</small>
          </dt>
          <dd>− {money(fee)}</dd>
        </div>
        <div className="fin-row fin-total">
          <dt>{canceled ? 'Your payout (canceled)' : 'Your payout'}</dt>
          <dd>{money(booking.payout!.amount)}</dd>
        </div>
      </dl>
      {canceled ? <p className="sec-note">The stay would have paid {money(base + cleaning - base * ds.listing.managementFeeRate)}. Because it was canceled before check-in, the guest was refunded and no fee was charged.</p> : null}
    </section>
  )
}

/* ---------------- Guest booking info ---------------- */

function GuestBookingInfo({ ds, booking }: { ds: Dataset; booking: Booking }) {
  const [open, setOpen] = useState(false)
  const base = booking.lineItems.find((l) => l.type === 'base')!.amount
  const cleaning = booking.lineItems.find((l) => l.type === 'fee')?.amount ?? 0
  const taxes = booking.lineItems.filter((l) => l.type === 'tax')
  const taxTotal = round2(taxes.reduce((s, t) => s + t.amount, 0))
  const guestTotal = round2(base + cleaning + taxTotal)
  const canceled = booking.payout!.status === 'canceled'
  const fee = canceled ? round2(base * ds.listing.managementFeeRate) : booking.payout!.managementFee
  const payout = canceled ? round2(base + cleaning - fee) : booking.payout!.amount
  const site = booking.bookingSite === 'Evolve' ? 'Evolve' : booking.bookingSite

  return (
    <section className="tile fin-tile" aria-labelledby="gb-title">
      <h2 className="fin-h2" id="gb-title">
        Guest booking info
      </h2>
      <div className="fin-stats">
        <div>
          <span className="fin-stat-label">Guest paid on {site}</span>
          <span className="fin-stat-value">{money(guestTotal)}</span>
        </div>
        <div>
          <span className="fin-stat-label">Nights</span>
          <span className="fin-stat-value">{booking.stay.nights}</span>
        </div>
      </div>

      <InteractiveCalendar ds={ds} booking={booking} />

      <div className="fin-acc">
        <div className="fin-acc-row">
          <button className="fin-acc-btn" aria-expanded={open} aria-controls="gpb" onClick={() => setOpen((v) => !v)}>
            <span>Guest price breakdown</span>
            <ChevronDown size={18} className={`chev ${open ? 'is-open' : ''}`} aria-hidden />
          </button>
          <span className="fin-legend">
            <span className="fin-legend-label">What the colors mean</span>
            <CalendarLegend />
          </span>
        </div>
        {open ? (
          <div id="gpb" className="fin-acc-body">
            <dl className="fin-ledger fin-ledger-sm">
              <div className="fin-row">
                <dt>Stay <small>{money(base / booking.stay.nights)} × {booking.stay.nights} nights</small></dt>
                <dd>{money(base)}</dd>
              </div>
              <div className="fin-row">
                <dt>Cleaning fee</dt>
                <dd>{money(cleaning)}</dd>
              </div>
              <div className="fin-row">
                <dt>
                  Occupancy taxes
                  <small>{taxes.map((t) => `${shortTax(t.description)} ${money(t.amount)}`).join(' · ')}</small>
                </dt>
                <dd>{money(taxTotal)}</dd>
              </div>
              <div className="fin-row fin-total is-plain">
                <dt>Guest total</dt>
                <dd>{money(guestTotal)}</dd>
              </div>
            </dl>
            <div className="fin-flow">
              <div>
                <span>Taxes collected and remitted</span>
                <span className="num">{money(taxTotal)}</span>
              </div>
              <div>
                <span>Evolve management fee</span>
                <span className="num">{money(fee)}</span>
              </div>
              <div className="is-you">
                <span>{canceled ? 'You would have received' : 'You receive'}</span>
                <span className="num">{money(payout)}</span>
              </div>
            </div>
            <p className="sec-note">Occupancy taxes go to the State of Texas, the City of Austin and Travis County. Evolve remits them for the guest. They aren’t part of your earnings and aren’t deducted from them.</p>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function shortTax(name: string) {
  if (name.startsWith('Texas')) return 'State'
  if (name.startsWith('City')) return 'City'
  if (name.startsWith('Travis')) return 'County'
  return name
}
