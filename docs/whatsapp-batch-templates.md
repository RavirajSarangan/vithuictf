# WhatsApp templates — batch notifications

Batch calendar features send WhatsApp messages through the **Meta WhatsApp Cloud API** using pre-approved templates. Portal-only messages (class cancel, class-start reminder) do not use WhatsApp.

## 1. Meta setup (one-time)

1. Open [Meta Business Suite](https://business.facebook.com/) → **WhatsApp Manager** → your business number.
2. Go to **Account tools** → **Phone numbers** → copy **Phone number ID**.
3. In [Meta for Developers](https://developers.facebook.com/) → your app → **WhatsApp** → **API Setup** → generate a permanent **Access token** with `whatsapp_business_messaging`.
4. Add your personal number under **API Setup → To** (required while the app is in development / before production approval).

## 2. Create templates in Meta

WhatsApp Manager → **Message templates** → **Create template**.

Use category **Utility** (or **Marketing** for broadcasts if your use case requires it). Language: **English**.

### `ictf_batch_announcement`

Used for: manual batch messages, institute-wide student broadcast, absent notices.

**Body:**

```
Hello from ICTF.

*{{1}}*
{{2}}

— ICT Foundation
```

| Variable | Filled with |
|----------|-------------|
| `{{1}}` | Message title |
| `{{2}}` | Message body |

### `ictf_batch_last_class`

Used for: automated notification on the **last class day** of a batch (cron job).

**Body:**

```
Hello {{1}}, today is your final class for *{{2}}*.

Date: {{3}}
Time: {{4}}
Zoom: {{5}}

— ICT Foundation
```

| Variable | Filled with |
|----------|-------------|
| `{{1}}` | Student display name |
| `{{2}}` | Batch name |
| `{{3}}` | Class date (YYYY-MM-DD) |
| `{{4}}` | Start time (HH:MM) |
| `{{5}}` | Zoom link or `N/A` |

Submit both templates and wait for **Approved** status before production sends.

## 3. Environment variables

Add to `.env.local` and Vercel (Production + Preview):

```bash
WHATSAPP_ACCESS_TOKEN=EAAxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789012345

# Must match exact template names in Meta (defaults shown)
WHATSAPP_ANNOUNCEMENT_TEMPLATE=ictf_batch_announcement
WHATSAPP_LAST_CLASS_TEMPLATE=ictf_batch_last_class

# Optional — shared with student welcome flow
# WHATSAPP_API_VERSION=v21.0
# WHATSAPP_WELCOME_TEMPLATE=ictf_student_welcome
```

Legacy aliases still work: `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_LAST_CLASS_TEMPLATE_NAME`.

Cron (portal reminders + last-class WhatsApp):

```bash
CRON_SECRET=<long random string>
```

## 4. Test locally

```bash
# Announcement template
npm run whatsapp:test -- --phone 94771234567 --template announcement

# Last-class template
npm run whatsapp:test -- --phone 94771234567 --template last-class

# Health check (all env + DB)
npm run healthcheck
```

Replace `94771234567` with your number (must be registered as a test recipient in Meta while in dev mode).

## 5. Test batch flow in the app

### Create a batch

1. Sign in as **admin** or **teacher**.
2. Go to **Academics → Batches** → **Add batch** (wizard).
3. Pick course, dates, class days (Mon/Wed etc.), time, optional Zoom link.
4. Confirm **total class days** auto-calculates.
5. Optionally enroll students in the last step → **Create batch**.

### Enroll & message

1. Open the batch detail page.
2. **Enroll students** — search by student ID, select, enroll.
3. **Message batch** — portal only, WhatsApp only, or both.
4. Check **WhatsApp delivery log** at the bottom (admin).

### Student view

1. Sign in as an enrolled **student**.
2. **Dashboard** → today’s classes (from real batch schedule).
3. **Calendar** → weekly batch schedule with cancelled sessions greyed out.

### Cancel a class

1. On batch detail or **Academics → Calendar**, open a session → **Cancel**.
2. Enter a reason → students receive a **portal notification** (not WhatsApp).

### Last-class automation

The cron route `/api/cron/batch-notifications` (every 15 min on Vercel):

- **Class start** (~15 min before): portal only
- **Last class day**: portal + WhatsApp (`ictf_batch_last_class`)
- **Day before last class**: portal only

Test cron locally:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/batch-notifications
```

## 6. Student opt-out

Each student has `notify_whatsapp` (default `true`). When `false`, WhatsApp is skipped and logged as `skipped` in `batch_whatsapp_log`.

## 7. Troubleshooting

| Symptom | Fix |
|---------|-----|
| `WhatsApp API not configured` | Set `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID` |
| `(#132000) Number of parameters…` | Template body variables don't match Meta template — recreate template per section 2 |
| `(#131030) Recipient phone number not in allowed list` | Add number in Meta API Setup (dev) or complete business verification (prod) |
| `skipped` in log, "No valid phone" | Student `phone` must be valid Sri Lanka mobile (`07…` or `94…`) |
| Cron returns 401 | `CRON_SECRET` must match `Authorization: Bearer …` header |
