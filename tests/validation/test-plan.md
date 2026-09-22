# Validation test plan — merchant-payments-african v1

Targets: `merchant-webapp` (primary, browser specs), `merchant-api` (direct,
unauthenticated API checks only — authenticated calls go through the webapp's
own `/api/*` proxy since the OIDC access token lives in the browser's
`localStorage`, attached by the app's own fetch wrapper).

Login: `lib/auth.ts`'s `signInAsMerchant(page, username, password)` drives the
Thunder sign-in gate at `/` and, if the account has no merchant profile yet,
completes `/onboarding` with throwaway defaults so every spec can assume a
signed-in, onboarded merchant regardless of prior runs. Credentials come only
from `process.env.AEP_E2E_USERNAME` / `_PASSWORD` (test-merchant) and
`_USERNAME_2` / `_PASSWORD_2` (test-merchant-2, used only by AC-002-b for
cross-account isolation).

## Re-validation 2026-09-22 — AC-004-a defect fixed

`merchant-api/mapping.bal` was updated (#9/#10, commit `2c7310f`) so
`paymentLinkUrl` now points at the webapp's public `/pay/{id}` route instead
of the API's `/payment-links/{id}` path. Re-ran the full regression suite
(17/17 specs) against the deployed system with no spec changes: AC-004-a now
passes — a guest opening the displayed "Shareable link" reaches the pay
screen with no sign-in prompt. All 17 e2e criteria pass; no new defects
found. The section below is kept for history (it described the pre-fix
behaviour); AC-004-a's spec itself was never modified.

## Known app defect affecting AC-004-a (see full writeup at that section) — RESOLVED, see re-validation note above

The payment request detail screen shows a "Shareable link" built from the
API's `PaymentRequest.paymentLinkUrl`, which `merchant-api` sets to
`/payment-links/{id}` (`merchant-api/mapping.bal:21`). That path is not a
route the webapp's router treats as public (`merchant-webapp/src/authz/screens.ts`
only marks `/pay/:paymentRequestId` public) — opening it redirects an
unauthenticated visitor straight to the Thunder sign-in gate. The frontend's
own fallback (`merchant-webapp/src/pages/PaymentRequestDetail.tsx`) already
knows the real customer-facing path is `/pay/{id}`; it just never gets used
because the API's field is never null. AC-004-a tests the literal displayed
link and fails honestly on this. AC-004-b/AC-005-a/AC-006-a/AC-007-a instead
drive the working `/pay/{id}` route directly, since those criteria are about
the payment mechanics once a customer is on the pay screen, not about the
merchant's copy-pasted link text.

## AC-001-a — A new merchant can submit business name, email, phone and country to register

- Target: merchant-webapp (primary)
- Steps:
  1. Sign in as test-merchant, navigate to `/onboarding` (always reachable to
     a signed-in caller, independent of whether a profile already exists —
     `screens.ts`'s `merchant-onboarding` entry has no scope gate).
  2. Fill business name, email, phone with unique (`Date.now()`-suffixed)
     values; select country "Kenya".
  3. Click Continue; capture the `POST /api/me/merchant` response.
- Assert: the response status is 201, and its JSON echoes the submitted
  businessName, email, phone and country ("KE").
- Source of truth: live exploration (`onboarding` screen, `POST /me/merchant`
  in `merchant-api/openapi.yaml`).

## AC-001-b — A registered merchant's currency is derived from their registered country

- Target: merchant-webapp (primary)
- Steps: same onboarding flow as AC-001-a, using test-merchant-2 and country
  "Uganda" (confirmed live: `country: "UG"` → `currency: "UGX"`).
- Assert: the `POST /api/me/merchant` response JSON has `country: "UG"` and
  `currency: "UGX"`.
- Source of truth: live exploration; `domain-model.md` ("country fixes
  currency").

## AC-002-a — An unauthenticated user cannot access the merchant dashboard or its data

- Target: merchant-webapp (primary) + merchant-api (direct)
- Steps:
  1. In a fresh (no storage state) context, navigate to `/dashboard`.
  2. Separately, call `GET {merchant-api}/me/merchant` with no Authorization
     header.
- Assert: (1) the browser ends up on the Thunder sign-in gate (`Sign In`
  heading visible, URL host is the IdP) rather than any dashboard content;
  (2) the direct API call returns 401.
- Source of truth: live exploration; `openapi.yaml`'s `401` response on
  `GET /me/merchant`.

## AC-002-b — A signed-in merchant sees only their own account data, not another merchant's

- Target: merchant-webapp (primary)
- Steps:
  1. Sign in as test-merchant; create a payment request; capture its id from
     the resulting `/payment-requests/{id}` URL.
  2. In a separate browser context, sign in as test-merchant-2.
  3. Navigate to `/payment-requests/{id}` (test-merchant's id) as
     test-merchant-2.
- Assert: the page shows "This payment request could not be found." rather
  than test-merchant's data.
- Source of truth: live exploration.

## AC-003-a — A signed-in merchant can create a payment request by specifying a sale amount

- Target: merchant-webapp (primary)
- Steps: sign in as test-merchant; go to `/payment-requests/new`; fill a
  unique Amount; click Create.
- Assert: navigation lands on `/payment-requests/{id}`, and the amount is
  displayed.
- Source of truth: live exploration; `wireframes.dsl` `CreatePaymentRequest`.

## AC-003-b — Creating a payment request produces a shareable payment link

- Target: merchant-webapp (primary)
- Steps: same creation flow as AC-003-a.
- Assert: the detail page shows "Shareable link:" text containing the created
  payment request's id (a link string is produced — see the note above for
  why the link's *destination* is checked separately under AC-004-a).
- Source of truth: live exploration; `wireframes.dsl` `PaymentRequestDetail`.

## AC-004-a — Opening a payment link does not require the customer to sign in or create an account

- Target: merchant-webapp (primary)
- Steps:
  1. Sign in as test-merchant; create a payment request; read the exact
     "Shareable link:" text from the detail page.
  2. In a fresh (no storage state) context, navigate to that exact link.
- Assert: **genuine failure expected** — the visitor is redirected to the
  Thunder sign-in gate instead of reaching a payment screen. See the defect
  writeup above.
- Source of truth: live exploration.

## AC-004-b — A customer can complete payment of a payment request using mobile money

- Target: merchant-webapp (primary)
- Steps:
  1. Sign in as test-merchant; create a payment request; capture its id.
  2. In a fresh context, navigate to `/pay/{id}` (the router's actual public
     route); select "Mobile money"; fill a mobile money number; click "Pay
     now".
- Assert: navigation lands on `/pay/{id}/confirmation` with a success badge.
- Source of truth: live exploration; `wireframes.dsl` `PaymentPage`.

## AC-005-a — A customer can complete payment of a payment request using a debit/credit card

- Target: merchant-webapp (primary)
- Steps: as AC-004-b, but select "Card" and fill card number/expiry/CVV.
- Assert: navigation lands on `/pay/{id}/confirmation` with a success badge.
- Source of truth: live exploration.

## AC-006-a — After a successful payment, the customer is shown an on-screen success confirmation

- Target: merchant-webapp (primary)
- Steps: as AC-004-b.
- Assert: the confirmation page shows "Payment successful" and text naming
  the amount, currency and merchant.
- Source of truth: live exploration; `wireframes.dsl` `PaymentConfirmation`.

## AC-006-b — The confirmation is clear and understandable to a non-technical customer (manual)

Not automated. Rendered as a human checklist item in the report.

## AC-007-a — When a payment request is successfully paid, the merchant sees an in-app notification of the received payment

- Target: merchant-webapp (primary)
- Steps:
  1. Sign in as test-merchant; create a payment request; capture its id.
  2. In a fresh context, pay it via `/pay/{id}` (mobile money).
  3. Back in the merchant's page, navigate to `/dashboard`.
- Assert: an alert is visible reading "A payment request was just paid —
  check Transactions for the details."
- Source of truth: live exploration.

## AC-008-a — A signed-in merchant can view a list of their transactions

- Target: merchant-webapp (primary)
- Steps: sign in as test-merchant; create+pay a payment request (mobile
  money); navigate to `/transactions`.
- Assert: the transactions table shows at least one row (not the "No
  transactions yet" empty state).
- Source of truth: live exploration; `wireframes.dsl` `Transactions`.

## AC-008-b — Each listed transaction shows its status as pending, successful, or failed

- Target: merchant-webapp (primary)
- Steps: same as AC-008-a.
- Assert: the newly created transaction's row shows a Status cell whose text
  is one of Pending/Successful/Failed (here: "Successful").
- Source of truth: live exploration; `openapi.yaml` `Transaction.status` enum.

## AC-009-a — A signed-in merchant can view their current available balance

- Target: merchant-webapp (primary)
- Steps: sign in as test-merchant; navigate to `/dashboard`.
- Assert: an "Available balance" stat card is visible showing a numeric value
  and a currency code.
- Source of truth: live exploration; `wireframes.dsl` `Dashboard`.

## AC-010-a — A signed-in merchant can submit a payout request specifying an amount and a destination

- Target: merchant-webapp (primary)
- Steps: sign in as test-merchant; create+pay a payment request (mobile
  money) to guarantee available balance; go to `/payouts/new`; fill a small
  Amount, leave destination type "Bank", fill destination details; Submit.
- Assert: navigation returns to `/payouts` and the new payout row is listed
  with a Status.
- Source of truth: live exploration; `wireframes.dsl` `RequestPayout`.

## AC-010-b — A merchant can choose either a bank account or a mobile money wallet as the payout destination

- Target: merchant-webapp (primary)
- Steps: as AC-010-a, but select "Mobile money wallet" as the destination
  type.
- Assert: the payouts list shows the new payout with a destination label
  reflecting the wallet details (not a bank label).
- Source of truth: live exploration.

## AC-011-a — A signed-in merchant can view a list of their payout requests with their status

- Target: merchant-webapp (primary)
- Steps: sign in as test-merchant; create+pay a payment request; request a
  payout; navigate to `/payouts`.
- Assert: the payouts table shows at least one row with a Status cell.
- Source of truth: live exploration; `wireframes.dsl` `Payouts`.
