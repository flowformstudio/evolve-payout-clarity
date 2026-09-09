import type { BookingView } from '../lib/derive'
import { fmtDate, plural } from '../lib/format'

export function StayDetails({ view }: { view: BookingView }) {
  const b = view.booking
  const s = b.stay
  const g = b.guest
  const party = [
    s.adults ? plural(s.adults, 'adult') : null,
    s.children ? plural(s.children, 'child', 'children') : null,
    s.infants ? plural(s.infants, 'infant') : null,
    s.pets ? 'pets' : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <section className="card card-compact" aria-labelledby="stay-title">
      <header className="card-head">
        <h2 id="stay-title">Guest and stay</h2>
      </header>
      <dl className="facts">
        <div>
          <dt>Guest</dt>
          <dd>
            {g?.name ?? '—'}
            {b.returningGuest ? <span className="tag tag-returning">Returning guest</span> : null}
          </dd>
        </div>
        <div>
          <dt>Party</dt>
          <dd>{party || '—'}</dd>
        </div>
        <div>
          <dt>Contact</dt>
          <dd>
            {g?.phone ?? <span className="muted">Phone not shared</span>}
            <br />
            {g?.email ?? <span className="muted">{b.bookingSite === 'Airbnb' ? 'Airbnb hides guest email' : 'Email not shared'}</span>}
          </dd>
        </div>
        <div>
          <dt>Booked</dt>
          <dd>
            {fmtDate(b.dateBooked)} <span className="muted">· {view.leadDays === 0 ? 'same day' : `${view.leadDays} days ahead`}</span>
          </dd>
        </div>
        <div>
          <dt>Booking ID</dt>
          <dd className="mono">{b.id}</dd>
        </div>
        <div>
          <dt>Channel</dt>
          <dd>{b.bookingSite === 'Evolve' ? 'Evolve direct' : b.bookingSite}</dd>
        </div>
      </dl>
    </section>
  )
}
