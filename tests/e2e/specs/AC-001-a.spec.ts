// spec: tests/validation/test-plan.md § AC-001-a
import { test, expect } from "@playwright/test";
import { signInAsMerchant } from "../lib/auth";

test("AC-001-a: a new merchant can submit business name, email, phone and country to register", async ({ page }) => {
  const username = process.env.AEP_E2E_USERNAME!;
  const password = process.env.AEP_E2E_PASSWORD!;
  const suffix = Date.now();
  const businessName = `Ada Store ${suffix}`;
  const email = `ada-${suffix}@example.com`;
  const phone = "+254700111222";

  // 1. Sign in, then go to the onboarding form directly — reachable to any
  // signed-in caller regardless of whether a profile already exists.
  await signInAsMerchant(page, username, password);
  await page.goto("/onboarding");

  // 2. Fill business name, email, phone, country.
  await page.getByRole("textbox", { name: "Business name" }).fill(businessName);
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Phone number" }).fill(phone);
  await page.getByRole("combobox", { name: "Country" }).click();
  await page.getByRole("option", { name: "Kenya" }).click();

  // 3. Submit and capture the registration response.
  const [response] = await Promise.all([
    page.waitForResponse((res) => res.url().endsWith("/api/me/merchant") && res.request().method() === "POST"),
    page.getByRole("button", { name: "Continue" }).click(),
  ]);

  expect(response.status()).toBe(201);
  const body = await response.json();
  expect(body).toMatchObject({
    businessName,
    email,
    phone,
    country: "KE",
  });
});
