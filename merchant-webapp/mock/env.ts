// window._env_ for mock mode — exactly the keys the platform emits for this
// app's merchant-auth dependency (react-webapp SKILL.md's key table). No
// MERCHANT_AUTH_JWKS_URL: the browser never validates a token.
export const mockEnv = {
  MERCHANT_AUTH_CLIENT_ID: "mock-client",
  MERCHANT_AUTH_ISSUER: "https://mock-idp.test",
  MERCHANT_AUTH_SCOPES:
    "openid profile email group ou payment-requests:create payment-requests:read transactions:read payouts:request payouts:read",
  MERCHANT_AUTH_RESOURCE: "https://mock-idp.test/resources/merchant-payments",
};
