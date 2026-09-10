import type { Booking, Dataset } from '../../lib/types'
import { money } from '../../lib/format'
import { Info } from './Info'

/** "How your payout is calculated": three lines the owner can reproduce in their head. */
export function PayoutBreakdown({ ds, booking }: { ds: Dataset; booking: Booking }) {
  const base = booking.lineItems.find((l) => l.type === 'base')!.amount
  const cleaning = booking.lineItems.find((l) => l.type === 'fee')?.amount ?? 0
  const canceled = booking.payout!.status === 'canceled'
  const fee = canceled ? 0 : booking.payout!.managementFee
  const payout = booking.payout!.amount
  const ratePct = Math.round(ds.listing.managementFeeRate * 100)

  return (
    <section className="sec" aria-labelledby="calc-title">
      <h2 className="sec-title" id="calc-title">
        How your payout is calculated
      </h2>
      <dl className="calc">
        <div className="calc-row">
          <dt>Stay revenue</dt>
          <dd>{money(base)}</dd>
        </div>
        <div className="calc-row">
          <dt>Cleaning fee</dt>
          <dd>+{money(cleaning)}</dd>
        </div>
        <div className="calc-row calc-fee">
          <dt>
            Evolve management fee
            <Info label="About the management fee">
              Your {ds.owner.plan} plan management fee is {ratePct}% of the nightly rate. The cleaning fee passes through to you in full.
              {!canceled ? (
                <>
                  <br />
                  <span className="info-math">
                    {ratePct}% × {money(base)} = {money(fee)}
                  </span>
                </>
              ) : null}
            </Info>
          </dt>
          <dd>−{money(fee)}</dd>
        </div>
        <div className="calc-row calc-total">
          <dt>{canceled ? 'Your payout (canceled)' : 'Your payout'}</dt>
          <dd>{money(payout)}</dd>
        </div>
      </dl>
      {canceled ? (
        <p className="sec-note">
          The stay would have paid {money(base + cleaning - base * ds.listing.managementFeeRate)}. Because it was canceled before check-in, the guest was refunded and no fee was charged.
        </p>
      ) : null}
    </section>
  )
}
