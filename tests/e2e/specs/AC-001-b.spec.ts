// spec: tests/validation/test-plan.md § AC-001-b
import { test, expect } from "@playwright/test";
import { signInAsMerchant } from "../lib/auth";

test("AC-001-b: a registered merchant's currency is derived from their registered country", async ({ page }) => {
  const username = process.env.AEP_E2E_USERNAME_2!;
  const password = process.env.AEP_E2E_PASSWORD_2!;
  const suffix = Date.now();

  // 1. Sign in, then go to the onboarding form directly.
  await signInAsMerchant(page, username, password);
  await page.goto("/onboarding");

  // 2. Fill the form, selecting Uganda as the country.
  await page.getByRole("textbox", { name: "Business name" }).fill(`Bee Store ${suffix}`);
  await page.getByRole("textbox", { name: "Email" }).fill(`bee-${suffix}@example.com`);
  await page.getByRole("textbox", { name: "Phone number" }).fill("+256700111222");
  await page.getByRole("combobox", { name: "Country" }).click();
  await page.getByRole("option", { name: "Uganda" }).click();

  // 3. Submit and capture the registration response.
  const [response] = await Promise.all([
    page.waitForResponse((res) => res.url().endsWith("/api/me/merchant") && res.request().method() === "POST"),
    page.getByRole("button", { name: "Continue" }).click(),
  ]);

  expect(response.status()).toBe(201);
  const body = await response.json();
  // Uganda -> UGX: the currency is derived from country, not submitted directly.
  expect(body).toMatchObject({ country: "UG", currency: "UGX" });
});
