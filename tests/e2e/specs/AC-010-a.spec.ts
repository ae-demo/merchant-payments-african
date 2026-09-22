// spec: tests/validation/test-plan.md § AC-010-a
import { test, expect } from "@playwright/test";
import { signInAsMerchant } from "../lib/auth";

test("AC-010-a: a signed-in merchant can submit a payout request specifying an amount and a destination", async ({
  page,
  browser,
}) => {
  const username = process.env.AEP_E2E_USERNAME!;
  const password = process.env.AEP_E2E_PASSWORD!;
  const payoutAmount = 1_000_000 + (Date.now() % 500_000);
  const fundAmount = payoutAmount + 500_000;

  // 1. Fund the merchant's balance via a guest payment, to guarantee enough
  // available balance for the payout.
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

  // 2. Request a payout with an amount and a bank destination.
  await page.goto("/payouts/new");
  await page.getByRole("spinbutton", { name: "Amount" }).fill(String(payoutAmount));
  const destinationDetails = `Bank acct ${Date.now()}`;
  await page.getByRole("textbox", { name: /Destination details/ }).fill(destinationDetails);
  await page.getByRole("button", { name: "Submit" }).click();

  await page.waitForURL("/payouts");
  // Row textContent concatenates every cell with no separating whitespace
  // (the date cell butts straight against the amount cell), so any
  // substring/boundary match on the row's full text is unreliable — it can
  // both straddle two adjacent digits and false-positive against a longer
  // amount ("410 KES" is a literal substring of "1,410 KES"). Matching the
  // amount CELL exactly and filtering rows by that avoids both problems.
  const row = page.getByRole("row").filter({
    has: page.getByRole("cell", { name: `${payoutAmount.toLocaleString()} KES`, exact: true }),
  });
  await expect(row).toBeVisible();
  await expect(row.getByText(/^(Pending|Processing|Completed|Failed)$/)).toBeVisible();
});
