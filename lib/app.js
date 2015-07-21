'use strict';

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

explorer.explore()
	.catch(function(error) {
		core.logger.error(error.message, error);
	})
	.finally(function() {
		core.logger.warn('Stoping app...', {
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
