// spec: tests/validation/test-plan.md § AC-002-b
import { test, expect } from "@playwright/test";
import { signInAsMerchant } from "../lib/auth";

test("AC-002-b: a signed-in merchant sees only their own account data, not another merchant's", async ({
  page,
  browser,
}) => {
  const username1 = process.env.AEP_E2E_USERNAME!;
  const password1 = process.env.AEP_E2E_PASSWORD!;
  const username2 = process.env.AEP_E2E_USERNAME_2!;
  const password2 = process.env.AEP_E2E_PASSWORD_2!;

  // 1. test-merchant creates a payment request and we capture its id.
  await signInAsMerchant(page, username1, password1);
  await page.goto("/payment-requests/new");
  await page.getByRole("spinbutton", { name: "Amount" }).fill(String(1000 + (Date.now() % 1000)));
  await page.getByRole("button", { name: "Create" }).click();
  // Excludes "new" itself: the create-form URL already matches a bare
  // /payment-requests/<segment>$ pattern before the click navigates away.
  await page.waitForURL(/\/payment-requests\/(?!new$)[^/]+$/);
  const paymentRequestId = page.url().split("/payment-requests/")[1];

  // 2. test-merchant-2, in a separate browser context, tries to view it.
  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  try {
    await signInAsMerchant(otherPage, username2, password2);
    await otherPage.goto(`/payment-requests/${paymentRequestId}`);
    await expect(otherPage.getByText("This payment request could not be found.")).toBeVisible();
  } finally {
    await otherContext.close();
  }
});
