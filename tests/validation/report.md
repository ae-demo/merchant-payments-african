# Validation report

- **Issue:** #7
- **Commit:** 2c7310febb0ff0075a343fac5ac28b12f28ff6e4
- **Generated:** 2026-09-22T15:33:05.815Z
- **Playwright:** 1.61.1

## Summary

| Method | Total | Pass | Fail | Not run |
|---|---|---|---|---|
| e2e | 17 | 17 | 0 | 0 |
| manual (human checklist) | 1 | — | — | — |
| scenario (not validated) | 0 | — | — | — |

## E2E results

| Criterion | Must | Status | Spec | Notes |
|---|---|---|---|---|
| AC-001-a | A new merchant can submit business name, email, phone and country to register | ✅ pass | `tests/e2e/specs/AC-001-a.spec.ts` | — |
| AC-001-b | A registered merchant's currency is derived from their registered country | ✅ pass | `tests/e2e/specs/AC-001-b.spec.ts` | — |
| AC-002-a | An unauthenticated user cannot access the merchant dashboard or its data | ✅ pass | `tests/e2e/specs/AC-002-a.spec.ts` | — |
| AC-002-b | A signed-in merchant sees only their own account data, not another merchant's | ✅ pass | `tests/e2e/specs/AC-002-b.spec.ts` | — |
| AC-003-a | A signed-in merchant can create a payment request by specifying a sale amount | ✅ pass | `tests/e2e/specs/AC-003-a.spec.ts` | — |
| AC-003-b | Creating a payment request produces a shareable payment link | ✅ pass | `tests/e2e/specs/AC-003-b.spec.ts` | — |
| AC-004-a | Opening a payment link does not require the customer to sign in or create an account | ✅ pass | `tests/e2e/specs/AC-004-a.spec.ts` | — |
| AC-004-b | A customer can complete payment of a payment request using mobile money | ✅ pass | `tests/e2e/specs/AC-004-b.spec.ts` | — |
| AC-005-a | A customer can complete payment of a payment request using a debit/credit card | ✅ pass | `tests/e2e/specs/AC-005-a.spec.ts` | — |
| AC-006-a | After a successful payment, the customer is shown an on-screen success confirmation | ✅ pass | `tests/e2e/specs/AC-006-a.spec.ts` | — |
| AC-007-a | When a payment request is successfully paid, the merchant sees an in-app notification of the received payment | ✅ pass | `tests/e2e/specs/AC-007-a.spec.ts` | — |
| AC-008-a | A signed-in merchant can view a list of their transactions | ✅ pass | `tests/e2e/specs/AC-008-a.spec.ts` | — |
| AC-008-b | Each listed transaction shows its status as pending, successful, or failed | ✅ pass | `tests/e2e/specs/AC-008-b.spec.ts` | — |
| AC-009-a | A signed-in merchant can view their current available balance | ✅ pass | `tests/e2e/specs/AC-009-a.spec.ts` | — |
| AC-010-a | A signed-in merchant can submit a payout request specifying an amount and a destination | ✅ pass | `tests/e2e/specs/AC-010-a.spec.ts` | — |
| AC-010-b | A merchant can choose either a bank account or a mobile money wallet as the payout destination | ✅ pass | `tests/e2e/specs/AC-010-b.spec.ts` | — |
| AC-011-a | A signed-in merchant can view a list of their payout requests with their status | ✅ pass | `tests/e2e/specs/AC-011-a.spec.ts` | — |

## Manual checklist

- [ ] **AC-006-b** — The confirmation is clear and understandable to a non-technical customer

