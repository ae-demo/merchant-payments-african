// The merchant-api mock, from specs/design/components/merchant-api/openapi.yaml.
// State lives in module scope, so it resets on every full page load (a
// reload, a typed URL, a link that leaves the SPA) and only persists across
// in-app navigation — react-webapp's references/mock-mode.md.
//
// No merchant profile is seeded: `mockMerchant` starts `null`, so
// GET /me/merchant 404s until POST /me/merchant creates one — the walk for
// F1's own first screen, MerchantOnboarding, which src/pages/Dashboard.tsx's
// redirect exists to reach.
//
// Write NO scope check here — mock/authz/gateway.ts is the gateway layer, read
// from the contract. This file owns only each path's REACH: a /me/… handler
// answers a single caller's own rows (there is exactly one merchant per mock
// session, so "the caller's" is simply "the seeded state"), and a row that is
// not the caller's would be a 404 — no such case exists in this contract,
// since there is no every-row operation to widen against.
import { http, HttpResponse } from "msw";
import type { components } from "../src/generated/merchant-api";

type Merchant = components["schemas"]["Merchant"];
type PaymentRequest = components["schemas"]["PaymentRequest"];
type Transaction = components["schemas"]["Transaction"];
type Payout = components["schemas"]["Payout"];

let nextId = 100;
const newId = (prefix: string): string => `${prefix}-${(nextId++).toString(36)}`;

let mockMerchant: Merchant | null = null;

let paymentRequests: PaymentRequest[] = [
  {
    id: "abc123",
    amount: 2500,
    currency: "KES",
    description: "Grocery order",
    status: "pending",
    paymentLinkUrl: "https://pay.example/abc123",
    createdAt: "2026-09-20T09:00:00Z",
    expiresAt: null,
  },
  {
    id: "xyz789",
    amount: 9000,
    currency: "KES",
    description: "Consulting invoice",
    status: "paid",
    paymentLinkUrl: "https://pay.example/xyz789",
    createdAt: "2026-09-18T09:00:00Z",
    expiresAt: null,
  },
  {
    id: "old456",
    amount: 1500,
    currency: "KES",
    description: "Expired quote",
    status: "expired",
    paymentLinkUrl: "https://pay.example/old456",
    createdAt: "2026-08-30T09:00:00Z",
    expiresAt: "2026-09-06T09:00:00Z",
  },
];

let transactions: Transaction[] = [
  {
    id: "txn-1",
    paymentRequestId: "xyz789",
    amount: 9000,
    currency: "KES",
    method: "card",
    status: "successful",
    gatewayReference: "TXN-77190",
    createdAt: "2026-09-19T14:00:00Z",
  },
  {
    id: "txn-2",
    paymentRequestId: "old456",
    amount: 1200,
    currency: "KES",
    method: "mobile_money",
    status: "failed",
    gatewayReference: null,
    createdAt: "2026-09-17T11:00:00Z",
  },
];

let payouts: Payout[] = [
  {
    id: "payout-1",
    amount: 50000,
    currency: "KES",
    destinationType: "bank",
    destinationDetails: "0011223344551234",
    status: "completed",
    requestedAt: "2026-09-15T08:00:00Z",
    completedAt: "2026-09-16T08:00:00Z",
  },
  {
    id: "payout-2",
    amount: 20000,
    currency: "KES",
    destinationType: "mobile_wallet",
    destinationDetails: "254712349876",
    status: "processing",
    requestedAt: "2026-09-10T08:00:00Z",
    completedAt: null,
  },
];

function paginate<T>(items: T[], limit: number, offset: number) {
  const data = items.slice(offset, offset + limit);
  return {
    count: items.length,
    next: offset + limit < items.length ? `?limit=${limit}&offset=${offset + limit}` : null,
    previous: offset > 0 ? `?limit=${limit}&offset=${Math.max(0, offset - limit)}` : null,
    data,
  };
}

function queryInt(url: URL, name: string, fallback: number): number {
  const raw = url.searchParams.get(name);
  const parsed = raw === null ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const handlers = [
  http.get("/api/me/merchant", () => {
    if (!mockMerchant) {
      return HttpResponse.json(
        { code: 404, message: "Not registered", description: "No merchant profile for this caller yet." },
        { status: 404 },
      );
    }
    return HttpResponse.json(mockMerchant);
  }),

  http.post("/api/me/merchant", async ({ request }) => {
    const input = (await request.json()) as { businessName?: string; email?: string; phone?: string; country?: string };
    if (!input.businessName || !input.email || !input.phone || !input.country) {
      return HttpResponse.json({ code: 400, message: "Invalid input" }, { status: 400 });
    }
    const CURRENCY_BY_COUNTRY: Record<string, string> = {
      KE: "KES",
      UG: "UGX",
      TZ: "TZS",
      NG: "NGN",
      GH: "GHS",
      ZA: "ZAR",
    };
    mockMerchant = {
      id: newId("merchant"),
      businessName: input.businessName,
      email: input.email,
      phone: input.phone,
      country: input.country,
      currency: CURRENCY_BY_COUNTRY[input.country] ?? "KES",
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json(mockMerchant, { status: 201 });
  }),

  http.get("/api/me/payment-requests", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const filtered = status ? paymentRequests.filter((p) => p.status === status) : paymentRequests;
    return HttpResponse.json(paginate(filtered, queryInt(url, "limit", 20), queryInt(url, "offset", 0)));
  }),

  http.post("/api/me/payment-requests", async ({ request }) => {
    const input = (await request.json()) as { amount?: number; description?: string };
    if (typeof input.amount !== "number" || input.amount <= 0) {
      return HttpResponse.json({ code: 400, message: "Invalid input" }, { status: 400 });
    }
    const id = newId("pr");
    const currency = mockMerchant?.currency ?? "KES";
    const created: PaymentRequest = {
      id,
      amount: input.amount,
      currency,
      description: input.description,
      status: "pending",
      paymentLinkUrl: `https://pay.example/${id}`,
      createdAt: new Date().toISOString(),
      expiresAt: null,
    };
    paymentRequests = [created, ...paymentRequests];
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get("/api/me/payment-requests/:paymentRequestId", ({ params }) => {
    const found = paymentRequests.find((p) => p.id === params.paymentRequestId);
    if (!found) {
      return HttpResponse.json({ code: 404, message: "Not found" }, { status: 404 });
    }
    return HttpResponse.json(found);
  }),

  http.get("/api/me/transactions", ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const filtered = status ? transactions.filter((t) => t.status === status) : transactions;
    const sorted = [...filtered].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    return HttpResponse.json(paginate(sorted, queryInt(url, "limit", 20), queryInt(url, "offset", 0)));
  }),

  http.get("/api/me/balance", () => {
    // Fixed to match the wireframe's stat card exactly (128,400 KES); real
    // settlement math is merchant-api's, not this mock's, to reproduce.
    return HttpResponse.json({ available: 128400, currency: mockMerchant?.currency ?? "KES" });
  }),

  http.get("/api/me/payouts", ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json(paginate(payouts, queryInt(url, "limit", 20), queryInt(url, "offset", 0)));
  }),

  http.post("/api/me/payouts", async ({ request }) => {
    const input = (await request.json()) as {
      amount?: number;
      destinationType?: "bank" | "mobile_wallet";
      destinationDetails?: string;
    };
    if (!input.amount || input.amount <= 0 || !input.destinationType || !input.destinationDetails) {
      return HttpResponse.json({ code: 400, message: "Invalid input or insufficient balance" }, { status: 400 });
    }
    const created: Payout = {
      id: newId("payout"),
      amount: input.amount,
      currency: mockMerchant?.currency ?? "KES",
      destinationType: input.destinationType,
      destinationDetails: input.destinationDetails,
      status: "pending",
      requestedAt: new Date().toISOString(),
      completedAt: null,
    };
    payouts = [created, ...payouts];
    return HttpResponse.json(created, { status: 201 });
  }),

  // Public — no auth. The gateway layer (mock/authz/gateway.ts) never sees
  // these: the contract declares `security: []`.
  http.get("/api/payment-links/:paymentRequestId", ({ params }) => {
    const found = paymentRequests.find((p) => p.id === params.paymentRequestId);
    if (!found) {
      return HttpResponse.json({ code: 404, message: "Not found or expired" }, { status: 404 });
    }
    return HttpResponse.json({
      paymentRequestId: found.id,
      businessName: mockMerchant?.businessName ?? "Acme Store",
      amount: found.amount,
      currency: found.currency,
      status: found.status,
    });
  }),

  http.post("/api/payment-links/:paymentRequestId/pay", async ({ params, request }) => {
    const found = paymentRequests.find((p) => p.id === params.paymentRequestId);
    if (!found) {
      return HttpResponse.json({ code: 404, message: "Not found or expired" }, { status: 404 });
    }
    const input = (await request.json()) as {
      method?: "mobile_money" | "card";
      mobileMoneyNumber?: string;
      cardNumber?: string;
    };
    if (!input.method) {
      return HttpResponse.json({ code: 400, message: "Invalid payment details" }, { status: 400 });
    }
    if (input.method === "mobile_money" && !input.mobileMoneyNumber) {
      return HttpResponse.json({ code: 400, message: "Invalid payment details" }, { status: 400 });
    }
    if (input.method === "card" && !input.cardNumber) {
      return HttpResponse.json({ code: 400, message: "Invalid payment details" }, { status: 400 });
    }
    // A card number ending in 0 walks the failure branch, so both outcomes in
    // customer-guest-checkout.md's sequence are reachable from the mock.
    const failed = input.method === "card" && input.cardNumber?.trim().endsWith("0");
    const transaction: Transaction = {
      id: newId("txn"),
      paymentRequestId: found.id,
      amount: found.amount,
      currency: found.currency,
      method: input.method,
      status: failed ? "failed" : "successful",
      gatewayReference: failed ? null : `TXN-${Math.floor(Math.random() * 90000 + 10000)}`,
      createdAt: new Date().toISOString(),
    };
    transactions = [transaction, ...transactions];
    if (!failed) {
      paymentRequests = paymentRequests.map((p) => (p.id === found.id ? { ...p, status: "paid" } : p));
    }
    return HttpResponse.json(transaction, { status: 200 });
  }),
];
