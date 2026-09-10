# Booking payout clarity — Evolve take-home

Two design options for the booking detail screen an Evolve owner (Jordan Avery) sees for a single
booking. Both answer, in order: **What am I getting paid?** **When?** **How was it calculated?**
**What rates were booked?** **What did the guest pay, and where did the rest go?**

- **Option 1** (`#/`): two-pane layout, bookings rail plus detail, everything visible at once.
- **Option 2** (`#/v2`): one focused single-column page, progressive disclosure, calendar-style
  nightly rates, discreet demo-state control. Lands on Adaeze Okafor (guest currently staying,
  payout pending).

A floating pill in the bottom-right switches between them.

- Stack: Vite + React + TypeScript, plain CSS. No backend; the dataset is imported as static JSON.
- "Today" inside the prototype is 2026-05-17, per the brief.
- Deep links: `#/bookings/<id>` opens a specific booking (for push notifications and emails).

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
```

## Option 2 in one paragraph

Design thesis: *start with the owner's money, then progressively explain it.* The page follows the
owner's sequence of questions, not the JSON. Hero (amount, "Expected May 19", bank) → payout
progress strip → three-line calculation with a fee explainer → "What was booked" collapsed to
"6 nights · $732.14 stay revenue · $122.02 avg/night", expanding to a month calendar with the price
under each date, this booking highlighted and discounted nights marked → "What the guest paid",
expanding to the guest total and a flow to taxes / Evolve / you. The owner has one property, so
there is no property switcher. Source in `src/v2/`. Prototype-only nightly-rate data is isolated
in `src/v2/prototype-additions.ts`. The AI workflow record is in `docs/ai-workflow.md`.

## Structure

```
src/
  data/payouts-dataset.json   the provided dataset, unchanged
  lib/types.ts                dataset types
  lib/derive.ts               money model, per-night rates, discounts, "why this rate" insights
  lib/format.ts               currency and date helpers
  components/
    BookingList.tsx           left rail: YTD strip + all bookings grouped Now / Upcoming / Past
    BookingDetail.tsx         page shell, header, blocked-night state
    PayoutHero.tsx            the answer: amount, status, equation, timeline
    MoneyFlow.tsx             guest paid → taxes / Evolve fee / owner, with ledger
    RatesBooked.tsx           nightly rates, discounts, plain-language reasons
    StayDetails.tsx           guest and stay facts
    Assumptions.tsx           the assumptions panel (also in the app's top bar)
  v2/
    V2App.tsx                 Option 2 shell, default booking, demo states
    prototype-additions.ts    PROTOTYPE-ONLY nightly rates and discounts (not in the dataset)
    components/               BookingHeader, PayoutHero (+ status strip), PayoutBreakdown,
                              NightlyRates (calendar), GuestCharges, Info, BookingStateSwitcher
  OptionSwitcher.tsx          floating Option 1 / Option 2 pill
docs/ai-workflow.md           running record of where AI helped and where judgement stayed human
```

## Key decisions

1. **One number first.** The hero states the payout and its status in a sentence an owner can read
   in two seconds ("You were paid $880.06. Deposited May 8 to Lakeshore FCU ••4218"). The equation
   that produced it sits beside it, not below a fold.
2. **Guest paid vs. owner paid is the confusion to defuse.** "Where the money goes" shows the
   guest's total split into three destinations with one bar and one ledger. Taxes are explicitly
   "not your income and not your liability". The management fee is explicitly "15% of nightly rates
   only", because owners reasonably wonder whether cleaning is charged a fee.
3. **Rates are shown per night, with reasons.** The dataset gives one base line per booking, so
   nightly rates and discounts are derived (see below). The "Why these rates" panel translates
   pricing inputs (season, weekend, lead time, length of stay) into sentences.
4. **Every status has a real state.** Paid, on its way, scheduled, canceled and owner-blocked each
   change the hero's language and the timeline, instead of hiding behind a generic badge.
5. **Scales without redesign.** Owner → listing → bookings drives the property switcher and rail.
   Another listing is another entry in the switcher.

## Assumptions and dataset notes

The dataset file is left untouched. Where the brief asks for more than the file holds, the gap is
filled in `src/lib/derive.ts` and disclosed in the app (top bar → Assumptions):

- **Per-night rates** are derived by splitting the base amount, with Friday and Saturday nights
  25% above weeknights. Nights always add back up to the file's base amount to the cent.
- **Discounts** are inferred: 10% weekly (7+ nights), 12% last-minute (booked ≤ 3 days out),
  5% returning guest. Nightly rates are grossed up so the discounted total still equals the file's
  base amount. Payout math is never changed.
- **Season labels** are Austin-specific and month-based (SXSW, ACL, holidays, summer).
- Deposit dates in the file land two days after check-in; the README says 5 to 9 business days.
  The prototype trusts the file.
- One booking is marked paid with a deposit date one day after "today". Shown as paid, as the
  file says.
- Placeholder buttons: Download statement, Ask about this payout, Rate settings, Unblock.
