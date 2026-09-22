// spec: tests/validation/test-plan.md § AC-009-a
import { test, expect } from "@playwright/test";
import { signInAsMerchant } from "../lib/auth";

test("AC-009-a: a signed-in merchant can view their current available balance", async ({ page }) => {
  const username = process.env.AEP_E2E_USERNAME!;
  const password = process.env.AEP_E2E_PASSWORD!;

  await signInAsMerchant(page, username, password);
  await page.goto("/dashboard");

  // Dashboard.tsx renders the balance's currency as the only bare
  // 3-letter-uppercase text on the page (Pending/This month use word
  // labels, not currency codes), so a page-level check is unambiguous.
  await expect(page.getByText("Available balance")).toBeVisible();
  await expect(page.getByText(/^[A-Z]{3}$/)).toBeVisible();
});
