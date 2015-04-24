module.exports = {
  frontendApp: 'frontend',
  http:{port: 80},
  db: {
    replicaSet:{
      servers:[
        {
          host: 'mongo',
          port: 27017
        }
      ],
      options:{
        auto_reconnect: true,
        poolSize: 10,
      }
    },
    database: 'transacs',
    w: 1, 
    strict: true, 
    native_parser: true
  },
};
