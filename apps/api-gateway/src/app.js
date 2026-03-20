const fastifyFactory = require('fastify');
const underPressure = require('@fastify/under-pressure');
const httpProxy = require('@fastify/http-proxy');
const client = require('prom-client');

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://user-service';

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

  fastify.register(underPressure, {
    exposeStatusRoute: {
      routeResponseSchemaOpts: {
        version: false
      }
    }
  });

  fastify.register(httpProxy, {
    upstream: USER_SERVICE_URL,
    prefix: '/api/users',
    rewritePrefix: '/users',
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

  return fastify;
}

module.exports = { buildApp };
