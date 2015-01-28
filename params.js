module.exports = {
  frontendApp: 'frontend',
  http:{port: 80},
  db: {
    host: 'mongo',
    port: 27017,
    database: 'transacs',
    auto_reconnect: true,
    poolSize: 100, 
    w: 1, 
    strict: true, 
    native_parser: true
  },
};
