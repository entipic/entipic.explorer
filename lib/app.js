require('dotenv').load();

var core = require('entipic.core');

core.Logger.init({
  tags: ['entipic.explorer'],
  json: true
});

if (process.env.MODE !== 'dev') {
  core.logger.warn('Starting app...', {
    maintenance: 'start'
  });
}

var explorer = require('./explorer');

explorer.explore().finally(function() {
  setTimeout(function() {
    return process.kill(process.pid);
  }, 1000 * 10);
});

setTimeout(function() {
  core.logger.warn('Stoping app...', {
    maintenance: 'stop'
  });
  explorer.stop();
}, 1000 * 60 * parseInt(process.env.TIMEOUT || 350));
