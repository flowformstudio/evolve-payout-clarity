import type { BookingView } from '../lib/derive'
import { money, pct } from '../lib/format'

/**
 * "Where the money goes": one bar that splits what the guest paid into
 * taxes (remitted), Evolve's fee, and the owner's payout, with a ledger under it.
 */
export function MoneyFlow({ view }: { view: BookingView }) {
  const m = view.money!
  const canceled = view.phase === 'canceled'
  const total = m.guestPaid
  const seg = (n: number) => `${(n / total) * 100}%`

  return (
    <section className={`card ${canceled ? 'is-ghost' : ''}`} aria-labelledby="flow-title">
      <header className="card-head">
        <h2 id="flow-title">Where the money goes</h2>
        <p className="card-lead">
          {canceled ? 'What the guest would have paid, had the stay happened.' : <>The guest paid <strong>{money(m.guestPaid)}</strong> in total. Here is how it splits.</>}
        </p>
      </header>

      <div className="flowbar" role="img" aria-label={`Guest paid ${money(m.guestPaid)}: ${money(m.payout)} to you, ${money(m.managementFee)} Evolve fee, ${money(m.taxTotal)} taxes.`}>
        <div className="flowbar-seg seg-you" style={{ width: seg(m.payout) }} />
        <div className="flowbar-seg seg-fee" style={{ width: seg(m.managementFee) }} />
        <div className="flowbar-seg seg-tax" style={{ width: seg(m.taxTotal) }} />
      </div>
      <div className="flow-legend">
        <div className="legend-item">
          <span className="swatch seg-you" />
          <span className="legend-label">You</span>
          <span className="num">{money(m.payout)}</span>
          <span className="legend-pct">{pct(m.payout / total)}</span>
        </div>
        <div className="legend-item">
          <span className="swatch seg-fee" />
          <span className="legend-label">Evolve</span>
          <span className="num">{money(m.managementFee)}</span>
          <span className="legend-pct">{pct(m.managementFee / total)}</span>
        </div>
        <div className="legend-item">
          <span className="swatch seg-tax" />
          <span className="legend-label">Taxes</span>
          <span className="num">{money(m.taxTotal)}</span>
          <span className="legend-pct">{pct(m.taxTotal / total)}</span>
        </div>
      </div>

      <table className="ledger">
        <caption className="sr-only">Guest charges and where each goes</caption>
        <thead>
          <tr>
            <th scope="col">Guest was charged</th>
            <th scope="col" className="num">
              Amount
            </th>
            <th scope="col">Goes to</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              Nightly rates <span className="muted">· {view.booking.stay.nights} nights</span>
            </td>
            <td className="num">{money(m.base)}</td>
            <td>
              <span className="tag tag-you">You</span> {money(m.base - m.managementFee)} <span className="muted">after {pct(m.managementRate)} fee</span>
            </td>
          </tr>
          <tr>
            <td>Cleaning fee</td>
            <td className="num">{money(m.cleaning)}</td>
            <td>
              <span className="tag tag-you">You</span> in full, no fee
            </td>
          </tr>
          {m.taxes.map((t) => (
            <tr key={t.name} className="row-tax">
              <td>
                {shortTax(t.name)} <span className="muted">· {pct(t.rate)} of rates + cleaning</span>
              </td>
              <td className="num">{money(t.amount)}</td>
              <td>
                <span className="tag tag-tax">Tax authority</span> remitted by Evolve
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Guest paid</th>
            <td className="num">{money(m.guestPaid)}</td>
            <td />
          </tr>
          <tr>
            <th scope="row">Evolve management fee</th>
            <td className="num">−{money(m.managementFee)}</td>
            <td className="muted">{pct(m.managementRate)} of nightly rates only. Cleaning and taxes are never charged a fee.</td>
          </tr>
          <tr>
            <th scope="row">Taxes remitted</th>
            <td className="num">−{money(m.taxTotal)}</td>
            <td className="muted">Not your income and not your liability.</td>
          </tr>
          <tr className="row-total">
            <th scope="row">{canceled ? 'Would have been your payout' : 'Your payout'}</th>
            <td className="num">{money(m.payout)}</td>
            <td />
          </tr>
        </tfoot>
      </table>
    </section>
  )
}

function shortTax(name: string) {
  if (name.startsWith('Texas')) return 'Texas state tax'
  if (name.startsWith('City of Austin')) return 'City of Austin tax'
  if (name.startsWith('Travis')) return 'Travis County tax'
  return name
}
