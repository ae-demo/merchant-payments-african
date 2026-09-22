// spec: tests/validation/test-plan.md § AC-008-a
import { test, expect } from "@playwright/test";
import { signInAsMerchant } from "../lib/auth";

test("AC-008-a: a signed-in merchant can view a list of their transactions", async ({ page, browser }) => {
  const username = process.env.AEP_E2E_USERNAME!;
  const password = process.env.AEP_E2E_PASSWORD!;
  const amount = 1000 + (Date.now() % 1_000_000);

  // 1. Merchant creates and a guest pays a payment request, to guarantee a transaction exists.
  await signInAsMerchant(page, username, password);
  await page.goto("/payment-requests/new");
  await page.getByRole("spinbutton", { name: "Amount" }).fill(String(amount));
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/payment-requests\/(?!new$)[^/]+$/);
  const paymentRequestId = page.url().split("/payment-requests/")[1];

  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  try {
    await guestPage.goto(`/pay/${paymentRequestId}`);
    await guestPage.getByRole("textbox", { name: "Mobile money number" }).fill("+254711000000");
    await guestPage.getByRole("button", { name: "Pay now" }).click();
    await guestPage.waitForURL(`/pay/${paymentRequestId}/confirmation`);
  } finally {
    await guestContext.close();
  }

  // 2. Merchant views the transactions list.
  await page.goto("/transactions");
  // Data rows have "cell" children; the header row's are "columnheader", so
  // this excludes it without relying on a raw CSS/tag selector.
  const rows = page.getByRole("row").filter({ has: page.getByRole("cell") });
  await expect(rows.first()).toBeVisible();
  await expect(page.getByText("No transactions yet")).not.toBeVisible();
});
