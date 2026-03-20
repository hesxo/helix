const test = require('node:test');
const assert = require('node:assert/strict');
const { buildApp } = require('../src/app');

test('GET / returns order-service status', async () => {
  const app = buildApp();

  const response = await app.inject({ method: 'GET', url: '/' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().service, 'order-service');

  await app.close();
});

test('GET /health returns ok', async () => {
  const app = buildApp();

  const response = await app.inject({ method: 'GET', url: '/health' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().status, 'ok');

  await app.close();
});

test('POST /orders creates an order', async () => {
  const app = buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/orders',
    payload: {
      userId: '1',
      items: [{ name: 'Widget', price: 9.99, quantity: 2 }],
    },
  });

  assert.equal(response.statusCode, 201);
  const body = response.json();
  assert.equal(body.userId, '1');
  assert.equal(body.total, 19.98);
  assert.equal(body.status, 'pending');
  assert.ok(body.id);

  await app.close();
});

test('GET /orders/:id returns created order', async () => {
  const app = buildApp();

  const createRes = await app.inject({
    method: 'POST',
    url: '/orders',
    payload: {
      userId: '2',
      items: [{ name: 'Gadget', price: 25, quantity: 1 }],
    },
  });
  const created = createRes.json();

  const getRes = await app.inject({ method: 'GET', url: `/orders/${created.id}` });

  assert.equal(getRes.statusCode, 200);
  assert.equal(getRes.json().userId, '2');

  await app.close();
});

test('GET /orders/:id returns 404 for missing order', async () => {
  const app = buildApp();

  const response = await app.inject({ method: 'GET', url: '/orders/999' });

  assert.equal(response.statusCode, 404);
  assert.equal(response.json().error, 'order not found');

  await app.close();
});

test('GET /orders/user/:userId returns orders for user', async () => {
  const app = buildApp();

  await app.inject({
    method: 'POST',
    url: '/orders',
    payload: { userId: '5', items: [{ name: 'A', price: 10, quantity: 1 }] },
  });
  await app.inject({
    method: 'POST',
    url: '/orders',
    payload: { userId: '5', items: [{ name: 'B', price: 20, quantity: 1 }] },
  });
  await app.inject({
    method: 'POST',
    url: '/orders',
    payload: { userId: '6', items: [{ name: 'C', price: 5, quantity: 1 }] },
  });

  const response = await app.inject({ method: 'GET', url: '/orders/user/5' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().length, 2);

  await app.close();
});

test('POST /orders returns 400 without required fields', async () => {
  const app = buildApp();

  const response = await app.inject({
    method: 'POST',
    url: '/orders',
    payload: { userId: '1' },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error, 'userId and a non-empty items array are required');

  await app.close();
});
