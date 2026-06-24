# Twilio setup guide (local + ngrok)

## Prerequisites

- Node.js 18+ (`node -v`)
- Twilio trial account: https://www.twilio.com/try-twilio
- ngrok for HTTPS tunneling: `brew install ngrok`

## 1. Install and run the app

```bash
cd ~/Projects/twilio-contact-center-lab
cp .env.example .env
npm install
npm start
```

Open the agent UI: http://localhost:3000

## 2. Expose localhost with ngrok

In a second terminal:

```bash
ngrok http 3000
```

Copy the **HTTPS** forwarding URL (e.g. `https://abc123.ngrok-free.app`).

Update `.env`:

```env
BASE_URL=https://abc123.ngrok-free.app
```

Restart the Node app after changing `.env`.

## 3. Get a Twilio phone number

1. Twilio Console → **Phone Numbers** → **Buy a number** (trial includes credit).
2. Choose a number with **Voice** capability.

## 4. Configure the voice webhook

1. Console → **Phone Numbers** → **Manage** → **Active numbers** → your number.
2. Under **Voice configuration** → **A call comes in**:
   - Webhook
   - URL: `https://<your-ngrok-host>/voice/incoming`
   - HTTP POST
3. (Optional) **Call status changes**: `https://<your-ngrok-host>/voice/status`
4. Save.

## 5. Test the flow

1. Call your Twilio number from your mobile.
2. Listen to the IVR: press **1** (sales) or **2** (support).
3. Open http://localhost:3000 (or the ngrok URL) — the agent desktop should show caller info and queue selection.

## 6. Test without a phone call

```bash
curl -X POST \
  -d 'From=+15551234567&To=+15557654321&CallSid=CAtest123' \
  http://localhost:3000/voice/incoming
```

Then simulate a menu choice:

```bash
curl -X POST \
  -d 'From=+15551234567&To=+15557654321&CallSid=CAtest123&Digits=1' \
  http://localhost:3000/voice/menu
```

Check the agent UI or:

```bash
curl http://localhost:3000/api/lastcall
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Twilio can't reach webhook | ngrok running? URL saved in Console with `/voice/incoming`? |
| 403 on webhook | Set `TWILIO_VALIDATE_WEBHOOKS=false` until `BASE_URL` matches ngrok exactly |
| No screen pop | Confirm `CallSid` in response; UI polls every 2s |
| ngrok URL changed | Free ngrok URLs change on restart — update Console + `.env` |
| Debug webhook payloads | Open ngrok inspector at http://127.0.0.1:4040 — shows every POST Twilio sends |

## Security (production)

- Set `TWILIO_VALIDATE_WEBHOOKS=true` and keep `BASE_URL` accurate.
- Never commit `.env` or Auth Token.
- Restrict who can hit your webhooks (Twilio signature validation).
