// spec: tests/validation/test-plan.md § AC-004-b
import { test, expect } from "@playwright/test";
import { signInAsMerchant } from "../lib/auth";

test("AC-004-b: a customer can complete payment of a payment request using mobile money", async ({
  page,
  browser,
}) => {
  const username = process.env.AEP_E2E_USERNAME!;
  const password = process.env.AEP_E2E_PASSWORD!;
  const amount = 1000 + (Date.now() % 1_000_000);

  // 1. Merchant creates a payment request and captures its id.
  await signInAsMerchant(page, username, password);
  await page.goto("/payment-requests/new");
  await page.getByRole("spinbutton", { name: "Amount" }).fill(String(amount));
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/payment-requests\/(?!new$)[^/]+$/);
  const paymentRequestId = page.url().split("/payment-requests/")[1];

  // 2. A guest, with no session, pays it via the webapp's public route.
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  try {
    await guestPage.goto(`/pay/${paymentRequestId}`);
    await guestPage.getByRole("textbox", { name: "Mobile money number" }).fill("+254711000000");
    await guestPage.getByRole("button", { name: "Pay now" }).click();
    await guestPage.waitForURL(`/pay/${paymentRequestId}/confirmation`);
    await expect(guestPage.getByText("Payment successful")).toBeVisible();
  } finally {
    await guestContext.close();
  }
});
