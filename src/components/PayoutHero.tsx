import type { BookingView } from '../lib/derive'
import type { Dataset } from '../lib/types'
import { daysBetween, fmtDate, money } from '../lib/format'

export function PayoutHero({ ds, view }: { ds: Dataset; view: BookingView }) {
  const { booking, phase, money: m } = view
  const p = booking.payout!
  const today = ds.meta.todayForExercise
  const bank = `${ds.owner.bankAccount.institution} ••${ds.owner.bankAccount.lastFour}`

  let eyebrow = ''
  let headline = ''
  let sub: React.ReactNode = null

  if (p.status === 'paid') {
    eyebrow = 'You were paid'
    headline = money(p.amount)
    sub = (
      <>
        Deposited <strong>{fmtDate(p.depositedDate!)}</strong> to {bank}
      </>
    )
  } else if (p.status === 'pending') {
    eyebrow = 'Your payout is on its way'
    headline = money(p.amount)
    const d = daysBetween(today, p.expectedDepositDate!)
    sub = (
      <>
        Expected <strong>{fmtDate(p.expectedDepositDate!)}</strong> ({d <= 0 ? 'today' : `in ${d} day${d === 1 ? '' : 's'}`}) to {bank}. Guest checked in {fmtDate(booking.stay.checkIn)}.
      </>
    )
  } else if (p.status === 'scheduled') {
    eyebrow = 'You’ll be paid'
    headline = money(p.amount)
    sub = (
      <>
        Expected <strong>{fmtDate(p.expectedDepositDate!)}</strong>, a couple of days after the guest checks in on {fmtDate(booking.stay.checkIn)}. If the booking cancels, this changes.
      </>
    )
  } else {
    eyebrow = 'No payout'
    headline = '$0.00'
    sub = (
      <>
        This booking was canceled before check-in. The guest was refunded and no management fee was charged. The nights are back on your calendar.
      </>
    )
  }

  return (
    <section className={`hero hero-${p.status}`} aria-labelledby="hero-title">
      <div className="hero-main">
        <div className="eyebrow" id="hero-title">
          {eyebrow}
        </div>
        <div className="hero-amount">
          {headline}
          {phase === 'canceled' && m ? <span className="hero-was">was {money(m.base + m.cleaning - m.managementFee)}</span> : null}
        </div>
        <p className="hero-sub">{sub}</p>
      </div>

      {m && phase !== 'canceled' ? (
        <div className="hero-equation" aria-label="How the payout was calculated">
          <div className="eq-row">
            <span>Nightly rates</span>
            <span className="num">{money(m.base)}</span>
          </div>
          <div className="eq-row">
            <span>+ Cleaning fee</span>
            <span className="num">{money(m.cleaning)}</span>
          </div>
          <div className="eq-row eq-minus">
            <span>− Evolve fee ({Math.round(m.managementRate * 100)}% of nightly rates)</span>
            <span className="num">{money(m.managementFee)}</span>
          </div>
          <div className="eq-row eq-total">
            <span>Your payout</span>
            <span className="num">{money(m.payout)}</span>
          </div>
          <div className="eq-note">Taxes ({money(m.taxTotal)}) were collected from the guest and sent to Texas, Austin and Travis County. They never pass through your account.</div>
        </div>
      ) : null}

      <Timeline view={view} />
    </section>
  )
}

function Timeline({ view }: { view: BookingView }) {
  const { timeline, phase } = view
  return (
    <ol className={`timeline ${phase === 'canceled' ? 'is-canceled' : ''}`} aria-label="Booking timeline">
      {timeline.map((t) => (
        <li key={t.key} className={`tl-step ${t.done ? 'is-done' : ''} ${t.key === 'deposit' ? 'is-deposit' : ''}`}>
          <span className="tl-dot" aria-hidden />
          <span className="tl-label">{t.label}</span>
          <span className="tl-date">{fmtDate(t.date)}</span>
          {t.note ? <span className="tl-note">{t.note}</span> : null}
        </li>
      ))}
    </ol>
  )
}
