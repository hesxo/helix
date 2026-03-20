const fastifyFactory = require('fastify');
const underPressure = require('@fastify/under-pressure');
const client = require('prom-client');

const users = new Map();
let nextId = 1;

function buildApp() {
  const fastify = fastifyFactory({
    logger: true
  });

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

    const id = String(nextId++);
    const user = { id, name, email, createdAt: new Date().toISOString() };
    users.set(id, user);

    requestCounter.inc({ method: request.method, route: '/users', status_code: '201' });
    reply.code(201);
    return user;
  });

  fastify.get('/users/:id', async (request, reply) => {
    const { id } = request.params;
    const user = users.get(id);

    if (!user) {
      requestCounter.inc({ method: request.method, route: '/users/:id', status_code: '404' });
      reply.code(404);
      return { error: 'user not found' };
    }

    requestCounter.inc({ method: request.method, route: '/users/:id', status_code: '200' });
    return user;
  });

  return fastify;
}

module.exports = { buildApp };
