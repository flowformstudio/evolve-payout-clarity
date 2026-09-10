import { useState } from 'react'
import { ChevronDown, ArrowRight } from 'lucide-react'
import type { Booking, Dataset } from '../../lib/types'
import { money } from '../../lib/format'
import { Info } from './Info'

/**
 * Guest charges vs your payout. Taxes are collected from the guest and remitted; they are
 * never "deducted" from the owner. The flow makes the three destinations explicit.
 */
export function GuestCharges({ ds, booking }: { ds: Dataset; booking: Booking }) {
  const [open, setOpen] = useState(false)
  const base = booking.lineItems.find((l) => l.type === 'base')!.amount
  const cleaning = booking.lineItems.find((l) => l.type === 'fee')?.amount ?? 0
  const taxes = booking.lineItems.filter((l) => l.type === 'tax')
  const taxTotal = round2(taxes.reduce((s, t) => s + t.amount, 0))
  const guestTotal = round2(base + cleaning + taxTotal)
  const canceled = booking.payout!.status === 'canceled'
  const fee = canceled ? round2(base * ds.listing.managementFeeRate) : booking.payout!.managementFee
  const payout = canceled ? round2(base + cleaning - fee) : booking.payout!.amount

  return (
    <section className="sec" aria-labelledby="gc-title">
      <div className="sec-head">
        <div>
          <h2 className="sec-title" id="gc-title">
            What the guest paid
          </h2>
          <p className="sec-summary">
            Guest {canceled ? 'was charged' : 'paid'} <strong>{money(guestTotal)}</strong>
            {canceled ? ', refunded on cancellation' : <> · you receive <strong>{money(payout)}</strong></>}
          </p>
        </div>
        <button className="disclose" aria-expanded={open} aria-controls="gc-body" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide' : 'See where it goes'}
          <ChevronDown size={15} className={`chev ${open ? 'is-open' : ''}`} aria-hidden />
        </button>
      </div>

      {open ? (
        <div id="gc-body" className="gc-body">
          <dl className="calc">
            <div className="calc-row">
              <dt>Stay</dt>
              <dd>{money(base)}</dd>
            </div>
            <div className="calc-row">
              <dt>Cleaning</dt>
              <dd>{money(cleaning)}</dd>
            </div>
            <div className="calc-row">
              <dt>
                Taxes collected from guest
                <Info label="About occupancy taxes">
                  Occupancy taxes are collected from the guest and remitted to tax authorities. They aren’t deducted from your payout.
                  <br />
                  {taxes.map((t) => (
                    <span key={t.description} className="info-math">
                      {t.description}: {money(t.amount)}
                      <br />
                    </span>
                  ))}
                </Info>
              </dt>
              <dd>{money(taxTotal)}</dd>
            </div>
            <div className="calc-row calc-total">
              <dt>Guest total</dt>
              <dd>{money(guestTotal)}</dd>
            </div>
          </dl>

          <div className="flow2" aria-label="Where the guest's money goes">
            <div className="flow2-from">
              <span className="flow2-k">Guest {canceled ? 'would have paid' : 'paid'}</span>
              <span className="flow2-v">{money(guestTotal)}</span>
            </div>
            <ul className="flow2-to">
              <li className="to-tax">
                <ArrowRight size={14} aria-hidden />
                <span className="flow2-k">Taxes collected and remitted</span>
                <span className="flow2-v">{money(taxTotal)}</span>
              </li>
              <li className="to-fee">
                <ArrowRight size={14} aria-hidden />
                <span className="flow2-k">Evolve management fee</span>
                <span className="flow2-v">{money(fee)}</span>
              </li>
              <li className="to-you">
                <ArrowRight size={14} aria-hidden />
                <span className="flow2-k">{canceled ? 'You would have received' : 'You receive'}</span>
                <span className="flow2-v">{money(payout)}</span>
              </li>
            </ul>
          </div>
          <p className="sec-note">
            Taxes go to the State of Texas, the City of Austin and Travis County. Evolve remits them on the guest’s behalf. They aren’t part of your earnings and aren’t deducted from them.
          </p>
        </div>
      ) : null}
    </section>
  )
}

const round2 = (n: number) => Math.round(n * 100) / 100
