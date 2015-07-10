'use strict';

var core = require('entipic.core');
var Promise = core.Promise;
var request = require('request');
var external = module.exports;

function req(url, method) {
	method = method || 'GET';
	var options = {
		method: method,
		url: 'http://www.stateful.co' + url,
		headers: {
			'X-Sttc-URN': process.env.COUNTERS_USER,
			'X-Sttc-Token': process.env.COUNTERS_TOKEN,
			'Accept': 'text/plain'
		}
	};

	return new Promise(function(resolve, reject) {
		request(options,
			function(error, response, body) {
				if (error) {
					return reject(error);
				}
				resolve(body);
			});
	});
}

external.inc = external.increment = function(counter, count) {
	count = count || 1;
	return req('/c/' + counter + '/inc?value=' + count).then(function(result) {
		count = parseInt(result);
		if (isNaN(count)) {
			return Promise.reject(new Error('Count ' + counter + ' is in valid'));
		}
		return count;
	});
};
