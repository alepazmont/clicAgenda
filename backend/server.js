const app = require('./app');
const config = require('./config');

if (require.main === module) {
  const port = config.port;
  app.listen(port, () => {
    console.log(`${config.appName} backend en http://localhost:${port}`);
  });
}

module.exports = app;
