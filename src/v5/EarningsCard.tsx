import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Booking, Dataset } from '../lib/types'
import { fmtDate, money, parseISO } from '../lib/format'
import { nightlyRatesFor } from '../v2/prototype-additions'
import { PayoutStatus } from '../v2/components/PayoutHero'
import { Info } from '../v2/components/Info'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const round2 = (n: number) => Math.round(n * 100) / 100

/**
 * One card, two sides. "You earn" is the default and shows the payout with its ledger.
 * "Guest paid" flips the same card to the guest's total and its ledger. Same shape,
 * so the owner can compare line by line and see exactly where the two totals diverge.
 */
export function EarningsCard({ ds, booking, today }: { ds: Dataset; booking: Booking; today: string }) {
  const [side, setSide] = useState<'you' | 'guest'>('you')
  const [nightsOpen, setNightsOpen] = useState(false)
  const [taxesOpen, setTaxesOpen] = useState(false)

  const p = booking.payout!
  const canceled = p.status === 'canceled'
  const nights = useMemo(() => nightlyRatesFor(booking), [booking])
  const base = booking.lineItems.find((l) => l.type === 'base')!.amount
  const cleaning = booking.lineItems.find((l) => l.type === 'fee')?.amount ?? 0
  const taxes = booking.lineItems.filter((l) => l.type === 'tax')
  const taxTotal = round2(taxes.reduce((s, t) => s + t.amount, 0))
  const guestTotal = round2(base + cleaning + taxTotal)
  const feeRate = ds.listing.managementFeeRate
  const fee = canceled ? 0 : p.managementFee
  const listTotal = round2(nights.reduce((s, n) => s + n.listRate, 0))
  const discountTotal = round2(listTotal - base)
  const discountLabel = nights.find((n) => n.discount)?.discount?.label
  const bank = `${ds.owner.bankAccount.institution} •••• ${ds.owner.bankAccount.lastFour}`

  let when = ''
  if (p.status === 'paid') when = `Deposited ${fmtDate(p.depositedDate!, false)} to ${bank}`
  else if (p.status === 'pending') when = `Expected ${fmtDate(p.expectedDepositDate!, false)} · Payout processing · to ${bank}`
  else if (p.status === 'scheduled') when = `Scheduled · Expected ${fmtDate(p.expectedDepositDate!, false)} · to ${bank}`
  else when = 'Canceled before check-in · No payout was issued'

  const nightRows = (
    <div className="ec-sub">
      {nights.map((n) => {
        const d = parseISO(n.date)
        return (
          <div key={n.date} className="ec-subrow">
            <span>
              {DOW[d.getDay()]}, {MON[d.getMonth()]} {d.getDate()}
              {n.discount ? <span className="ec-dim"> · {n.discount.label} −{Math.round(n.discount.pct * 100)}%</span> : null}
            </span>
            <span className="ec-num">
              {n.discount ? <s>{money(n.listRate)}</s> : null} {money(n.rate)}
            </span>
          </div>
        )
      })}
    </div>
  )

  return (
    <section className={`ec hero2 is-${p.status}`} aria-labelledby="ec-title">
      <h2 className="sr-only" id="ec-title">
        Earnings
      </h2>

      <div className="ec-toggle" role="tablist" aria-label="Earnings view">
        <button role="tab" aria-selected={side === 'you'} className={side === 'you' ? 'is-on' : ''} onClick={() => setSide('you')}>
          You earn
        </button>
        <button role="tab" aria-selected={side === 'guest'} className={side === 'guest' ? 'is-on' : ''} onClick={() => setSide('guest')}>
          Guest paid
        </button>
      </div>

      {side === 'you' ? (
        <div role="tabpanel" className="ec-panel">
          <div className="ec-amount">{money(p.amount)}</div>
          <div className="ec-when">{when}</div>

          <dl className="ec-ledger">
            <div className="ec-row">
              <dt>
                <button className="ec-expand" aria-expanded={nightsOpen} onClick={() => setNightsOpen((v) => !v)}>
                  {nights.length} nights stay revenue <ChevronDown size={14} className={`chev ${nightsOpen ? 'is-open' : ''}`} aria-hidden />
                </button>
              </dt>
              <dd>{money(base)}</dd>
            </div>
            {nightsOpen ? nightRows : null}
            {discountTotal > 0 && nightsOpen ? (
              <div className="ec-row ec-note-row">
                <dt>
                  {discountLabel} discount already applied <span className="ec-dim">· regular price would have been {money(listTotal)}</span>
                </dt>
                <dd className="ec-dim">−{money(discountTotal)}</dd>
              </div>
            ) : null}
            <div className="ec-row">
              <dt>Cleaning fee</dt>
              <dd>{money(cleaning)}</dd>
            </div>
            <div className="ec-row ec-fee">
              <dt>
                Evolve management fee ({Math.round(feeRate * 100)}%)
                <Info label="About the management fee">
                  Your {ds.owner.plan} plan management fee is {Math.round(feeRate * 100)}% of stay revenue only. The cleaning fee passes through to you in full. Taxes are never charged a fee.
                  <br />
                  <span className="info-math">
                    {Math.round(feeRate * 100)}% × {money(base)} = {money(canceled ? base * feeRate : fee)}
                  </span>
                </Info>
              </dt>
              <dd>−{money(fee)}</dd>
            </div>
            <div className="ec-row ec-total">
              <dt>{canceled ? 'Total (canceled)' : 'Total you earn'}</dt>
              <dd>{money(p.amount)}</dd>
            </div>
          </dl>
          {canceled ? <p className="ec-foot">The stay would have earned {money(base + cleaning - base * feeRate)}. The guest was refunded and no fee was charged.</p> : null}
        </div>
      ) : (
        <div role="tabpanel" className="ec-panel">
          <div className="ec-amount">{money(guestTotal)}</div>
          <div className="ec-when">{canceled ? 'Charged at booking, refunded on cancellation' : `What the guest paid ${booking.bookingSite === 'Evolve' ? 'on Evolve' : `on ${booking.bookingSite}`}`}</div>

          <dl className="ec-ledger">
            <div className="ec-row">
              <dt>
                <button className="ec-expand" aria-expanded={nightsOpen} onClick={() => setNightsOpen((v) => !v)}>
                  {money(base / nights.length)} × {nights.length} nights <ChevronDown size={14} className={`chev ${nightsOpen ? 'is-open' : ''}`} aria-hidden />
                </button>
              </dt>
              <dd>{money(base)}</dd>
            </div>
            {nightsOpen ? nightRows : null}
            <div className="ec-row">
              <dt>Cleaning fee</dt>
              <dd>{money(cleaning)}</dd>
            </div>
            <div className="ec-row">
              <dt>
                <button className="ec-expand" aria-expanded={taxesOpen} onClick={() => setTaxesOpen((v) => !v)}>
                  Occupancy taxes <ChevronDown size={14} className={`chev ${taxesOpen ? 'is-open' : ''}`} aria-hidden />
                </button>
              </dt>
              <dd>{money(taxTotal)}</dd>
            </div>
            {taxesOpen ? (
              <div className="ec-sub">
                {taxes.map((t) => (
                  <div key={t.description} className="ec-subrow">
                    <span>
                      {t.description} <span className="ec-dim">· {Math.round((ds.taxes.find((x) => x.name === t.description)?.rate ?? 0) * 100)}%</span>
                    </span>
                    <span className="ec-num">{money(t.amount)}</span>
                  </div>
                ))}
              </div>
            ) : null}
            <div className="ec-row ec-total">
              <dt>Total guest paid</dt>
              <dd>{money(guestTotal)}</dd>
            </div>
          </dl>

          <div className="ec-split" aria-label="Where the guest's money goes">
            <div className="ec-split-row">
              <span>Taxes collected and remitted</span>
              <span className="ec-num">{money(taxTotal)}</span>
            </div>
            <div className="ec-split-row">
              <span>Evolve management fee</span>
              <span className="ec-num">{money(canceled ? round2(base * feeRate) : fee)}</span>
            </div>
            <div className="ec-split-row is-you">
              <span>{canceled ? 'You would have earned' : 'You earn'}</span>
              <span className="ec-num">{money(canceled ? round2(base + cleaning - base * feeRate) : p.amount)}</span>
            </div>
          </div>
          <p className="ec-foot">Occupancy taxes go to the State of Texas, the City of Austin and Travis County. Evolve remits them for the guest. They aren’t part of your earnings and aren’t deducted from them.</p>
        </div>
      )}

      <PayoutStatus booking={booking} today={today} />
    </section>
  )
}
