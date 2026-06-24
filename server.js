require('dotenv').config();

const express = require('express');
const twilio = require('twilio');
const { VoiceResponse } = twilio.twiml;
const { setLastCall, getLastCall } = require('./lib/callStore');
const { lookupCustomer, queueForDigit } = require('./lib/crm');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
const VALIDATE_WEBHOOKS = process.env.TWILIO_VALIDATE_WEBHOOKS === 'true';

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static('public'));

const voiceWebhook = VALIDATE_WEBHOOKS
  ? twilio.webhook({ validate: true })
  : (_req, _res, next) => next();

function buildCallRecord(req, extra = {}) {
  const from = req.body.From || '';
  const customer = lookupCustomer(from);

  return {
    receivedAt: new Date().toISOString(),
    caller: from,
    did: req.body.To || '',
    callSid: req.body.CallSid || '',
    callStatus: req.body.CallStatus || 'ringing',
    customerName: customer.name,
    accountId: customer.accountId,
    tier: customer.tier,
    ...extra,
  };
}

function sendTwiml(res, response) {
  res.type('text/xml');
  res.send(response.toString());
}

// Inbound call entry — configure this URL on your Twilio number ("A CALL COMES IN").
app.post('/voice/incoming', voiceWebhook, (req, res) => {
  const record = buildCallRecord(req, { stage: 'ivr' });
  setLastCall(record);
  console.log('voice/incoming:', record);

  const response = new VoiceResponse();
  response.say({ voice: 'Polly.Joanna' }, 'Welcome to the contact center lab.');
  const gather = response.gather({
    numDigits: 1,
    action: '/voice/menu',
    method: 'POST',
    timeout: 5,
  });
  gather.say('Press 1 for sales, or 2 for support.');
  response.say('We did not receive your selection.');
  response.redirect('/voice/incoming');

  sendTwiml(res, response);
});

// DTMF menu handler — Twilio POSTs here after the caller presses a key.
app.post('/voice/menu', voiceWebhook, (req, res) => {
  const digit = req.body.Digits || '';
  const queue = queueForDigit(digit);
  const record = buildCallRecord(req, {
    stage: 'routed',
    menuSelection: digit,
    queue: queue ? queue.id : 'unknown',
    queueLabel: queue ? queue.label : 'Unknown',
  });
  setLastCall(record);
  console.log('voice/menu:', record);

  const response = new VoiceResponse();

  if (!queue) {
    response.say('Invalid selection. Please try again.');
    response.redirect('/voice/incoming');
    return sendTwiml(res, response);
  }

  response.say(
    `You selected ${queue.label}. An agent would be connected here in a full deployment.`
  );
  response.say('Thank you for calling. Goodbye.');
  response.hangup();

  sendTwiml(res, response);
});

// Optional status callback — set StatusCallback on your Twilio number or in TwiML.
app.post('/voice/status', voiceWebhook, (req, res) => {
  console.log('voice/status:', {
    callSid: req.body.CallSid,
    status: req.body.CallStatus,
    from: req.body.From,
    to: req.body.To,
  });
  res.sendStatus(204);
});

// Agent desktop API
app.get('/api/lastcall', (_req, res) => {
  res.json(getLastCall());
});

app.post('/api/screenpop', (req, res) => {
  const record = { receivedAt: new Date().toISOString(), ...req.body };
  setLastCall(record);
  console.log('api/screenpop:', record);
  res.json({ status: 'ok' });
});

// Health check for local verification
app.get('/health', (_req, res) => {
  res.json({ ok: true, baseUrl: BASE_URL });
});

app.listen(PORT, () => {
  console.log(`Twilio contact center lab listening on http://localhost:${PORT}`);
  console.log(`Agent UI: http://localhost:${PORT}/`);
  console.log(`Voice webhook: ${BASE_URL}/voice/incoming`);
  if (!VALIDATE_WEBHOOKS) {
    console.log('Webhook signature validation is OFF (set TWILIO_VALIDATE_WEBHOOKS=true to enable)');
  }
});
