const test = require('node:test');
const assert = require('node:assert/strict');
const { buildApp } = require('../src/app');

test('GET / returns user-service status', async () => {
  const app = buildApp();

  const response = await app.inject({ method: 'GET', url: '/' });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.service, 'user-service');

  await app.close();
});

test('GET /health returns ok', async () => {
  const app = buildApp();

  const response = await app.inject({ method: 'GET', url: '/health' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().status, 'ok');

  await app.close();
});

test('POST /users creates a user', async () => {
  const app = buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/users',
    payload: { name: 'Alice', email: 'alice@example.com' },
  });

  assert.equal(response.statusCode, 201);
  const body = response.json();
  assert.equal(body.name, 'Alice');
  assert.equal(body.email, 'alice@example.com');
  assert.ok(body.id);

  await app.close();
});

test('GET /users/:id returns created user', async () => {
  const app = buildApp();

  const createRes = await app.inject({
    method: 'POST',
    url: '/users',
    payload: { name: 'Bob', email: 'bob@example.com' },
  });
  const created = createRes.json();

  const getRes = await app.inject({ method: 'GET', url: `/users/${created.id}` });

  assert.equal(getRes.statusCode, 200);
  assert.equal(getRes.json().name, 'Bob');

  await app.close();
});

test('GET /users/:id returns 404 for missing user', async () => {
  const app = buildApp();

  const response = await app.inject({ method: 'GET', url: '/users/999' });

  assert.equal(response.statusCode, 404);
  assert.equal(response.json().error, 'user not found');

  await app.close();
});

test('POST /users returns 400 without required fields', async () => {
  const app = buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/users',
    payload: { name: 'NoEmail' },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error, 'name and email are required');

  await app.close();
});
