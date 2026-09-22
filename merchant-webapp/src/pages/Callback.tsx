import { useEffect, type JSX } from "react";
import { Box, Typography } from "@wso2/oxygen-ui";
import { handleCallback } from "../authz/session";

/**
 * The one registered redirect URI, serving both the redirect leg and the
 * silent-renew leg (thunder-authentication). Renders nothing meaningful — the
 * page either finishes a redirect (and the app takes over at "/") or resolves
 * an invisible iframe (and the parent window is the one that notices).
 */
export function CallbackPage(): JSX.Element {
  useEffect(() => {
    void handleCallback().then(() => {
      window.location.assign(window.location.origin);
    });
  }, []);

  return (
    <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
      <Typography variant="body1" color="text.secondary">
        Signing you in…
      </Typography>
    </Box>
  );
}
