module.exports = {
  http:{
    port: 3003,
  },
  transac: {
    host: 'localhost',
    port: 27017,
    database: 'transacs',
    auto_reconnect: true,
    poolSize: 100, 
    w: 1, 
    strict: true, 
    native_parser: true
  },
};
