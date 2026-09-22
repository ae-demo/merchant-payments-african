# Merchant Payments African — PRD

## Problem Statement

Small and medium merchants across African countries need a simple way to accept
payments from customers who mostly pay via mobile money or debit/credit cards.
Today merchants juggle multiple mobile money apps and card terminals, have no
unified record of what they have collected, and have no simple way to move
collected funds into their own bank or mobile wallet.

## Solution

A merchant payments platform where a merchant signs up, creates payment
requests (links) for a sale, and collects money from customers via mobile
money or card — with no account required on the customer's side. The merchant
gets a single transaction history and can request a payout of their collected
balance.

## Actors

- **Merchant**: signs up and signs in to the platform, creates payment
requests, views their transaction history and balance, and requests
payouts.
- **Customer**: pays a merchant through a payment page via mobile money or
card, as a guest — no account or sign-in required.

## User Stories

1. As a merchant, I want to sign up and provide basic business details, so
 that I can start accepting payments.
2. As a merchant, I want to sign in securely, so that only I can manage my
 account and see my transactions.
3. As a merchant, I want to create a payment request (a payment page/link)
 for a sale amount, so that I can send it to a customer to pay.
4. As a customer, I want to pay a merchant's payment request via mobile
 money, so that I can complete a purchase without creating an account.
5. As a customer, I want to pay a merchant's payment request via card, so
 that I can complete a purchase using my debit/credit card.
6. As a customer, I want to see a clear confirmation once my payment
 succeeds, so that I know the purchase went through.
7. As a merchant, I want to be notified when a payment is received, so that
 I know to fulfill the order.
8. As a merchant, I want to view a history of all my transactions with their
 status (pending, successful, failed), so that I can track my sales.
9. As a merchant, I want to see my available balance, so that I know how
 much I can withdraw.
10. As a merchant, I want to request a payout of my available balance to my
 own bank account or mobile money wallet, so that I can access my funds.
11. As a merchant, I want to see the status of my payout requests, so that I
 know when my money has been sent.

## Product Decisions

- **Sign-in**: merchants sign in via Thunder, the platform SSO (org
default). Customers pay as guests — no sign-in.
- **Payments processing**: mobile money and card collection is handled
through the `payment-gateway` registered resource (org default internal
payment gateway) rather than a hand-rolled or newly-chosen provider.
- **Notifications**: payment-received notifications to merchants, and
payment confirmations to customers, are sent via the `sms-service` and
`email-service` registered resources (org defaults) — SMS and email,
respectively. *assumed*
- **Merchant onboarding depth**: sign-up collects business name, contact
email, phone number and country only; no document/KYC upload is
collected in this product. *assumed*
- **Countries &amp; currency**: the platform supports multiple African
countries, each merchant operating in one currency tied to their
registered country (e.g. NGN, KES, GHS, ZAR); the platform does not do
cross-currency conversion. *assumed*
- **Payout destination**: a merchant can request a payout to either a bank
account or a mobile money wallet, whichever they register as their payout
destination. *assumed*

## Out of Scope

- Customer accounts, login, or cross-merchant payment history for
customers.
- A platform-level admin/operations actor (dispute handling, merchant
oversight, fraud review).
- Merchant staff accounts / multi-user access per merchant business.
- Document-based KYC / business verification.
- Currency conversion or cross-border settlement.
- Chargebacks, refunds, and dispute resolution workflows.
- Recurring/subscription payments — only one-off payment requests.

## Open Questions

*(none — outstanding decisions are recorded as assumed Product Decisions above)*