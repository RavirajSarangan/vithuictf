# Resend DNS for ictf.lk (LankaHost)

DNS for `ictf.lk` is managed at **LankaHost** (`dns70.lankahost.net`).

## Step-by-step (LankaHost Client Area)

1. Log in at [client.lankahost.lk](https://client.lankahost.lk) (or **Client Area** on lankahost.lk).
2. Go to **Domains** → **DNS Management** (or open `ictf.lk` → **Manage DNS**).
3. Add **three new records** (do not edit the existing `@` SPF record):

| Type | Host / Name | Value | Priority |
|------|-------------|-------|----------|
| TXT | `resend._domainkey` | `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDVvRb2Bd8X1axTyeY7tTcT263WYSR138lgpiaAtylEb7cGtnF5Iq3YDH0zfXyOg2KcmmzCU7N2PcaMPqWzBO72H4+SgrE9k4C+TVNALHrbBsaunkRdK5/e8r2rvH4qu/3CfHwq4JBKNNPbVV2rn6N7bxc3hWDqnwiz3w17fEgrUwIDAQAB` | — |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | — |
| MX | `send` | `feedback-smtp.ap-northeast-1.amazonses.com` | 10 |

4. **Host field:** enter only `send` or `resend._domainkey` — not `send.ictf.lk` (LankaHost adds the domain).
5. Save each record. Wait 5–30 minutes.
6. Verify from the project root:

```bash
npm run email:verify-domain          # should show OK for all 3 records
npm run email:verify-domain:trigger  # tells Resend to re-check
```

Re-fetch live values anytime with `npm run email:verify-domain -- --full`.

## LankaHost tips

- **Host/Name** = `send` or `resend._domainkey` (not `send.ictf.lk` — the panel adds the domain).
- Leave TTL at default.
- Keep the existing root `@` SPF (`v=spf1 +a +mx +ip4:...`) — Resend uses the `send` subdomain only.
- After saving, wait 5–60 minutes for propagation.

## Verify

```bash
npx tsx scripts/verify-resend-domain.ts          # check DNS
npx tsx scripts/verify-resend-domain.ts --verify # trigger Resend verification
npx tsx scripts/verify-resend-domain.ts --test your@email.com
```

Resend dashboard status should become **Verified**. Then welcome emails and contact form mail will work.
