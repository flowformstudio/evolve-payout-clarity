const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const usdWhole = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export const money = (n: number) => usd.format(n)
export const moneyWhole = (n: number) => usdWhole.format(n)
export const signed = (n: number) => (n < 0 ? `−${usd.format(Math.abs(n))}` : usd.format(n))
export const pct = (n: number) => `${Math.round(n * 100)}%`

/** Parse an ISO YYYY-MM-DD as a local date (avoids UTC shift). */
export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso)
  d.setDate(d.getDate() + days)
  return toISO(d)
}

export function toISO(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 86400000)
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** "Nov 25, 2025" */
export function fmtDate(iso: string, withYear = true): string {
  const d = parseISO(iso)
  return `${MONTHS[d.getMonth()]} ${d.getDate()}${withYear ? `, ${d.getFullYear()}` : ''}`
}

/** "Tue, Nov 25" */
export function fmtDay(iso: string): string {
  const d = parseISO(iso)
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`
}

export function weekday(iso: string): string {
  return DAYS[parseISO(iso).getDay()]
}

/** "Nov 25 – 30, 2025" or "Dec 26, 2025 – Jan 2, 2026" */
export function fmtRange(a: string, b: string): string {
  const da = parseISO(a)
  const db = parseISO(b)
  if (da.getFullYear() === db.getFullYear()) {
    if (da.getMonth() === db.getMonth()) {
      return `${MONTHS[da.getMonth()]} ${da.getDate()} – ${db.getDate()}, ${da.getFullYear()}`
    }
    return `${MONTHS[da.getMonth()]} ${da.getDate()} – ${MONTHS[db.getMonth()]} ${db.getDate()}, ${da.getFullYear()}`
  }
  return `${fmtDate(a)} – ${fmtDate(b)}`
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`
}
