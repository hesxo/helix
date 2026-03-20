const test = require('node:test');
const assert = require('node:assert/strict');
const { buildApp } = require('../src/app');
const { createPool } = require('../src/db');

const testPool = createPool();

test.before(async () => {
  await testPool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      item TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      total NUMERIC NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
});

test.beforeEach(async () => {
  await testPool.query('TRUNCATE TABLE orders RESTART IDENTITY');
});

test.after(async () => {
  await testPool.end();
});

test('GET / returns order-service status', async () => {
  const app = buildApp();
  await app.ready();

  const response = await app.inject({ method: 'GET', url: '/' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().service, 'order-service');

  await app.close();
});

test('GET /health returns ok', async () => {
  const app = buildApp();
  await app.ready();

  const response = await app.inject({ method: 'GET', url: '/health' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().status, 'ok');

  await app.close();
});

test('POST /orders creates an order', async () => {
  const app = buildApp();
  await app.ready();

  const response = await app.inject({
    method: 'POST',
    url: '/orders',
    payload: {
      userId: '1',
      item: 'Widget',
      quantity: 2,
      total: 19.98,
    },
  });

  assert.equal(response.statusCode, 201);
  const body = response.json();
  assert.equal(body.userId, '1');
  assert.equal(body.total, 19.98);
  assert.equal(body.item, 'Widget');
  assert.equal(body.quantity, 2);
  assert.ok(body.id);

  await app.close();
});

test('GET /orders/:id returns created order', async () => {
  const app = buildApp();
  await app.ready();

  const createRes = await app.inject({
    method: 'POST',
    url: '/orders',
    payload: {
      userId: '2',
      item: 'Gadget',
      quantity: 1,
      total: 25,
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
  await app.ready();

  const response = await app.inject({ method: 'GET', url: '/orders/999' });

  assert.equal(response.statusCode, 404);
  assert.equal(response.json().error, 'Order not found');

  await app.close();
});

test('GET /orders/user/:userId returns orders for user', async () => {
  const app = buildApp();
  await app.ready();

  await app.inject({
    method: 'POST',
    url: '/orders',
    payload: { userId: '5', item: 'A', quantity: 1, total: 10 },
  });
  await app.inject({
    method: 'POST',
    url: '/orders',
    payload: { userId: '5', item: 'B', quantity: 1, total: 20 },
  });
  await app.inject({
    method: 'POST',
    url: '/orders',
    payload: { userId: '6', item: 'C', quantity: 1, total: 5 },
  });

  const response = await app.inject({ method: 'GET', url: '/orders/user/5' });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().length, 2);

  await app.close();
});

test('POST /orders returns 400 without required fields', async () => {
  const app = buildApp();
  await app.ready();

  const response = await app.inject({
    method: 'POST',
    url: '/orders',
    payload: { userId: '1' },
  });

  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error, 'Missing fields');

  await app.close();
});
