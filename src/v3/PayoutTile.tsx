import type { Booking, Dataset } from '../lib/types'
import { fmtDate, money, parseISO } from '../lib/format'
import { nightlyRatesFor } from '../v2/prototype-additions'
import { PayoutStatus } from '../v2/components/PayoutHero'
import { MiniMonth } from '../v4/MiniMonth'

const DOW = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

/**
 * The big tile. Amount first, when second, bank third, then a compact night-by-night strip
 * that shows the rates the guest saw for the nights that make up this payout.
 */
export function PayoutTile({ ds, booking, today, rateView = 'strip' }: { ds: Dataset; booking: Booking; today: string; rateView?: 'strip' | 'month' }) {
  const p = booking.payout!
  const bank = `${ds.owner.bankAccount.institution} •••• ${ds.owner.bankAccount.lastFour}`
  const nights = nightlyRatesFor(booking)
  const base = booking.lineItems.find((l) => l.type === 'base')!.amount

  let when = ''
  let note = ''
  if (p.status === 'paid') {
    when = `Deposited ${fmtDate(p.depositedDate!, false)}`
    note = `to ${bank}`
  } else if (p.status === 'pending') {
    when = `Expected ${fmtDate(p.expectedDepositDate!, false)}`
    note = `Payout processing · to ${bank}`
  } else if (p.status === 'scheduled') {
    when = `Scheduled · Expected ${fmtDate(p.expectedDepositDate!, false)}`
    note = `to ${bank}, after the guest checks in`
  } else {
    when = 'Canceled · $0'
    note = 'Canceled before check-in. No payout was issued.'
  }

  return (
    <section className={`tile tile-payout hero2 is-${p.status}`} aria-labelledby="payout-title">
      <div className="payout-grid">
        <div className="payout-main">
          <div className="hero2-label" id="payout-title">
            Your payout
          </div>
          <div className="hero2-amount">{money(p.amount)}</div>
          <div className="hero2-when">{when}</div>
          <div className="hero2-note">{note}</div>
        </div>

        {rateView === 'month' ? (
          <MiniMonth ds={ds} booking={booking} />
        ) : (
        <div className="mini" aria-label="Nightly rates for this stay">
          <div className="mini-head">
            <span>Nightly rates</span>
            <span className="mini-sum">
              {nights.length} nights · {money(base)}
            </span>
          </div>
          <div className="mini-strip" style={{ gridTemplateColumns: `repeat(${Math.min(nights.length, 7)}, 1fr)` }}>
            {nights.map((n) => {
              const d = parseISO(n.date)
              return (
                <div key={n.date} className={`mini-night ${n.weekend ? 'is-weekend' : ''} ${n.discount ? 'is-discount' : ''}`} title={`${n.date}: ${money(n.rate)}${n.discount ? `, ${n.discount.label} discount` : ''}`}>
                  <span className="mini-dow">{DOW[d.getDay()]}</span>
                  <span className="mini-day">{d.getDate()}</span>
                  <span className="mini-rate">${Math.round(n.rate)}</span>
                  <span className="mini-tag">{n.discount ? `−${Math.round(n.discount.pct * 100)}%` : ''}</span>
                </div>
              )
            })}
          </div>
          <div className="mini-foot">
            {money(base)} stay revenue + {money(ds.listing.cleaningFee)} cleaning − {Math.round(ds.listing.managementFeeRate * 100)}% Evolve fee
          </div>
        </div>
        )}
      </div>

      <PayoutStatus booking={booking} today={today} />
    </section>
  )
}
