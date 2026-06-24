let lastCall = null;

function setLastCall(data) {
  lastCall = data;
}

function getLastCall() {
  return lastCall || {};
}

function clearLastCall() {
  lastCall = null;
}

module.exports = { setLastCall, getLastCall, clearLastCall };
