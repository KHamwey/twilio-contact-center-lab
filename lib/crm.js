// Mock CRM lookup by caller ID — replace with a real REST API in production.
const CUSTOMERS = {
  '+15551234567': { name: 'Jane Doe', accountId: 'A-1001', tier: 'Gold' },
  '+15557654321': { name: 'John Smith', accountId: 'A-2042', tier: 'Standard' },
};

const QUEUES = {
  '1': { id: 'sales', label: 'Sales' },
  '2': { id: 'support', label: 'Support' },
  '3': { id: 'it', label: 'IT' },
  '4': { id: 'billing', label: 'Billing' }
};

function lookupCustomer(phone) {
  return (
    CUSTOMERS[phone] || {
      name: 'Unknown Caller',
      accountId: null,
      tier: 'Standard',
    }
  );
}

function queueForDigit(digit) {
  return QUEUES[digit] || null;
}

module.exports = { lookupCustomer, queueForDigit, QUEUES };
