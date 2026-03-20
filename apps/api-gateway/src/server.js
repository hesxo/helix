const { buildApp } = require('./app');

const PORT = process.env.API_GATEWAY_PORT || 8080;
const HOST = '0.0.0.0';

async function start() {
  const app = buildApp();

  try {
    await app.listen({ host: HOST, port: PORT });
    app.log.info(`api-gateway listening on http://${HOST}:${PORT}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
