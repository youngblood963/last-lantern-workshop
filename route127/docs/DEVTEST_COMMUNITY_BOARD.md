# DEVTEST community board

The community tables live in migration `0005_community.sql` on the existing `route127-dev` D1 database. Keep the existing DEVTEST API route and cookie configuration. Community routes require an authenticated character and use the DEVTEST path.

## Worker configuration

In the Cloudflare dashboard, set these values on `route127-r12-dev-api`:

- `COMMUNITY_ADMIN_ACCOUNTS` contains the comma-separated authenticated account IDs allowed to publish official announcements and moderate the board.
- `WORKSHOP_EMAIL_TO` contains one exact destination address already verified under Email Routing. Store it as an encrypted Worker secret or a server-side dashboard variable. Keep the address out of the repository and browser configuration.

The checked-in DEVTEST `backend/wrangler.jsonc` declares the `WORKSHOP_EMAIL` binding so Wrangler redeploys it. It also sets `keep_vars` to preserve dashboard variables. Worker secrets are preserved by Wrangler. Wrangler uses the checked-in binding definition on deploy, so any previous dashboard-only recipient restriction is replaced by this definition. The feedback handler accepts only the configured destination. Workers Free limits delivery to verified destinations.

## Verify Workshop delivery

Deploy the DEVTEST API Worker with `backend/wrangler.jsonc`. The Worker sends directly to the verified inbox using `route127@lastlanternworkshop.com` as the sender. Cloudflare must recognize the studio domain for that sender. The verified-destination path is available on Workers Free with Email Routing enabled.

Sign in with a DEVTEST character and send a labeled test from Solace’s Workshop Feedback form. Confirm receipt at the verified inbox and check its diagnostics and plain-text body. A missing binding or missing or invalid recipient produces a temporary-unavailability message. Cloudflare send errors leave the draft ready to retry.

[Cloudflare verified destinations](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/) · [Worker send bindings](https://developers.cloudflare.com/email-service/configuration/send-bindings/) · [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
