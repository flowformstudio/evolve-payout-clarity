import type { BookingView, Phase } from '../lib/derive'
import type { Dataset } from '../lib/types'
import { fmtRange, plural } from '../lib/format'
import { PayoutHero } from './PayoutHero'
import { MoneyFlow } from './MoneyFlow'
import { RatesBooked } from './RatesBooked'
import { StayDetails } from './StayDetails'
import { SiteMark } from './SiteMark'

const PHASE_LABEL: Record<Phase, string> = {
  in_progress: 'Guest is here',
  upcoming: 'Upcoming',
  completed: 'Completed',
  canceled: 'Canceled',
  blocked: 'Blocked',
}

export function BookingDetail({ ds, view }: { ds: Dataset; view: BookingView }) {
  const b = view.booking
  const s = b.stay

  return (
    <article className="detail" aria-labelledby="detail-title">
      <header className="detail-head">
        <div className="crumbs">
          <a href="#/bookings" onClick={(e) => e.preventDefault()}>
            Bookings
          </a>
          <span aria-hidden>/</span>
          <span className="mono">{b.id}</span>
        </div>
        <div className="detail-title-row">
          <h1 id="detail-title">
            {view.phase === 'blocked' ? 'Owner block' : b.guest?.name}
          </h1>
          <span className={`pill pill-lg pill-${view.phase}`}>{PHASE_LABEL[view.phase]}</span>
        </div>
        <p className="detail-meta">
          {fmtRange(s.checkIn, s.checkOut)} · {plural(s.nights, 'night')}
          {b.bookingSite ? (
            <>
              {' '}
              · <SiteMark site={b.bookingSite} withLabel />
            </>
          ) : null}
          {' '}· {ds.listing.name}
        </p>
      </header>

      {view.phase === 'blocked' ? (
        <BlockedBody view={view} />
      ) : (
        <>
          <PayoutHero ds={ds} view={view} />
          <MoneyFlow view={view} />
          <RatesBooked view={view} />
          <StayDetails view={view} />
          <footer className="detail-actions">
            <button className="btn">Download statement</button>
            <button className="btn">Ask about this payout</button>
            <button className="btn btn-ghost">Something looks off?</button>
          </footer>
        </>
      )}
    </article>
  )
}

function BlockedBody({ view }: { view: BookingView }) {
  const s = view.booking.stay
  return (
    <section className="card">
      <header className="card-head">
        <h2>Nothing to pay out</h2>
        <p className="card-lead">
          You blocked {plural(s.nights, 'night')} on your calendar, {fmtRange(s.checkIn, s.checkOut)}. Blocked nights are not listed for guests, so there is no booking, no guest payment and no payout.
        </p>
      </header>
      <div className="detail-actions">
        <button className="btn">Unblock these dates</button>
        <button className="btn btn-ghost">Edit block</button>
      </div>
    </section>
  )
}
