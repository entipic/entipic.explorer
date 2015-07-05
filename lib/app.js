require('dotenv').load();

var core = require('entipic.core');

core.Logger.init({
  tags: ['entipic.explorer'],
  json: true,
  level: 'info'
});

if (process.env.MODE !== 'dev') {
  core.logger.warn('Starting app...', {
    maintenance: 'start'
  });
}

var explorer = require('./explorer');

explorer.explore()
  .catch(function(error) {
    core.logger.error(error.message, error);
  })
  .finally(function() {
    core.logger.warn('Stoping app...', {
      maintenance: 'stop'
    });
    setTimeout(function() {
      return process.exit(0);
    }, 1000 * 10);
  });

setTimeout(function() {
  explorer.stop();
}, 1000 * 60 * parseInt(process.env.TIMEOUT || 350));

process.on('uncaughtException', function(err) {
  core.logger.error('uncaughtException: ' + err.message, {
    trace: err.trace
  });
});
