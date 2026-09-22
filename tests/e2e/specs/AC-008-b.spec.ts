// spec: tests/validation/test-plan.md § AC-008-b
import { test, expect } from "@playwright/test";
import { signInAsMerchant } from "../lib/auth";

test("AC-008-b: each listed transaction shows its status as pending, successful, or failed", async ({
  page,
  browser,
}) => {
  const username = process.env.AEP_E2E_USERNAME!;
  const password = process.env.AEP_E2E_PASSWORD!;
  const amount = 1000 + (Date.now() % 1_000_000);

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

  await page.goto("/transactions");
  // Matching the amount CELL exactly avoids both a raw CSS row selector and
  // a false substring match against a longer amount in another row.
  const row = page.getByRole("row").filter({
    has: page.getByRole("cell", { name: `${amount.toLocaleString()} KES`, exact: true }),
  });
  await expect(row).toBeVisible();
  await expect(row.getByText(/^(Pending|Successful|Failed)$/)).toBeVisible();
});
