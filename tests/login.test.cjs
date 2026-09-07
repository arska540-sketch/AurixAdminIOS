const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { friendly } = require('../AurixAdmin/Web/auth-support.js');
const html = fs.readFileSync(path.join(__dirname, '../AurixAdmin/Web/index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];

async function boot({ importError, loginError, accountError } = {}) {
  const nodes = new Map();
  const element = id => {
    if (!nodes.has(id)) {
      const classes = new Set();
      nodes.set(id, { value: '', textContent: '', disabled: true, hidden: true,
        style: {}, dataset: {}, addEventListener() {}, reportValidity: () => true,
        classList: { add: c => classes.add(c), remove: c => classes.delete(c),
          contains: c => classes.has(c), toggle: c => classes.has(c) ? classes.delete(c) : classes.add(c) }
      });
    }
    return nodes.get(id);
  };
  let observer, signedOut = false, request;
  const sdk = {
    initializeApp: () => ({}), getAuth: () => ({}), getDatabase: () => ({}),
    onAuthStateChanged: (_, callback) => { observer = callback; },
    signInWithEmailAndPassword: async (_, email, password) => {
      request = {email, password};
      if (loginError) throw loginError;
      return { user: {uid:'test-user'} };
    },
    ref: (_, p) => p, update: async () => {},
    get: async () => { if (accountError) throw accountError; return {val: () => null}; },
    signOut: async () => { signedOut = true; await observer(null); }
  };
  const sandbox = {document: { getElementById: element, querySelectorAll: () => [], addEventListener() {}, body: element('body') },
    AurixAuthSupport: {friendly}, setTimeout: () => 1, clearTimeout() {},
    localStorage: {getItem: () => null}, location: {reload() {}},
    sdkImport: async () => { if (importError) throw importError; return sdk; }
  };
  sandbox.window = sandbox;
  const context = vm.createContext(sandbox);
  for (const [, attrs, code] of scripts) {
    if (!code.trim()) continue;
    if (attrs.includes('type="module"')) {
      await vm.runInContext('(async()=>{' + code.replace(/\bimport\(/g, 'sdkImport(') + '})()', context);
    } else vm.runInContext(code, context);
  }
  return {element, observer, signedOut: () => signedOut, request: () => request};
}

test('malformed JSON, HTML, empty and unknown errors never reveal raw data', () => {
  for (const error of [new SyntaxError('<html>private-token</html>'),
    {code:'auth/internal-error', message:'private-token', customData:{response:'private-token'}},
    new Error('private-token'), {code:'private-token'}, null, {}]) {
    assert.ok(friendly(error).length > 20);
    assert.ok(!friendly(error).includes('private-token'));
  }
  assert.match(friendly(new SyntaxError()), /unreadable data/);
});

test('network, rate limit, credentials and database failures have useful messages', () => {
  for (const [code, expected] of [['auth/network-request-failed', /connection/],
    ['auth/too-many-requests', /Wait/], ['auth/invalid-credential', /Wrong username/],
    ['PERMISSION_DENIED', /access was denied/]]) assert.match(friendly({code}), expected);
});

test('CDN startup failure leaves login disabled and exposes retry', async () => {
  const app = await boot({importError: new TypeError('Failed to fetch')});
  assert.equal(app.element('loginBtn').disabled, true);
  assert.equal(app.element('retryStartup').hidden, false);
  assert.match(app.element('loginStatus').textContent, /could not load/);
});

test('SDK login failures are caught, readable, and allow another attempt', async () => {
  for (const error of [new SyntaxError('HTML private-token'), {code:'auth/internal-error'},
    {code:'auth/network-request-failed'}, {code:'auth/invalid-credential'}]) {
    const app = await boot({loginError:error});
    assert.equal(app.element('loginBtn').disabled, false);
    app.element('loginUsername').value = 'Test.User';
    app.element('loginPassword').value = 'fixture-password';
    await app.element('loginForm').onsubmit({preventDefault() {}});
    assert.deepEqual(app.request(), {email:'test.user@aurix.local', password:'fixture-password'});
    assert.equal(app.element('loginStatus').textContent, friendly(error));
    assert.equal(app.element('loginBtn').disabled, false);
  }
});

test('account-read failure signs out and keeps a useful error on the login screen', async () => {
  const app = await boot({accountError:{code:'PERMISSION_DENIED'}});
  await app.observer({uid:'test-user', email:'test@aurix.local'});
  assert.equal(app.signedOut(), true);
  assert.match(app.element('loginStatus').textContent, /Could not load account.*access was denied/);
  assert.equal(app.element('app').classList.contains('open'), false);
});
