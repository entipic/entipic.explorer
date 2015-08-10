'use strict';

// require('dotenv').load();
var core = require('entipic.core');

core.Logger.init({
	tags: ['entipic.worker'],
	json: true,
	// level: 'info'
});

if (process.env.MODE !== 'dev') {
	core.logger.warn('Starting app...', {
		maintenance: 'start'
	});
}

var explorer = require('./explorer');
var Data = require('./data');

function stop(error) {
	explorer.stop();

	if (error) {
		core.logger.error('Stoping with error: ' + error.message, error);
	}
}

function exit(error) {
	stop(error);

	setTimeout(function() {
		Data.close();
		/*eslint no-process-exit:0*/
		process.exit(0);
	}, 1000);
}

function start() {
	console.log('START');
	explorer.explore()
		.catch(function(error) {
			core.logger.error(error.message, error);
		})
		.finally(function() {
			core.logger.warn('Stoping app...', {
				maintenance: 'stop'
			});
			// exit();
		});
}

process.on('uncaughtException', stop);

process.on('SIGINT', exit);

var interval = setInterval(start, process.env.RUN_TIMEOUT * 1000 * 60 + 1000 * 60 * 2);

start();
