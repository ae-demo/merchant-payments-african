// The chrome for F2's public screens (PaymentPage, PaymentConfirmation):
// wireframes.dsl draws `navbar "Merchant Payments"` with no `sidebar` on
// either — a guest checkout page has no signed-in navigation to offer, so
// this is the brand-only Header, not the full AppShell (that shell is for the
// signed-in merchant's screens, src/shell/AppShell.tsx).
import type { JSX } from "react";
import { Box, ColorSchemeToggle, Header } from "@wso2/oxygen-ui";
import { APP_NAME } from "../appName";

export function PublicHeader(): JSX.Element {
  return (
    <Header minimal>
      <Header.Brand>
        <Header.BrandTitle>{APP_NAME}</Header.BrandTitle>
      </Header.Brand>
      <Header.Spacer />
      <Header.Actions>
        <ColorSchemeToggle />
      </Header.Actions>
    </Header>
  );
}

export function PublicPageFrame({ children }: { children: JSX.Element }): JSX.Element {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <PublicHeader />
      <Box sx={{ display: "flex", justifyContent: "center", p: { xs: 2, sm: 4 } }}>{children}</Box>
    </Box>
  );
}
