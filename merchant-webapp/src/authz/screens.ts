/**
 * THIS IS THE ONLY FILE THAT KNOWS ABOUT SCREENS. Adapted from
 * thunder-authentication's screens.example.ts pattern for merchant-webapp's
 * own screens (wireframes.dsl).
 *
 * Dashboard is listed FIRST among the signed-in screens so it is the landing
 * screen: `App.tsx`'s SignedIn() picks `reachable.find(s => !s.public &&
 * s.loads !== null)`. MerchantOnboarding is reachable by any signed-in caller
 * (its load operation is `signedIn`, not scope-gated) but is never chosen as
 * the landing screen because it sorts after Dashboard here — Dashboard itself
 * decides, at runtime, whether to redirect a not-yet-onboarded caller to
 * /onboarding (see src/pages/Dashboard.tsx), because that decision depends on
 * whether GET /me/merchant 404s, not on scope.
 */

import { canCall } from "./core";
import { OPERATIONS, isOperationKey, type OperationKey } from "./operations.gen";

export interface ScreenRoute {
  readonly key: string;
  readonly label: string;
  readonly path: string;
  readonly loads: OperationKey | null;
  readonly public?: boolean;
}

export const SCREEN_ROUTES: readonly ScreenRoute[] = [
  { key: "dashboard", label: "Dashboard", path: "/dashboard", loads: "GET /me/transactions" },
  {
    key: "payment-requests",
    label: "Payment requests",
    path: "/payment-requests",
    loads: "GET /me/payment-requests",
  },
  { key: "transactions", label: "Transactions", path: "/transactions", loads: "GET /me/transactions" },
  { key: "payouts", label: "Payouts", path: "/payouts", loads: "GET /me/payouts" },
  {
    key: "create-payment-request",
    label: "New payment request",
    path: "/payment-requests/new",
    loads: "POST /me/payment-requests",
  },
  {
    key: "payment-request-detail",
    label: "Payment request",
    path: "/payment-requests/:paymentRequestId",
    loads: "GET /me/payment-requests/{paymentRequestId}",
  },
  {
    key: "request-payout",
    label: "Request a payout",
    path: "/payouts/new",
    loads: "POST /me/payouts",
  },
  {
    key: "merchant-onboarding",
    label: "Register your business",
    path: "/onboarding",
    loads: "POST /me/merchant",
  },
  // Public — F2 "Guest checkout", a flow with no `role` line. Routed ABOVE the
  // sign-in guard; reachable by a customer with no session at all.
  {
    key: "payment-page",
    label: "Pay",
    path: "/pay/:paymentRequestId",
    loads: "GET /payment-links/{paymentRequestId}",
    public: true,
  },
  {
    key: "payment-confirmation",
    label: "Payment confirmation",
    path: "/pay/:paymentRequestId/confirmation",
    loads: null,
    public: true,
  },
];

for (const screen of SCREEN_ROUTES) {
  if (screen.loads !== null && !isOperationKey(screen.loads)) {
    throw new Error(
      `src/authz/screens.ts: screen "${screen.label}" loads "${screen.loads}", which ` +
        `no contract declares. Re-run \`npm run gen\`, or name the operation the ` +
        `way openapi.yaml spells it.`,
    );
  }
}

export function reachableScreens(
  scopes: ReadonlySet<string>,
  signedIn: boolean,
): readonly ScreenRoute[] {
  return SCREEN_ROUTES.filter((screen) => {
    if (screen.public) return true;
    if (screen.loads === null) return signedIn;
    return canCall(OPERATIONS[screen.loads], scopes, signedIn);
  });
}

export function hasScopedReach(scopes: ReadonlySet<string>, signedIn: boolean): boolean {
  return reachableScreens(scopes, signedIn).some((screen) => !screen.public && screen.loads !== null);
}
