# DEVTEST community board

Apply migration `0005_community.sql` to the existing `route127-dev` D1 database before deploying the DEVTEST API Worker. Keep the existing DEVTEST API route and cookie configuration. Community routes are restricted to the DEVTEST path and authenticated characters. The PLAYTEST gateway requires no changes.

Set `COMMUNITY_ADMIN_ACCOUNTS` on the Worker to the comma-separated account IDs authorized to publish as Last Lantern Workshop or Luna and moderate the board. Use authenticated account IDs from the existing account system.

## Workshop feedback delivery

1. Confirm that the studio receives mail at `support@lastlanternworkshop.com` and that this destination is verified for Worker sending, or enable Cloudflare Email Sending for the studio domain so the Worker can address the support alias.
2. Authorize `route127@lastlanternworkshop.com` on the studio's sending domain. Add the following binding to the existing DEVTEST Worker configuration and redeploy.

   ```json
   "send_email": [
     {"name":"WORKSHOP_EMAIL","destination_address":"support@lastlanternworkshop.com"}
   ]
   ```

3. Sign in with a DEVTEST character, open the Solace Bulletin Board, and submit a labeled test from Workshop Feedback. Confirm the report arrives in the studio inbox and check its diagnostics and plain-text body. Until this succeeds, live delivery is unverified. Without the binding the board reports that Workshop email is temporarily unavailable and keeps the entered draft.

Cloudflare reference: https://developers.cloudflare.com/email-service/configuration/send-bindings/
