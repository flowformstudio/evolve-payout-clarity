import { Mail, Phone, MessageSquare } from 'lucide-react'
import type { Booking, Dataset } from '../lib/types'
import { fmtRange, plural } from '../lib/format'
import { phaseOf } from '../lib/derive'

const STATUS: Record<string, string> = {
  in_progress: 'Currently staying',
  upcoming: 'Upcoming stay',
  completed: 'Stay completed',
  canceled: 'Canceled',
  blocked: 'Owner block',
}

const AVATAR_COLORS = ['#dfe7f7', '#e9f4ee', '#fbf1dc', '#f1e9fb', '#fbeae9', '#e3f1f4']
const AVATAR_INK = ['#1f3f7a', '#1c6b4a', '#8a5a00', '#6b3fb0', '#a43430', '#1f6a7a']

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

/** Who is staying, when, from where, and how to reach them. Financials live elsewhere. */
export function GuestTile({ ds, booking }: { ds: Dataset; booking: Booking }) {
  const phase = phaseOf(booking)
  const g = booking.guest
  const name = g?.name ?? 'Owner block'
  const hue = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_COLORS.length
  const site = booking.bookingSite === 'Evolve' ? 'Evolve direct' : booking.bookingSite
  const party = [
    booking.stay.adults ? plural(booking.stay.adults, 'adult') : null,
    booking.stay.children ? plural(booking.stay.children, 'child', 'children') : null,
    booking.stay.infants ? plural(booking.stay.infants, 'infant') : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <section className="tile tile-guest" aria-labelledby="guest-title">
      <div className="guest-top">
        <span className="avatar3" style={{ background: AVATAR_COLORS[hue], color: AVATAR_INK[hue] }} aria-hidden>
          {g ? initials(g.name) : '—'}
        </span>
        <div>
          <h1 className="guest-name" id="guest-title">
            {name}
          </h1>
          <span className={`bh-status is-${phase}`}>{STATUS[phase]}</span>
        </div>
      </div>

      <dl className="guest-facts">
        <div>
          <dt>Dates</dt>
          <dd>
            {fmtRange(booking.stay.checkIn, booking.stay.checkOut)} · {plural(booking.stay.nights, 'night')}
          </dd>
        </div>
        {party ? (
          <div>
            <dt>Guests</dt>
            <dd>{party}</dd>
          </div>
        ) : null}
        {site ? (
          <div>
            <dt>Booked on</dt>
            <dd>{site}</dd>
          </div>
        ) : null}
        <div>
          <dt>Booking</dt>
          <dd className="mono3">{booking.id}</dd>
        </div>
        <div>
          <dt>Property</dt>
          <dd>{ds.listing.name}</dd>
        </div>
      </dl>

      {g ? (
        <div className="guest-contact">
          <button className="btn3" title="Message through the booking site">
            <MessageSquare size={14} aria-hidden /> Message
          </button>
          {g.phone ? (
            <a className="btn3 btn3-ghost" href={`tel:${g.phone.replace(/\s/g, '')}`}>
              <Phone size={14} aria-hidden /> {g.phone}
            </a>
          ) : (
            <span className="guest-hidden">
              <Phone size={14} aria-hidden /> Phone not shared
            </span>
          )}
          {g.email ? (
            <a className="btn3 btn3-ghost" href={`mailto:${g.email}`}>
              <Mail size={14} aria-hidden /> {g.email}
            </a>
          ) : (
            <span className="guest-hidden">
              <Mail size={14} aria-hidden /> {booking.bookingSite === 'Airbnb' ? 'Email hidden by Airbnb' : 'Email not shared'}
            </span>
          )}
        </div>
      ) : null}
    </section>
  )
}
