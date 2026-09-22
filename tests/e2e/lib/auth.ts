import { Page } from "@playwright/test";

// Signs in through the live Thunder gate at "/" — never a stored session,
// since a refresh narrows a token's scopes but never widens them (a stale
// storageState would silently judge the app on the wrong grant).
export async function signInAsMerchant(page: Page, username: string, password: string): Promise<void> {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Username" }).fill(username);
  await page.getByRole("textbox", { name: "Password" }).fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  // The callback bounces through "/" before the app's own router settles on
  // /dashboard or /onboarding — wait for one of those rather than just
  // leaving the IdP host, or a caller's next navigation races the redirect.
  await page.waitForURL((url) => /\/(dashboard|onboarding)/.test(url.pathname), { timeout: 15_000 });

  // /onboarding is reachable to any signed-in caller regardless of scope
  // (merchant-webapp/src/authz/screens.ts). An account with no merchant
  // profile yet lands here straight from sign-in; complete it with
  // throwaway defaults so callers can assume an onboarded merchant.
  if (page.url().includes("/onboarding")) {
    const suffix = Date.now();
    await page.getByRole("textbox", { name: "Business name" }).fill(`Auto Merchant ${suffix}`);
    await page.getByRole("textbox", { name: "Email" }).fill(`auto-${suffix}@example.com`);
    await page.getByRole("textbox", { name: "Phone number" }).fill("+254700000000");
    await page.getByRole("combobox", { name: "Country" }).click();
    await page.getByRole("option", { name: "Kenya" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.waitForURL((url) => !url.pathname.includes("/onboarding"), { timeout: 15_000 });
  }
}
