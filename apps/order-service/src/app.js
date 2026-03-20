const fastifyFactory = require('fastify');
const underPressure = require('@fastify/under-pressure');
const client = require('prom-client');

const orders = new Map();
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
    const { userId, items } = request.body || {};

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      reply.code(400);
      return { error: 'userId and a non-empty items array are required' };
    }

    const id = String(nextId++);
    const total = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    const order = {
      id,
      userId,
      items,
      total,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    orders.set(id, order);

    requestCounter.inc({ method: request.method, route: '/orders', status_code: '201' });
    reply.code(201);
    return order;
  });

  fastify.get('/orders/:id', async (request, reply) => {
    const { id } = request.params;
    const order = orders.get(id);

    if (!order) {
      requestCounter.inc({ method: request.method, route: '/orders/:id', status_code: '404' });
      reply.code(404);
      return { error: 'order not found' };
    }

    requestCounter.inc({ method: request.method, route: '/orders/:id', status_code: '200' });
    return order;
  });

  fastify.get('/orders/user/:userId', async (request) => {
    const { userId } = request.params;
    const userOrders = [];

    for (const order of orders.values()) {
      if (order.userId === userId) {
        userOrders.push(order);
      }
    }

    requestCounter.inc({ method: request.method, route: '/orders/user/:userId', status_code: '200' });
    return userOrders;
  });

  return fastify;
}

module.exports = { buildApp };
