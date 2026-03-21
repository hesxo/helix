const fastifyFactory = require('fastify');
const underPressure = require('@fastify/under-pressure');
const replyFrom = require('@fastify/reply-from');
const cors = require('@fastify/cors');
const client = require('prom-client');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service';
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL || 'http://order-service';

function buildApp() {
  const fastify = fastifyFactory({
    logger: true
  });

  const register = new client.Registry();

  client.collectDefaultMetrics({
    register
  });

  const requestCounter = new client.Counter({
    name: 'helix_api_gateway_requests_total',
    help: 'Total number of requests handled by the API gateway',
    labelNames: ['method', 'route', 'status_code'],
    registers: [register],
  });

  const httpRequestDuration = new client.Histogram({
    name: 'helix_api_gateway_request_duration_seconds',
    help: 'HTTP request duration in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
    registers: [register],
  });

  fastify.addHook('onRequest', async (request) => {
    request._helixDurationEnd = httpRequestDuration.startTimer();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const end = request._helixDurationEnd;
    if (typeof end !== 'function') {
      return;
    }
    const route =
      request.routeOptions?.url ??
      (request.url ? request.url.split('?')[0] : null) ??
      'unknown';
    end({
      method: request.method,
      route,
      status_code: String(reply.statusCode),
    });
  });

  fastify.register(underPressure, {
    exposeStatusRoute: {
      routeResponseSchemaOpts: {
        version: false
      }
    }
  });

  fastify.register(replyFrom);

  // Enable CORS so the Vite frontend (different port) can call the gateway directly.
  // Keep this permissive for demo purposes.
  fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  fastify.post('/api/users', async (request, reply) => {
    requestCounter.inc({ method: 'POST', route: '/api/users', status_code: '201' });
    return reply.from(`${USER_SERVICE_URL}/users`, {
      body: request.body,
    });
  });

  fastify.get('/api/users/:id', async (request, reply) => {
    const { id } = request.params;
    requestCounter.inc({ method: 'GET', route: '/api/users/:id', status_code: '200' });
    return reply.from(`${USER_SERVICE_URL}/users/${id}`);
  });

  fastify.post('/api/orders', async (request, reply) => {
    requestCounter.inc({ method: 'POST', route: '/api/orders', status_code: '201' });
    return reply.from(`${ORDER_SERVICE_URL}/orders`, {
      body: request.body,
    });
  });

  fastify.get('/api/orders/:id', async (request, reply) => {
    const { id } = request.params;
    requestCounter.inc({ method: 'GET', route: '/api/orders/:id', status_code: '200' });
    return reply.from(`${ORDER_SERVICE_URL}/orders/${id}`);
  });

  fastify.get('/api/orders/user/:userId', async (request, reply) => {
    const { userId } = request.params;
    requestCounter.inc({ method: 'GET', route: '/api/orders/user/:userId', status_code: '200' });
    return reply.from(`${ORDER_SERVICE_URL}/orders/user/${userId}`);
  });

  fastify.get('/health', async () => {
    return { status: 'ok', service: 'api-gateway' };
  });

  fastify.get('/ready', async () => {
    return { status: 'ready', service: 'api-gateway' };
  });

  fastify.get('/metrics', async (_request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });

  fastify.get('/', async (request) => {
    requestCounter.inc({
      method: request.method,
      route: '/',
      status_code: '200'
    });

    return {
      message: 'Helix API Gateway is running',
      service: 'api-gateway',
      version: process.env.APP_VERSION || '0.1.0'
    };
  });

  fastify.setNotFoundHandler((request, reply) => {
    requestCounter.inc({
      method: request.method,
      route: 'not_found',
      status_code: '404',
    });

    request.log.warn(
      {
        method: request.method,
        url: request.url,
        statusCode: 404,
      },
      'route not found'
    );

    return reply.code(404).send({
      message: `Route ${request.method}:${request.url} not found`,
      error: 'Not Found',
      statusCode: 404,
    });
  });

  return fastify;
}

module.exports = { buildApp };
