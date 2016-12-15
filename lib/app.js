'use strict';

require('dotenv').load();

const logger = require('./logger');

if (process.env.MODE !== 'dev') {
	logger.warn('Starting app...', {
		maintenance: 'start'
	});
}

const explorer = require('./explorer');

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
	}, 500);
}

explorer.explore()
	.catch(function(error) {
		console.log('with error', error);
		logger.error(error.message, error);
	})
	.finally(function() {
		logger.warn('Stoping app...', {
			maintenance: 'stop'
		});
		exit();
	});

process.on('uncaughtException', stop);

process.on('message', function(msg) {
	if (msg === 'shutdown') {
		// Your process is going to be reloaded
		// You have to close all database/socket.io/* connections

		// console.log('Closing all connections...');

		// You will have 4000ms to close all connections before
		// the reload mechanism will try to do its job

		exit();
	}
});

process.on('SIGINT', exit);
