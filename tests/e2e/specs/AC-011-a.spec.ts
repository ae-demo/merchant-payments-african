// spec: tests/validation/test-plan.md § AC-011-a
import { test, expect } from "@playwright/test";
import { signInAsMerchant } from "../lib/auth";

test("AC-011-a: a signed-in merchant can view a list of their payout requests with their status", async ({
  page,
  browser,
}) => {
  const username = process.env.AEP_E2E_USERNAME!;
  const password = process.env.AEP_E2E_PASSWORD!;
  const payoutAmount = 1_000_000 + (Date.now() % 500_000);
  const fundAmount = payoutAmount + 500_000;

  // 1. Fund the merchant's balance via a guest payment.
  await signInAsMerchant(page, username, password);
  await page.goto("/payment-requests/new");
  await page.getByRole("spinbutton", { name: "Amount" }).fill(String(fundAmount));
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

  // 2. Request a payout, then view the payouts list.
  await page.goto("/payouts/new");
  await page.getByRole("spinbutton", { name: "Amount" }).fill(String(payoutAmount));
  await page.getByRole("textbox", { name: /Destination details/ }).fill(`Bank acct ${Date.now()}`);
  await page.getByRole("button", { name: "Submit" }).click();
  await page.waitForURL("/payouts");

  // Data rows have "cell" children; the header row's are "columnheader", so
  // this excludes it without relying on a raw CSS/tag selector.
  const rows = page.getByRole("row").filter({ has: page.getByRole("cell") });
  await expect(rows.first()).toBeVisible();
  await expect(page.getByText("No payouts requested yet")).not.toBeVisible();
  // Matching the amount CELL exactly (see AC-010-a) avoids both the row's
  // whitespace-free text concatenation and false substring matches.
  const row = page.getByRole("row").filter({
    has: page.getByRole("cell", { name: `${payoutAmount.toLocaleString()} KES`, exact: true }),
  });
  await expect(row.getByText(/^(Pending|Processing|Completed|Failed)$/)).toBeVisible();
});
