# twilio-contact-center-lab

Local **Node.js + Twilio** lab. Just Express webhooks, TwiML IVR, and a simple agent screen-pop UI.

## What this demonstrates

| Pattern | Implementation |
|---------|----------------|
| Inbound voice webhook | `POST /voice/incoming` |
| DTMF IVR menu | `<Gather>` → `POST /voice/menu` |
| Screen pop / agent desktop | `GET /api/lastcall` + `public/index.html` |
| Mock CRM lookup | `lib/crm.js` (caller ID → customer record) |
| Call status logging | `POST /voice/status` |
| Webhook security (optional) | `TWILIO_VALIDATE_WEBHOOKS=true` |

## Architecture

```
Caller → Twilio PSTN number
           ↓ POST /voice/incoming (ngrok → localhost:3000)
         Node.js Express
           ↓ TwiML (Say, Gather, Hangup)
         Caller hears IVR
           ↓
         Agent browser polls /api/lastcall (screen pop)
```

## Quick start

```bash
npm install
cp .env.example .env
npm start
```

See **[TWILIO_GUIDE.md](./TWILIO_GUIDE.md)** for Twilio Console + ngrok setup.

## Local development URLs

| Service | URL | Notes |
|---------|-----|-------|
| Agent desktop | http://localhost:3000 | Screen pop UI |
| Health check | http://localhost:3000/health | Confirms server + `BASE_URL` |
| ngrok inspector | http://127.0.0.1:4040 | Live request log — debug Twilio POSTs here |
| Public webhook | `$BASE_URL/voice/incoming` | From `.env`; changes every ngrok restart |

### Running locally

1. Terminal 1: `npm start`
2. Terminal 2: `ngrok http 3000`
3. Update `.env` `BASE_URL` and Twilio Console if ngrok URL changed
4. Open agent UI and ngrok inspector before test calls

## Routes

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/voice/incoming` | Twilio "A call comes in" webhook |
| POST | `/voice/menu` | DTMF handler after `<Gather>` |
| POST | `/voice/status` | Optional status callback |
| GET | `/api/lastcall` | Latest call for agent UI |
| POST | `/api/screenpop` | Manual screen-pop inject (testing) |
| GET | `/health` | Health check |

## Mock CRM numbers

These caller IDs return known customers in `lib/crm.js`:

- `+15551234567` → Jane Doe (Gold)
- `+15557654321` → John Smith (Standard)

Use them in `curl` tests or verify your own number after editing the lookup table.

Personal interview study notes live in `STUDY_GUIDE.md` (local only, gitignored).

## License

MIT
