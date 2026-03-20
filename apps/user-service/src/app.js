const fastifyFactory = require('fastify');
const underPressure = require('@fastify/under-pressure');
const client = require('prom-client');

const { createPool } = require('./db');

function buildApp() {
  const fastify = fastifyFactory({
    logger: true
  });

  const pool = createPool();

  const register = new client.Registry();

  client.collectDefaultMetrics({
    register
  });

  const requestCounter = new client.Counter({
    name: 'helix_user_service_requests_total',
    help: 'Total number of requests handled by the user service',
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

  fastify.get('/health', async () => {
    return { status: 'ok', service: 'user-service' };
  });

  fastify.get('/ready', async () => {
    return { status: 'ready', service: 'user-service' };
  });

  fastify.get('/metrics', async (_request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });

  // Close DB connections on shutdown.
  fastify.addHook('onClose', async () => {
    await pool.end();
  });

  fastify.get('/', async (request) => {
    requestCounter.inc({ method: request.method, route: '/', status_code: '200' });
    return {
      message: 'Helix User Service is running',
      service: 'user-service',
      version: process.env.APP_VERSION || '0.1.0'
    };
  });

  fastify.post('/users', async (request, reply) => {
    const { name, email } = request.body || {};

    if (!name || !email) {
      reply.code(400);
      return { error: 'name and email are required' };
    }

    const result = await pool.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at',
      [name, email]
    );

    const row = result.rows[0];
    const user = {
      id: String(row.id),
      name: row.name,
      email: row.email,
      createdAt: new Date(row.created_at).toISOString(),
    };

    requestCounter.inc({ method: request.method, route: '/users', status_code: '201' });
    reply.code(201);
    return user;
  });

  fastify.get('/users/:id', async (request, reply) => {
    const { id } = request.params;

    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [id]
    );
    const row = result.rows[0];

    if (!row) {
      requestCounter.inc({ method: request.method, route: '/users/:id', status_code: '404' });
      reply.code(404);
      return { error: 'user not found' };
    }

    requestCounter.inc({ method: request.method, route: '/users/:id', status_code: '200' });
    return {
      id: String(row.id),
      name: row.name,
      email: row.email,
      createdAt: new Date(row.created_at).toISOString(),
    };
  });

  return fastify;
}

module.exports = { buildApp };
