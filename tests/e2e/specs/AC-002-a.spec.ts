// spec: tests/validation/test-plan.md § AC-002-a
import { test, expect } from "@playwright/test";
import { target } from "../lib/targets";

test("AC-002-a: an unauthenticated user cannot access the merchant dashboard or its data", async ({
  page,
  request,
}) => {
  // 1. A fresh, unauthenticated browser context tries the dashboard.
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
  expect(new URL(page.url()).hostname).toContain("idp");

  // 2. The API itself rejects an unauthenticated caller too.
  const res = await request.get(`${target("merchant-api")}/me/merchant`);
  expect(res.status()).toBe(401);
});
