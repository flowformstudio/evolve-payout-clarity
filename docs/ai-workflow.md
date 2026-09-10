# AI workflow record

Kept as the build progressed, for the "how AI helped or slowed you down" part of the video.
Tooling: Claude Code in the terminal, with the brief PDF, README and JSON in the working folder.

## What AI accelerated

- **Reading the dataset.** Parsed all 40 entries, tallied statuses and channels, and verified the
  payout formula (base + cleaning − 15% of base) against every reservation before any UI existed.
  All 29 reconcile to the cent. Time: minutes instead of an hour in a spreadsheet.
- **Spotting data quirks early.** Deposits land 2 to 3 days after check-in in the file while the
  README says 5 to 9 business days; one booking is paid with a deposit dated after "today";
  the canceled booking carries full guest charges with a $0 payout. Each became a documented
  assumption instead of a surprise in the demo.
- **Component scaffolding.** Typed data layer, formatting helpers, and the first pass of every
  component came from one described hierarchy. Two full design options were built in the same
  repo in roughly the time one would normally take.
- **Status variants.** Paid, pending, scheduled, canceled and owner-block treatments were generated
  from one set of rules and then checked by screenshot, state by state.
- **Visual QA loop.** AI drove a headless browser, captured each state, and the screenshots were
  reviewed like design comps. Caught: a $0 fee row on the canceled ledger, a table stretching to
  its neighbour's height, a sidebar scroll that dragged the whole page, other guests' nights
  showing list price instead of booked price on the calendar.
- **The assumptions list.** Every judgement call was written down at the moment it was made.

## Where human judgement stayed in charge

- **Information hierarchy.** "Start with the owner's money, then progressively explain it" was
  the brief to the tool, not an output of it. The page order (what → when → how → what was booked
  → what the guest paid) was decided before code.
- **What to collapse.** Nightly rates and guest charges are behind disclosures; the payout and its
  calculation are not. That split is a product decision about the two owner modes (quick check vs.
  investigation).
- **Financial language.** "Taxes aren't deducted from your payout", "in full, no fee",
  "Payout processing" replaced accurate-but-flat generated copy.
- **Rate derivation constraints.** The tool's first instinct was to make discounts look plausible.
  The real constraint is that derived nights must sum to the file's base amount to the cent, with
  the rounding residual landing somewhere defensible. Decided by hand, then implemented.
- **Choosing what not to build.** No second property (the owner has one), no revenue-management
  system behind the calendar, no charts without a decision attached, no mobile investment.
- **Default state.** Option 1's first draft landed on the booking whose deposit is dated after
  "today". Option 2 lands on the pending booking on purpose: the guest is in the house and the
  owner is waiting for money. That is the most useful moment to design for.

## Where it slowed things down

- Silent divergence between the README and the file (deposit timing) had to be noticed by a
  person; the tool trusted whichever it read last until told to treat the file as truth.
- Layout bugs that only show up visually (scroll containers, table stretching) took a
  screenshot cycle each. Cheap, but not free.
- Generated copy needed a full editing pass. Correct is not the same as clear.
