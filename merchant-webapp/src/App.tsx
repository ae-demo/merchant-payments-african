// ROUTING STRUCTURE prescribed by thunder-authentication's App.example.tsx:
//   - NoAccess sits ABOVE the shell route and REPLACES it.
//   - Forbidden sits INSIDE the shell, at /forbidden.
//   - /forbidden is wired into authz/client once, from the router.
//   - Every gated route is wrapped in <RequireOperation>, from SCREEN_ROUTES.
//   - A `public` screen (F2 "Guest checkout" — no `role` line in the DSL) is
//     routed ABOVE the sign-in guard: PaymentPage and PaymentConfirmation, so
//     a customer with no session reaches them.
//   - /callback is routed OUTSIDE the provider.
import { useEffect, type ReactElement } from "react";
import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Box, Typography } from "@wso2/oxygen-ui";
import {
  AuthzProvider,
  Forbidden,
  NoAccess,
  RequireOperation,
  useAuthz,
  useScopes,
} from "./authz/gates";
import { SCREEN_ROUTES, reachableScreens, hasScopedReach } from "./authz/screens";
import { setForbiddenNavigator } from "./authz/client";
import { signIn } from "./authz/session";
import { APP_NAME } from "./appName";
import { AppShell } from "./shell/AppShell";
import { CallbackPage } from "./pages/Callback";
import { DashboardPage } from "./pages/Dashboard";
import { CreatePaymentRequestPage } from "./pages/CreatePaymentRequest";
import { PaymentRequestDetailPage } from "./pages/PaymentRequestDetail";
import { PaymentRequestsPage } from "./pages/PaymentRequests";
import { TransactionsPage } from "./pages/Transactions";
import { PayoutsPage } from "./pages/Payouts";
import { RequestPayoutPage } from "./pages/RequestPayout";
import { MerchantOnboardingPage } from "./pages/MerchantOnboarding";
import { PaymentPage } from "./pages/PaymentPage";
import { PaymentConfirmationPage } from "./pages/PaymentConfirmation";

/** YOUR pages, keyed by the screen keys src/authz/screens.ts declares. */
const PAGE_BY_KEY: Record<string, ReactElement> = {
  dashboard: <DashboardPage />,
  "payment-requests": <PaymentRequestsPage />,
  transactions: <TransactionsPage />,
  payouts: <PayoutsPage />,
  "create-payment-request": <CreatePaymentRequestPage />,
  "payment-request-detail": <PaymentRequestDetailPage />,
  "request-payout": <RequestPayoutPage />,
  "merchant-onboarding": <MerchantOnboardingPage />,
  "payment-page": <PaymentPage />,
  "payment-confirmation": <PaymentConfirmationPage />,
};

/** The screens reachable before sign-in — F2, routed above the guard, below. */
const PUBLIC_SCREENS = SCREEN_ROUTES.filter((screen) => screen.public);

export function App(): ReactElement {
  return (
    <>
      <ForbiddenWiring />
      <Routes>
        <Route path="/callback" element={<CallbackPage />} />
        {PUBLIC_SCREENS.map((screen) => (
          <Route
            key={screen.key}
            path={screen.path}
            element={
              <AuthzProvider fallback={<Splash />}>{PAGE_BY_KEY[screen.key]}</AuthzProvider>
            }
          />
        ))}
        <Route
          path="*"
          element={
            <AuthzProvider fallback={<Splash />}>
              <SignedIn />
            </AuthzProvider>
          }
        />
      </Routes>
    </>
  );
}

/**
 * Hands src/authz/client.ts the route a refusal goes to, once, from inside
 * the router and above every route.
 */
function ForbiddenWiring(): null {
  const navigate = useNavigate();
  useEffect(() => {
    setForbiddenNavigator(() => navigate("/forbidden", { replace: true }));
  }, [navigate]);
  return null;
}

function Splash(): ReactElement {
  return (
    <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
      <Typography variant="body1" color="text.secondary">
        Checking your session…
      </Typography>
    </Box>
  );
}

function SignedIn(): ReactElement {
  const { signedIn } = useAuthz();
  const scopes = useScopes();

  // The load-time guard. Only a MISSING session starts a sign-in.
  useEffect(() => {
    if (!signedIn) void signIn();
  }, [signedIn]);

  if (!signedIn) return <Splash />;

  const reachable = reachableScreens(scopes, signedIn);

  if (!hasScopedReach(scopes, signedIn)) return <NoAccess appName={APP_NAME} />;

  const landing = (reachable.find((s) => !s.public && s.loads !== null) ?? reachable[0]).path;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to={landing} replace />} />
        {SCREEN_ROUTES.map((screen) => {
          if (screen.public) return null;
          const page = PAGE_BY_KEY[screen.key];
          if (screen.loads === null) {
            return <Route key={screen.key} path={screen.path} element={page} />;
          }
          return (
            <Route
              key={screen.key}
              element={<RequireOperation op={screen.loads} screen={screen.label} />}
            >
              <Route path={screen.path} element={page} />
            </Route>
          );
        })}
        <Route path="/forbidden" element={<Forbidden />} />
        <Route path="*" element={<Navigate to={landing} replace />} />
      </Route>
    </Routes>
  );
}
