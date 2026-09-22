// spec: tests/validation/test-plan.md § AC-010-b
import { test, expect } from "@playwright/test";
import { signInAsMerchant } from "../lib/auth";

test("AC-010-b: a merchant can choose either a bank account or a mobile money wallet as the payout destination", async ({
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

  // 2. Request a payout, explicitly choosing "Mobile money wallet" as the destination type.
  await page.goto("/payouts/new");
  await page.getByRole("spinbutton", { name: "Amount" }).fill(String(payoutAmount));
  await page.getByRole("combobox", { name: /Destination type/ }).click();
  await page.getByRole("option", { name: "Mobile money wallet" }).click();
  const walletMarker = `M-Pesa${Date.now()}`;
  await page.getByRole("textbox", { name: /Destination details/ }).fill(walletMarker);
  await page.getByRole("button", { name: "Submit" }).click();

  await page.waitForURL("/payouts");
  // Matching the amount CELL exactly (see AC-010-a) avoids both the row's
  // whitespace-free text concatenation and false substring matches.
  const row = page.getByRole("row").filter({
    has: page.getByRole("cell", { name: `${payoutAmount.toLocaleString()} KES`, exact: true }),
  });
  await expect(row).toBeVisible();
  await expect(row.getByText(/M-Pesa/)).toBeVisible();
});
