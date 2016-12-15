'use strict';

// require('dotenv').load();

const logger = require('./logger');

if (process.env.MODE !== 'dev') {
	logger.warn('Starting app...', {
		maintenance: 'start'
	});
}

var explorer = require('./explorer');

function stop(error) {
	explorer.stop();

	if (error) {
		logger.error('Stoping with error: ' + error.message, error);
	}
}

function exit(error) {
	stop(error);

	setTimeout(function() {
		/*eslint no-process-exit:0*/
		process.exit(0);
	}, 1000);
}

function start() {
	logger.info('STARTING...');
	explorer.explore()
		.catch(function(error) {
			logger.error(error.message, error);
		})
		.finally(function() {
			logger.warn('Stoping app...', {
				maintenance: 'stop'
			});
			// exit();
		});
}

process.on('uncaughtException', stop);

process.on('SIGINT', exit);

setInterval(start, parseInt(process.env.RUN_TIMEOUT || 20) * 1000 * 60 + 1000 * 60 * 2);

start();
