import type { BookingView } from '../lib/derive'
import { fmtDay, money, weekday } from '../lib/format'

/** "What rates were booked, and why": per-night rates, discounts, and plain-language reasons. */
export function RatesBooked({ view }: { view: BookingView }) {
  const { nights, nightsSubtotal, adjustments, money: m, insights, avgNightly } = view
  const canceled = view.phase === 'canceled'
  const max = Math.max(...nights.map((n) => n.rate))

  return (
    <section className={`card ${canceled ? 'is-ghost' : ''}`} aria-labelledby="rates-title">
      <header className="card-head">
        <h2 id="rates-title">What rates were booked</h2>
        <p className="card-lead">
          Averages <strong>{money(avgNightly)}</strong> per night across {nights.length} nights.
        </p>
      </header>

      <div className="rates-grid">
        <table className="nights">
          <caption className="sr-only">Nightly rates</caption>
          <tbody>
            {nights.map((n) => (
              <tr key={n.date} className={n.weekend ? 'is-weekend' : ''}>
                <td className="night-day">
                  <span className="night-dow">{weekday(n.date)}</span>
                  <span className="night-date">{fmtDay(n.date).replace(/^\w+, /, '')}</span>
                </td>
                <td className="night-bar">
                  <span className="bar" style={{ width: `${(n.rate / max) * 100}%` }} />
                </td>
                <td className="num">{money(n.rate)}</td>
                <td className="night-tag">{n.weekend ? <span className="tag tag-weekend">Weekend</span> : null}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            {adjustments.length ? (
              <tr>
                <th scope="row" colSpan={2}>
                  Nights subtotal
                </th>
                <td className="num">{money(nightsSubtotal)}</td>
                <td />
              </tr>
            ) : null}
            {adjustments.map((a) => (
              <tr key={a.id} className="row-discount">
                <th scope="row" colSpan={2}>
                  {a.label} <span className="muted">· {Math.round(a.pct * 100)}%</span>
                </th>
                <td className="num">−{money(a.amount)}</td>
                <td />
              </tr>
            ))}
            <tr className="row-total">
              <th scope="row" colSpan={2}>
                Nightly rates{adjustments.length ? ' after discounts' : ''}
              </th>
              <td className="num">{money(m!.base)}</td>
              <td />
            </tr>
          </tfoot>
        </table>

        <aside className="why" aria-labelledby="why-title">
          <h3 id="why-title">Why these rates</h3>
          <ul>
            {insights.map((i, idx) => (
              <li key={idx} className={`why-${i.kind}`}>
                {i.text}
              </li>
            ))}
          </ul>
          <p className="why-foot">
            Evolve sets nightly rates for your listing using local demand, day of week, lead time and length of stay. You can set floors and blackout dates in <a href="#rates" onClick={(e) => e.preventDefault()}>Rate settings</a>.
          </p>
        </aside>
      </div>
    </section>
  )
}
