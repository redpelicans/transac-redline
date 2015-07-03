export default {
  http: {
    port: process.env.PORT || 3005
  },
  rethinkdb: {
    host: 'rethinkdb',
    db: 'transacs'
  }
}
