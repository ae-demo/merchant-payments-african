// spec: tests/validation/test-plan.md § AC-004-a
import { test, expect } from "@playwright/test";
import { signInAsMerchant } from "../lib/auth";

test("AC-004-a: opening a payment link does not require the customer to sign in or create an account", async ({
  page,
  browser,
}) => {
  const username = process.env.AEP_E2E_USERNAME!;
  const password = process.env.AEP_E2E_PASSWORD!;
  const amount = 1000 + (Date.now() % 1_000_000);

  // 1. Merchant creates a payment request and reads the exact displayed
  // "Shareable link" text.
  await signInAsMerchant(page, username, password);
  await page.goto("/payment-requests/new");
  await page.getByRole("spinbutton", { name: "Amount" }).fill(String(amount));
  await page.getByRole("button", { name: "Create" }).click();
  await page.waitForURL(/\/payment-requests\/(?!new$)[^/]+$/);

  const linkText = await page.getByText("Shareable link: ").textContent();
  const sharedPath = linkText!.replace("Shareable link: ", "").trim();
  const shareableUrl = new URL(sharedPath, page.url()).toString();

  // 2. A guest, with no session at all, opens that exact link.
  const guestContext = await browser.newContext();
  const guestPage = await guestContext.newPage();
  try {
    await guestPage.goto(shareableUrl);
    // The criterion's claim: opening the link reaches the payment screen
    // without any sign-in prompt. See tests/validation/test-plan.md's defect
    // writeup for why this fails live — merchant-api's paymentLinkUrl points
    // at a path the webapp does not treat as public, so a guest is bounced
    // to the Thunder sign-in gate instead.
    await expect(guestPage.getByRole("heading", { name: /^Pay / })).toBeVisible();
  } finally {
    await guestContext.close();
  }
});
