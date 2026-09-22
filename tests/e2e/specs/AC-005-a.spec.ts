// spec: tests/validation/test-plan.md § AC-005-a
import { test, expect } from "@playwright/test";
import { signInAsMerchant } from "../lib/auth";

test("AC-005-a: a customer can complete payment of a payment request using a debit/credit card", async ({
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

  // 2. A guest, with no session, pays it by card via the webapp's public route.
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  try {
    await guestPage.goto(`/pay/${paymentRequestId}`);
    await guestPage.getByRole("combobox", { name: /Payment method/ }).click();
    await guestPage.getByRole("option", { name: "Card" }).click();
    await guestPage.getByRole("textbox", { name: "Card number" }).fill("4111111111111111");
    await guestPage.getByRole("textbox", { name: "Expiry" }).fill("12/29");
    await guestPage.getByRole("textbox", { name: "CVV" }).fill("123");
    await guestPage.getByRole("button", { name: "Pay now" }).click();
    await guestPage.waitForURL(`/pay/${paymentRequestId}/confirmation`);
    await expect(guestPage.getByText("Payment successful")).toBeVisible();
  } finally {
    await guestContext.close();
  }
});
