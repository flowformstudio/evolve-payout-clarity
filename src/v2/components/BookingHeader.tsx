import { Home } from 'lucide-react'
import type { Booking, Dataset } from '../../lib/types'
import { fmtRange, plural } from '../../lib/format'
import { phaseOf } from '../../lib/derive'

const STATUS: Record<string, string> = {
  in_progress: 'Currently staying',
  upcoming: 'Upcoming stay',
  completed: 'Stay completed',
  canceled: 'Canceled',
  blocked: 'Owner block',
}

export function BookingHeader({ ds, booking }: { ds: Dataset; booking: Booking }) {
  const phase = phaseOf(booking)
  const site = booking.bookingSite === 'Evolve' ? 'Booked direct on Evolve' : booking.bookingSite
  return (
    <header className="bh">
      <div className="bh-property">
        <Home size={14} strokeWidth={2} aria-hidden />
        <span>{ds.listing.name}</span>
        <span className="bh-dim">
          {ds.listing.city}, {ds.listing.state}
        </span>
      </div>
      <div className="bh-row">
        <h1 className="bh-title">{phase === 'blocked' ? 'Owner block' : booking.guest?.name}</h1>
        <span className={`bh-status is-${phase}`}>{STATUS[phase]}</span>
      </div>
      <p className="bh-meta">
        {fmtRange(booking.stay.checkIn, booking.stay.checkOut)} · {plural(booking.stay.nights, 'night')}
        {site ? ` · ${site}` : ''}
        {booking.bookingSite ? (
          <span className="bh-dim"> · Booking {booking.id}</span>
        ) : null}
      </p>
    </header>
  )
}
