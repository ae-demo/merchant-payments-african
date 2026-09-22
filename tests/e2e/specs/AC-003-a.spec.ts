// spec: tests/validation/test-plan.md § AC-003-a
import { test, expect } from "@playwright/test";
import { signInAsMerchant } from "../lib/auth";

test("AC-003-a: a signed-in merchant can create a payment request by specifying a sale amount", async ({ page }) => {
  const username = process.env.AEP_E2E_USERNAME!;
  const password = process.env.AEP_E2E_PASSWORD!;
  const amount = 1000 + (Date.now() % 1_000_000);

  await signInAsMerchant(page, username, password);
  await page.goto("/payment-requests/new");
  await page.getByRole("spinbutton", { name: "Amount" }).fill(String(amount));
  await page.getByRole("button", { name: "Create" }).click();

  // Excludes "new" itself: the create-form URL already matches a bare
  // /payment-requests/<segment>$ pattern before the click navigates away.
  await page.waitForURL(/\/payment-requests\/(?!new$)[^/]+$/);
  await expect(page.getByRole("heading", { name: amount.toLocaleString() })).toBeVisible();
});
