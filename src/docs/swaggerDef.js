const { version } = require('../../package.json');
const config = require('../config/config');

const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'CSX API documentation',
    version,
    license: {
      name: 'Tochie Infotech Pvt Ltd',
      url: '',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.port}/v1`,
      description: 'local server (uses test data)',
    },
  ],
};

module.exports = swaggerDef;
