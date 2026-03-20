const fastifyFactory = require('fastify');
const underPressure = require('@fastify/under-pressure');
const client = require('prom-client');
const pool = require('./db');

function buildApp() {
  const fastify = fastifyFactory({
    logger: true
  });

  const register = new client.Registry();

  client.collectDefaultMetrics({
    register
  });

  const requestCounter = new client.Counter({
    name: 'helix_order_service_requests_total',
    help: 'Total number of requests handled by the order service',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
  });

  fastify.register(underPressure, {
    exposeStatusRoute: {
      routeResponseSchemaOpts: {
        version: false
      }
    }
  });

  fastify.addHook('onReady', async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        item TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        total NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
  });

  fastify.addHook('onClose', async () => {
    await pool.end();
  });

  fastify.get('/health', async () => {
    return { status: 'ok', service: 'order-service' };
  });

  fastify.get('/ready', async () => {
    return { status: 'ready', service: 'order-service' };
  });

  fastify.get('/metrics', async (_request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });

  fastify.get('/', async (request) => {
    requestCounter.inc({ method: request.method, route: '/', status_code: '200' });
    return {
      message: 'Helix Order Service is running',
      service: 'order-service',
      version: process.env.APP_VERSION || '0.1.0'
    };
  });

  fastify.post('/orders', async (request, reply) => {
    const { userId, item, quantity, total } = request.body || {};

    if (!userId || !item || !quantity || total === undefined) {
      reply.code(400);
      return { error: 'Missing fields' };
    }

    const result = await pool.query(
      `
      INSERT INTO orders (user_id, item, quantity, total)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [userId, item, quantity, total]
    );

    const row = result.rows[0];

    requestCounter.inc({ method: request.method, route: '/orders', status_code: '201' });
    reply.code(201);
    return {
      id: String(row.id),
      userId: String(row.user_id),
      item: row.item,
      quantity: row.quantity,
      total: Number(row.total),
      createdAt: new Date(row.created_at).toISOString(),
    };
  });

  fastify.get('/orders/:id', async (request, reply) => {
    const { id } = request.params;

    const result = await pool.query(
      'SELECT * FROM orders WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      requestCounter.inc({ method: request.method, route: '/orders/:id', status_code: '404' });
      reply.code(404);
      return { error: 'Order not found' };
    }

    const row = result.rows[0];

    requestCounter.inc({ method: request.method, route: '/orders/:id', status_code: '200' });
    return {
      id: String(row.id),
      userId: String(row.user_id),
      item: row.item,
      quantity: row.quantity,
      total: Number(row.total),
      createdAt: new Date(row.created_at).toISOString(),
    };
  });

  fastify.get('/orders/user/:userId', async (request) => {
    const { userId } = request.params;

    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY id ASC',
      [userId]
    );

    requestCounter.inc({ method: request.method, route: '/orders/user/:userId', status_code: '200' });
    return result.rows.map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      item: row.item,
      quantity: row.quantity,
      total: Number(row.total),
      createdAt: new Date(row.created_at).toISOString(),
    }));
  });

  return fastify;
}

module.exports = { buildApp };
