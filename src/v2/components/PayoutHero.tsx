import { Check } from 'lucide-react'
import type { Booking, Dataset } from '../../lib/types'
import { fmtDate, money } from '../../lib/format'

/**
 * The strongest element on the page. Amount dominates; one line says when.
 *   paid       → "Deposited May 8"
 *   pending    → "Expected May 19"  + "Payout processing"
 *   scheduled  → "Scheduled · Expected Jun 4"
 *   canceled   → "Canceled · $0"
 */
export function PayoutHero({ ds, booking, today }: { ds: Dataset; booking: Booking; today: string }) {
  const p = booking.payout!
  const bank = `${ds.owner.bankAccount.institution} •••• ${ds.owner.bankAccount.lastFour}`

  let when = ''
  let note = ''
  if (p.status === 'paid') {
    when = `Deposited ${fmtDate(p.depositedDate!, false)}`
    note = `Deposited to ${bank}`
  } else if (p.status === 'pending') {
    when = `Expected ${fmtDate(p.expectedDepositDate!, false)}`
    note = `Payout processing · Deposit to ${bank}`
  } else if (p.status === 'scheduled') {
    when = `Scheduled · Expected ${fmtDate(p.expectedDepositDate!, false)}`
    note = `Deposit to ${bank} after the guest checks in`
  } else {
    when = 'Canceled · $0'
    note = 'This booking was canceled before check-in. No payout was issued.'
  }

  return (
    <section className={`hero2 is-${p.status}`} aria-labelledby="hero2-title">
      <div className="hero2-label" id="hero2-title">
        Your payout
      </div>
      <div className="hero2-amount">{money(p.amount)}</div>
      <div className="hero2-when">{when}</div>
      <div className="hero2-note">{note}</div>
      <PayoutStatus booking={booking} today={today} />
    </section>
  )
}

/** Compact "where is my money right now" strip. Steps never contradict the file. */
export function PayoutStatus({ booking, today }: { booking: Booking; today: string }) {
  const p = booking.payout!
  const s = booking.stay

  type Step = { label: string; sub?: string; state: 'done' | 'current' | 'todo' }
  let steps: Step[]

  if (p.status === 'canceled') {
    steps = [
      { label: 'Booking confirmed', sub: fmtDate(booking.dateBooked, false), state: 'done' },
      { label: 'Canceled', sub: 'before check-in', state: 'current' },
      { label: 'No payout', sub: '$0.00', state: 'todo' },
    ]
  } else {
    const checkedIn = s.checkIn <= today && booking.status !== 'booked'
    const paid = p.status === 'paid'
    steps = [
      { label: 'Booking confirmed', sub: fmtDate(booking.dateBooked, false), state: 'done' },
      { label: checkedIn ? 'Guest checked in' : 'Guest checks in', sub: fmtDate(s.checkIn, false), state: checkedIn ? 'done' : 'current' },
      { label: 'Payout processing', state: paid ? 'done' : checkedIn ? 'current' : 'todo' },
      {
        label: paid ? 'Deposited' : 'Deposit expected',
        sub: fmtDate((paid ? p.depositedDate : p.expectedDepositDate)!, false),
        state: paid ? 'done' : 'todo',
      },
    ]
  }

  return (
    <ol className="ps" aria-label="Payout progress">
      {steps.map((st, i) => (
        <li key={i} className={`ps-step is-${st.state}`}>
          <span className="ps-dot" aria-hidden>
            {st.state === 'done' ? <Check size={11} strokeWidth={3} /> : null}
          </span>
          <span className="ps-label">{st.label}</span>
          {st.sub ? <span className="ps-sub">{st.sub}</span> : null}
        </li>
      ))}
    </ol>
  )
}
