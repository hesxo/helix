const { buildApp } = require('./app');

const PORT = process.env.ORDER_SERVICE_PORT || 8082;
const HOST = '0.0.0.0';

async function start() {
  const app = buildApp();

  try {
    await app.listen({ host: HOST, port: PORT });
    app.log.info(`order-service listening on http://${HOST}:${PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
