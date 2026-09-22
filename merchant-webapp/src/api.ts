// The merchant-api client: openapi-fetch, typed against src/generated/, at the
// same-origin /api this pod's nginx proxies to the sibling (react-webapp,
// Same-origin API proxy). No authorization rule of its own — the bearer and
// the 401 rule both come from src/authz/client.ts (thunder-authentication §4).
import createClient from "openapi-fetch";
import type { Middleware } from "openapi-fetch";
import type { paths } from "./generated/merchant-api";
import { authorizationHeader, classifyResponse, ForbiddenError } from "./authz/client";

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    const header = await authorizationHeader();
    if (header) request.headers.set("Authorization", header);
    return request;
  },
  async onResponse({ response }) {
    if ((await classifyResponse(response.status)) === "forbidden") {
      throw new ForbiddenError(response.status);
    }
    return response;
  },
};

export const merchantApi = createClient<paths>({ baseUrl: "/api" });
merchantApi.use(authMiddleware);
