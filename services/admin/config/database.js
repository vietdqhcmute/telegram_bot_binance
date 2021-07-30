module.exports = ({ env }) => ({
  defaultConnection: 'default',
  connections: {
    default: {
      connector: 'mongoose',
      settings: {
        // client: 'mongo',
        // host: '54.169.255.84',
        // port: 27017,
        // database: 'signalbot',
        // username: 'signalbot',
        // password: 'signalbot',
        // uri: 'mongodb://signalbot:signalbot@54.169.255.84:27017/signalbot',
        uri: 'mongodb://localhost:27017/signalbot',
      },
      options: {
        // authenticationDatabase: env('AUTHENTICATION_DATABASE'),
        ssl: env('DATABASE_SSL'),
      },
    },
  },
});
