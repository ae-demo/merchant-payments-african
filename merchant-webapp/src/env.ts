// Typed read of window._env_, populated at request time by the platform's
// /env-config.js (react-webapp). Declares only the keys this app actually has:
// the merchant-auth OIDC config. There is no browser key for the merchant-api
// sibling — it is reached at same-origin /api (react-webapp, Same-origin API
// proxy) — and no MERCHANT_AUTH_JWKS_URL: the browser never validates a token,
// the API gateway does, so no asset here reads it.
export type Env = {
  MERCHANT_AUTH_CLIENT_ID: string;
  MERCHANT_AUTH_ISSUER: string;
  MERCHANT_AUTH_SCOPES: string;
  MERCHANT_AUTH_RESOURCE: string;
};

declare global {
  interface Window {
    _env_: Env;
  }
}

if (!window._env_) {
  throw new Error(
    "window._env_ not set — /env-config.js failed to load. " +
      "The platform mounts this file; if you see this locally, host " +
      "/env-config.js from your dev server.",
  );
}

export const env: Env = window._env_;
