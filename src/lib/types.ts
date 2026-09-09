export type BookingStatus = 'checked_out' | 'checked_in' | 'booked' | 'canceled' | 'blocked'
export type PayoutStatus = 'paid' | 'pending' | 'scheduled' | 'canceled'
export type LineItemType = 'base' | 'fee' | 'tax'

export interface LineItem {
  description: string
  amount: number
  type: LineItemType
}

export interface Payout {
  amount: number
  managementFee: number
  status: PayoutStatus
  expectedDepositDate: string | null
  depositedDate: string | null
}

export interface Guest {
  name: string
  email: string | null
  phone: string | null
}

export interface Stay {
  checkIn: string
  checkOut: string
  nights: number
  adults: number | null
  children: number | null
  infants: number | null
  pets: boolean | null
}

export interface Booking {
  id: string
  status: BookingStatus
  bookingSite: string | null
  guest: Guest | null
  stay: Stay
  dateBooked: string
  lineItems: LineItem[]
  payout: Payout | null
  returningGuest: boolean
}

export interface TaxDef {
  name: string
  rate: number
  appliesTo: string
}

export interface Dataset {
  meta: {
    description: string
    generatedOn: string
    todayForExercise: string
    currencyCode: string
    currencySymbol: string
  }
  owner: {
    id: string
    displayName: string
    email: string
    bankAccount: { institution: string; lastFour: string }
    plan: string
    planDescription: string
  }
  listing: {
    id: string
    name: string
    city: string
    state: string
    country: string
    bedrooms: number
    bathrooms: number
    sleeps: number
    managementFeeRate: number
    cleaningFee: number
  }
  taxes: TaxDef[]
  bookings: Booking[]
}
