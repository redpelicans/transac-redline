module.exports = {
  frontendApp: 'frontend',
  serverIp: '5.39.80.203',
  livereload: 35729,
  http:{ port: 80 },
  db: {
    host: 'mongo',
    port: 27017,
    database: 'transacs',
    auto_reconnect: true,
    poolSize: 10, 
    w: 1, 
    strict: true, 
    native_parser: true
  },
};
