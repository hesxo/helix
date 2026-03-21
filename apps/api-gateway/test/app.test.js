const test = require('node:test');
const assert = require('node:assert/strict');
const { buildApp } = require('../src/app');

test('GET / returns gateway status payload', async () => {
  const app = buildApp();

  const response = await app.inject({
    method: 'GET',
    url: '/',
  });

  assert.equal(response.statusCode, 200);

  const body = response.json();
  assert.equal(body.service, 'api-gateway');
  assert.ok(body.version);

  await app.close();
});

test('GET /health returns ok', async () => {
  const app = buildApp();

  const response = await app.inject({
    method: 'GET',
    url: '/health',
  });

  assert.equal(response.statusCode, 200);

  const body = response.json();
  assert.equal(body.status, 'ok');

  await app.close();
});

test('unknown route returns 404 with Not Found payload', async () => {
  const app = buildApp();

  const response = await app.inject({
    method: 'GET',
    url: '/api/does-not-exist',
  });

  assert.equal(response.statusCode, 404);

  const body = response.json();
  assert.equal(body.error, 'Not Found');
  assert.equal(body.statusCode, 404);
  assert.match(body.message, /GET:\/api\/does-not-exist/);

  await app.close();
});
